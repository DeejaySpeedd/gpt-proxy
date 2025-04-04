export default async function handler(req, res) {
  // Povolit CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Odpověď na preflight
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Použij POST metodu.' });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Chybí dotaz.' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Z uživatelského dotazu "${query}" navrhni nejrelevantnější název produktu nebo klíčová slova pro e-shop. Odpověz pouze jednou větou, bez úvodu.`
          }
        ]
      })
    });

    const data = await openaiRes.json();
    res.status(200).json({ answer: data.choices[0].message.content.trim() });

  } catch (error) {
    res.status(500).json({ error: 'Chyba serveru: ' + error.message });
  }
}
