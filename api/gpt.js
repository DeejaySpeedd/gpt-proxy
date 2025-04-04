let lastRequest = 0; // poslední čas požadavku (basic rate limit)

export default async function handler(req, res) {
  // Povolit CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  // Preflight request pro CORS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Povolit jen POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Použij POST metodu." });
  }

  // Rate limit: 1 požadavek za 2 sekundy
  const now = Date.now();
  if (now - lastRequest < 2000) {
    return res.status(429).json({ error: "Zkus to prosím za chvíli (ochrana proti přetížení)." });
  }
  lastRequest = now;

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Chybí dotaz." });
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Z uživatelského dotazu "${query}" navrhni nejrelevantnější název produktu nebo klíčová slova pro e-shop. Odpověz pouze jednou větou, bez úvodu.`
          }
        ]
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("Chyba od OpenAI:", data);
      return res.status(openaiRes.status).json({
        error: data?.error?.message || "Chyba z OpenAI"
      });
    }

    res.status(200).json({
      answer: data.choices?.[0]?.message?.content?.trim() || ""
    });
  } catch (err) {
    console.error("Chyba na serveru:", err);
    res.status(500).json({ error: "Chyba serveru: " + err.message });
  }
}

