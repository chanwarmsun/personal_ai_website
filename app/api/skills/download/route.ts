import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type SkillRecord = {
  id: string
  name: string
  file_url: string | null
  downloads: number | null
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables are missing')
  }

  return createClient(url, key)
}

async function findSkill(params: { id?: string; skillId?: string; name?: string }) {
  const supabase = getSupabaseClient()
  const resolvedId = params.id || params.skillId
  const resolvedName = params.name?.trim()

  if (resolvedId) {
    const { data, error } = await supabase
      .from('skills')
      .select('id,name,file_url,downloads')
      .eq('id', resolvedId)
      .maybeSingle()

    if (error) throw error
    return data as SkillRecord | null
  }

  if (resolvedName) {
    const { data, error } = await supabase
      .from('skills')
      .select('id,name,file_url,downloads')
      .eq('name', resolvedName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data as SkillRecord | null
  }

  return null
}

async function increaseDownloads(skillId: string, currentDownloads: number | null) {
  const supabase = getSupabaseClient()
  const nextDownloads = (currentDownloads || 0) + 1

  await supabase
    .from('skills')
    .update({ downloads: nextDownloads })
    .eq('id', skillId)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const skill = await findSkill({
      id: body?.id,
      skillId: body?.skillId,
      name: body?.name
    })

    if (!skill) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 })
    }

    if (!skill.file_url) {
      return NextResponse.json({ success: false, error: 'Skill file URL is missing' }, { status: 400 })
    }

    await increaseDownloads(skill.id, skill.downloads)

    return NextResponse.json({
      success: true,
      id: skill.id,
      name: skill.name,
      downloadUrl: skill.file_url
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Download API failed' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const skill = await findSkill({
      id: searchParams.get('id') || undefined,
      skillId: searchParams.get('skillId') || undefined,
      name: searchParams.get('name') || undefined
    })

    if (!skill) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 })
    }

    if (!skill.file_url) {
      return NextResponse.json({ success: false, error: 'Skill file URL is missing' }, { status: 400 })
    }

    await increaseDownloads(skill.id, skill.downloads)
    return NextResponse.redirect(skill.file_url, { status: 307 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Download API failed' },
      { status: 500 }
    )
  }
}
