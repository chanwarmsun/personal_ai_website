import { NextRequest, NextResponse } from 'next/server'
import { skillOperations } from '../../../../lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skillId } = body

    if (!skillId) {
      return NextResponse.json({ error: '缺少 skillId 参数' }, { status: 400 })
    }

    // 增加下载计数
    const updatedSkill = await skillOperations.incrementDownloads(skillId)

    if (!updatedSkill) {
      return NextResponse.json({ error: '技能不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, skill: updatedSkill })
  } catch (error) {
    console.error('技能下载计数失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
