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
    
    // Use roproxy instead of direct roblox.com
    const gamesUrl = `https://games.roproxy.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`;
    
    const gamesRes = await fetch(gamesUrl);
    const gamesData = await gamesRes.json();
    debug.gamesResponse = gamesData;
    
    if (gamesData.data && gamesData.data.length > 0) {
      for (const game of gamesData.data) {
        const universeId = game.id;
        
        // Get gamepasses for this universe via roproxy
        const passesUrl = `https://games.roproxy.com/v1/games/${universeId}/game-passes?sortOrder=Asc&limit=100`;
        
        try {
          const passesRes = await fetch(passesUrl);
          const passesData = await passesRes.json();
          debug[`passes_${universeId}`] = passesData;
          
          if (passesData.data) {
            for (const pass of passesData.data) {
              allPasses.push({
                id: pass.id,
                name: pass.name || 'Unknown',
                price: pass.price || 0
              });
            }
          }
        } catch (e) {
          debug[`error_${universeId}`] = e.message;
        }
      }
    }

    return res.status(200).json({ data: allPasses, debug });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
