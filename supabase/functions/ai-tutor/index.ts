import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()
    
    const rawKeys = Deno.env.get('GEMINI_API_KEYS')
    if (!rawKeys) throw new Error("GEMINI_API_KEYS secret not found")

    const keys = rawKeys.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0)
    
    let responseText = ""
    let success = false
    let lastError = ""
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

    for (const key of keys) {
      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              })
            }
          )
          const data = await response.json()
          if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            responseText = data.candidates[0].content.parts[0].text
            success = true
            break
          } else {
            lastError = data.error?.message || "Empty response from Gemini"
          }
        } catch (err: any) {
          lastError = err.message
        }
      }
      if (success) break
    }

    if (!success) {
      throw new Error(`All keys/models failed. Last error: ${lastError}`)
    }

    return new Response(
      JSON.stringify({ text: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
