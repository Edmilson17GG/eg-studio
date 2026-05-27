export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Cle API manquante' });

  try {
    // Parse le body manuellement si nécessaire
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    if (!body) {
      return res.status(400).json({ error: 'Body vide' });
    }

    // Construit le payload Anthropic proprement
    const payload = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: body.max_tokens || 1000,
      messages: body.messages || [],
    };

    // Ajoute system prompt si présent
    if (body.system) {
      payload.system = body.system;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', JSON.stringify(data));
      return res.status(response.status).json({ 
        error: data.error?.message || 'Erreur Anthropic',
        details: data 
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
