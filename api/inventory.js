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
    
    // Get user's games via roproxy
    const gamesUrl = `https://games.roproxy.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`;
    const gamesRes = await fetch(gamesUrl);
    const gamesData = await gamesRes.json();
    debug.games = gamesData;
    
    if (gamesData.data) {
      for (const game of gamesData.data) {
        const universeId = game.id;
        const placeId = game.rootPlace?.id;
        debug.universeId = universeId;
        debug.placeId = placeId;
        
        // Try multiple endpoints
        const endpoints = [
          `https://games.roproxy.com/v1/games/${universeId}/game-passes?sortOrder=Asc&limit=100`,
          `https://economy.roproxy.com/v1/universes/${universeId}/gamepasses`,
          `https://apis.roproxy.com/game-passes/v1/game-passes?universeId=${universeId}`,
          `https://www.roproxy.com/games/getgamepassespaged?universeId=${universeId}&startIndex=0&maxRows=50`
        ];
        
        for (let i = 0; i < endpoints.length; i++) {
          try {
            const r = await fetch(endpoints[i]);
            const text = await r.text();
            debug[`endpoint${i}`] = text.substring(0, 300);
            
            try {
              const d = JSON.parse(text);
              const items = d.data || d.Data || d.Items || [];
              if (Array.isArray(items) && items.length > 0) {
                for (const p of items) {
                  const id = p.id || p.Id || p.AssetId;
                  const name = p.name || p.Name || 'Unknown';
                  const price = p.price || p.Price || p.PriceInRobux || 0;
                  if (id && !allPasses.find(x => x.id === id)) {
                    allPasses.push({ id, name, price });
                  }
                }
              }
            } catch (e) {}
          } catch (e) {}
        }
      }
    }

    return res.status(200).json({ data: allPasses, debug });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
