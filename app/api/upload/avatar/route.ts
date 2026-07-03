import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // 5MB 제한
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'JPG, PNG, WEBP, GIF 파일만 업로드할 수 있습니다' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `avatars/${session.user.id}.${ext}`

  const blob = await put(filename, file, {
    access: 'public',
    allowOverwrite: true,
  })

  // DB user.image 업데이트
  await db
    .update(user)
    .set({ image: blob.url, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))

  return NextResponse.json({ url: blob.url })
}
