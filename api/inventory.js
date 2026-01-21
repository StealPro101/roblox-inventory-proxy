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
    const gamesResponse = await fetch(
      `https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&limit=50&sortOrder=Asc`,
      { headers: { 'Accept': 'application/json' } }
    );
    const gamesData = await gamesResponse.json();

    if (!gamesData.data || gamesData.data.length === 0) {
      return res.status(200).json({ data: [], message: 'No games found for user' });
    }

    const allGamePasses = [];
    
    for (const game of gamesData.data) {
      const universeId = game.id;
      const passesResponse = await fetch(
        `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100&sortOrder=Asc`,
        { headers: { 'Accept': 'application/json' } }
      );
      const passesData = await passesResponse.json();

      if (passesData.data) {
        for (const pass of passesData.data) {
          allGamePasses.push({
            id: pass.id,
            name: pass.name,
            price: pass.price || 0,
            gameId: universeId,
            gameName: game.name
          });
        }
      }
    }

    return res.status(200).json({ data: allGamePasses });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
