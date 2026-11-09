export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    try {
      const { prompt } = await request.json();
      
      // Get keys from Cloudflare environment secrets
      const rawKeys = env.GEMINI_API_KEYS;
      if (!rawKeys) throw new Error("GEMINI_API_KEYS secret not configured in Cloudflare");

      const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      let responseText = "";
      let success = false;
      let lastError = "";
      const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

      for (const key of keys) {
        for (const model of models) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
              }
            );
            const data = await response.json();
            if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
              responseText = data.candidates[0].content.parts[0].text;
              success = true;
              break;
            } else {
              lastError = data.error?.message || "Empty response from Gemini";
            }
          } catch (err) {
            lastError = err.message;
          }
        }
        if (success) break;
      }

      if (!success) throw new Error(`All keys/models failed. Last error: ${lastError}`);

      return new Response(JSON.stringify({ text: responseText }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }
};
