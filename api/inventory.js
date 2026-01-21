export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const allPasses = [];
    const debug = {};
    
    // Method 1: Get user's games
    const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`;
    const gamesRes = await fetch(gamesUrl);
    const gamesData = await gamesRes.json();
    debug.games = gamesData.data ? gamesData.data.length : 0;
    
    if (gamesData.data) {
      for (const game of gamesData.data) {
        // Try multiple endpoints for each game
        const universeId = game.id;
        const placeId = game.rootPlace?.id;
        
        // Endpoint 1: games.roblox.com with universeId
        const url1 = `https://games.roblox.com/v1/games/${universeId}/game-passes?sortOrder=Asc&limit=100`;
        // Endpoint 2: develop API
        const url2 = `https://develop.roblox.com/v1/universes/${universeId}/passes?page=1&pageSize=50&isArchived=false`;
        // Endpoint 3: www.roblox.com legacy
        const url3 = `https://www.roblox.com/games/${placeId}/game-passes-json`;
        
        for (const url of [url1, url2, url3]) {
          try {
            const r = await fetch(url);
            const d = await r.json();
            debug[url.substring(0, 60)] = d;
            
            const items = d.data || d.passes || d.Data || d;
            if (Array.isArray(items) && items.length > 0) {
              for (const p of items) {
                const id = p.id || p.Id || p.AssetId || p.assetId;
                const name = p.name || p.Name || 'Unknown';
                const price = p.price || p.Price || p.PriceInRobux || 0;
                if (id && !allPasses.find(x => x.id === id)) {
                  allPasses.push({ id, name, price });
                }
              }
            }
          } catch (e) {}
        }
      }
    }
    
    // Method 2: Try catalog search
    const catalogUrl = `https://catalog.roblox.com/v1/search/items?category=Passes&creatorTargetId=${userId}&creatorType=User&limit=50`;
    try {
      const r = await fetch(catalogUrl);
      const d = await r.json();
      debug.catalog = d.data ? d.data.length : 0;
      if (d.data) {
        for (const p of d.data) {
          if (!allPasses.find(x => x.id === p.id)) {
            allPasses.push({ id: p.id, name: p.name || 'Unknown', price: 0 });
          }
        }
      }
    } catch (e) {}

    return res.status(200).json({ data: allPasses, debug });
    
  } catch (error) {
    return res.status(500).json({ error: error.message, debug: {} });
  }
}
