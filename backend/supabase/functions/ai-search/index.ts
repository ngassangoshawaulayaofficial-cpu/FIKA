// Deno HTTP server handler for AI Search
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const url = new URL(req.url)
  const query = url.searchParams.get('q') ?? ''

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter "q" is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // Parse natural query keywords (Mock implementation)
  const category = query.toLowerCase().includes('barber') ? 'barber' : 'hairstylist'

  return new Response(JSON.stringify({
    success: true,
    parsed: {
      category,
      rawQuery: query,
      keywords: query.split(' ')
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
