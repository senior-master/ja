export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 1. Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // 2. Handle browser GET requests gracefully
    if (request.method === 'GET') {
      return new Response(JSON.stringify({ status: "Worker is active!", message: "Send a POST request to use the AI." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { prompt } = await request.json();
      
      const rawKeys = env.GEMINI_API_KEYS;
      if (!rawKeys) throw new Error("GEMINI_API_KEYS secret not configured");

      const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      let responseText = "";
      let success = false;
      let lastError = "";
      
      // Use only the fastest model to prevent CPU timeouts
      const model = "gemini-3.5-flash-lite"; 

      for (const key of keys) {
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
            break; // Success! Stop looping
          } else {
            lastError = data.error?.message || `API Error: ${response.status}`;
          }
        } catch (err) {
          lastError = err.message;
        }
      }

      if (!success) throw new Error(`All keys failed. Last error: ${lastError}`);

      return new Response(JSON.stringify({ text: responseText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};
