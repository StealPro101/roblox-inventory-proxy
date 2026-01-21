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

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.roblox.com/'
  };

  try {
    const allPasses = [];
    const debug = {};
    
    // Get user's games
    const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`;
    const gamesRes = await fetch(gamesUrl, { headers });
    const gamesData = await gamesRes.json();
    debug.gamesCount = gamesData.data?.length || 0;
    
    if (gamesData.data) {
      for (const game of gamesData.data) {
        const universeId = game.id;
        
        // Try www.roblox.com endpoint (legacy, sometimes works better)
        const legacyUrl = `https://www.roblox.com/games/getgamepassespaged?placeId=${game.rootPlace?.id}&startIndex=0&maxRows=100`;
        try {
          const r = await fetch(legacyUrl, { headers });
          const text = await r.text();
          debug.legacyRaw = text.substring(0, 200);
          
          try {
            const d = JSON.parse(text);
            if (d.data?.Items) {
              for (const p of d.data.Items) {
                allPasses.push({
                  id: p.Item?.AssetId || p.AssetId,
                  name: p.Item?.Name || p.Name || 'Unknown',
                  price: p.Product?.PriceInRobux || p.PriceInRobux || 0
                });
              }
            }
          } catch (e) {}
        } catch (e) {
          debug.legacyError = e.message;
        }
        
        // Also try apis.roblox.com
        const apisUrl = `https://apis.roblox.com/game-passes/v1/game-passes?universeIds=${universeId}`;
        try {
          const r = await fetch(apisUrl, { headers });
          const d = await r.json();
          debug.apisRoblox = d;
          if (d.data) {
            for (const p of d.data) {
              if (!allPasses.find(x => x.id === p.id)) {
                allPasses.push({ id: p.id, name: p.name, price: p.price || 0 });
              }
            }
          }
        } catch (e) {}
      }
    }

    return res.status(200).json({ data: allPasses, debug });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
