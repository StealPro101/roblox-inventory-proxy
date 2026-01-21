export default async function handler(req, res) {
  // Enable CORS
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
    const response = await fetch(
      `https://inventory.roblox.com/v1/users/${userId}/items/GamePass?limit=100`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RobloxProxy/1.0'
        }
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
}
