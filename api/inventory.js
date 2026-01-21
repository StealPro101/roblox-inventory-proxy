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
    
    // Search catalog for ALL gamepasses created by this user
    const url = `https://catalog.roblox.com/v1/search/items?category=Passes&creatorTargetId=${userId}&creatorType=User&limit=50&sortType=Relevance`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Catalog response:', JSON.stringify(data));
    
    if (data.data && data.data.length > 0) {
      for (const pass of data.data) {
        // Get price info for each gamepass
        try {
          const infoUrl = `https://economy.roblox.com/v1/game-passes/${pass.id}/game-pass-product-info`;
          const infoRes = await fetch(infoUrl);
          const info = await infoRes.json();
          
          allPasses.push({
            id: pass.id,
            name: info.Name || pass.name || 'Unknown',
            price: info.PriceInRobux || 0
          });
        } catch (e) {
          allPasses.push({
            id: pass.id,
            name: pass.name || 'Unknown',
            price: 0
          });
        }
      }
    }

    return res.status(200).json({ data: allPasses });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
