import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.552.0"
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.552.0"

const r2AccountId = Deno.env.get('R2_ACCOUNT_ID') ?? ''
const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID') ?? ''
const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY') ?? ''
const r2BucketName = Deno.env.get('R2_BUCKET_NAME') ?? 'fika-assets'
const r2PublicUrl = Deno.env.get('NEXT_PUBLIC_R2_PUBLIC_URL') ?? 'https://assets.fika.tz'

// Configure S3 client pointing to Cloudflare R2 Endpoint
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
})

serve(async (req) => {
  // CORS config
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  try {
    const { filePath, contentType } = await req.json()

    if (!filePath) {
      return new Response(JSON.stringify({ error: 'filePath parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    const command = new PutObjectCommand({
      Bucket: r2BucketName,
      Key: filePath,
      ContentType: contentType || 'image/jpeg',
    })

    // Generate signed URL valid for 15 minutes (900 seconds)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 })
    const publicUrl = `${r2PublicUrl}/${filePath}`

    return new Response(JSON.stringify({ uploadUrl, publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
