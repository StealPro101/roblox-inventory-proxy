export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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
    
    // Method 1: Get user's games first
    const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`;
    const gamesRes = await fetch(gamesUrl);
    const gamesData = await gamesRes.json();
    debug.games = gamesData;
    
    // Method 2: Try getting universes (all games, not just public)
    const universesUrl = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=All&limit=50`;
    const universesRes = await fetch(universesUrl);
    const universesData = await universesRes.json();
    debug.universes = universesData;
    
    // Method 3: Catalog search
    const catalogUrl = `https://catalog.roblox.com/v1/search/items?category=Passes&creatorTargetId=${userId}&creatorType=User&limit=50`;
    const catalogRes = await fetch(catalogUrl);
    const catalogData = await catalogRes.json();
    debug.catalog = catalogData;
    
    // If we found games, get their gamepasses
    const gamesToCheck = gamesData.data || universesData.data || [];
    debug.gamesFound = gamesToCheck.length;
    
    for (const game of gamesToCheck) {
      const passesUrl = `https://games.roblox.com/v1/games/${game.id}/game-passes?limit=100`;
      const passesRes = await fetch(passesUrl);
      const passesData = await passesRes.json();
      
      debug[`game_${game.id}_passes`] = passesData;
      
      if (passesData.data) {
        for (const pass of passesData.data) {
          allPasses.push({
            id: pass.id,
            name: pass.name || 'Unknown',
            price: pass.price || 0
          });
        }
      }
    }
    
    // Add catalog passes if any
    if (catalogData.data) {
      for (const pass of catalogData.data) {
        if (!allPasses.find(p => p.id === pass.id)) {
          allPasses.push({
            id: pass.id,
            name: pass.name || 'Unknown',
            price: 0
          });
        }
      }
    }

    return res.status(200).json({ 
      data: allPasses,
      debug: debug 
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
