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
    
    // Test 1: Direct gamepass info (using your known gamepass)
    const directUrl = `https://economy.roblox.com/v1/game-passes/1677985142/game-pass-product-info`;
    try {
      const r = await fetch(directUrl);
      debug.directGamepass = await r.json();
    } catch (e) {
      debug.directGamepass = e.message;
    }
    
    // Test 2: Get user's games
    const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`;
    const gamesRes = await fetch(gamesUrl);
    const gamesData = await gamesRes.json();
    debug.gamesCount = gamesData.data ? gamesData.data.length : 0;
    
    if (gamesData.data) {
      for (const game of gamesData.data) {
        const universeId = game.id;
        debug.universeId = universeId;
        
        // Test 3: Try economy API for universe game passes
        const economyUrl = `https://economy.roblox.com/v2/universes/${universeId}/game-passes`;
        try {
          const r = await fetch(economyUrl);
          const d = await r.json();
          debug.economyApi = d;
          
          if (d.data) {
            for (const p of d.data) {
              allPasses.push({
                id: p.id,
                name: p.name || 'Unknown',
                price: p.price || 0
              });
            }
          }
        } catch (e) {
          debug.economyApi = e.message;
        }
        
        // Test 4: Try games API with different params
        const gamesPassUrl = `https://games.roblox.com/v1/games/${universeId}/game-passes?sortOrder=Asc&limit=100`;
        try {
          const r = await fetch(gamesPassUrl);
          debug.gamesPassApi = await r.json();
        } catch (e) {
          debug.gamesPassApi = e.message;
        }
      }
    }

    return res.status(200).json({ data: allPasses, debug });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
