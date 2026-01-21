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
    
    // Step 1: Get user's games (universes)
    const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`;
    const gamesRes = await fetch(gamesUrl);
    const gamesData = await gamesRes.json();
    
    if (gamesData.data && gamesData.data.length > 0) {
      for (const game of gamesData.data) {
        const universeId = game.id;
        
        // Step 2: Use the DEVELOP API to get passes for each universe
        const passesUrl = `https://develop.roblox.com/v1/universes/${universeId}/passes?page=1&pageSize=50&isArchived=false`;
        
        try {
          const passesRes = await fetch(passesUrl);
          const passesData = await passesRes.json();
          
          if (passesData.data) {
            for (const pass of passesData.data) {
              allPasses.push({
                id: pass.id,
                name: pass.name || 'Unknown',
                price: pass.price || 0,
                universeId: universeId
              });
            }
          }
        } catch (e) {
          console.log('Pass fetch error:', e);
        }
      }
    }

    return res.status(200).json({ data: allPasses });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
