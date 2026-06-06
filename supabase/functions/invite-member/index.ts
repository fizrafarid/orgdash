import { createClient } from '@supabase/supabase-js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Missing authorization header' }, 401)
  }
  const token = authHeader.slice(7)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
  if (authError || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let body: { organization_id?: string; email?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { organization_id, email } = body

  if (!organization_id || !email) {
    return json({ error: 'organization_id and email are required' }, 400)
  }

  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Invalid email address' }, 400)
  }

  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .select('created_by')
    .eq('id', organization_id)
    .single()

  if (orgError || !org) {
    return json({ error: 'Organization not found' }, 404)
  }

  if (org.created_by !== user.id) {
    return json({ error: 'Not authorized' }, 403)
  }

  const { data: existing } = await adminClient
    .from('organization_members')
    .select('id')
    .eq('organization_id', organization_id)
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return json({ error: 'Member already invited' }, 409)
  }

  const { data: member, error: insertError } = await adminClient
    .from('organization_members')
    .insert({ organization_id, email, status: 'invited', role: 'member' })
    .select()
    .single()

  if (insertError) {
    return json({ error: insertError.message }, 500)
  }

  return json(member, 200)
})
