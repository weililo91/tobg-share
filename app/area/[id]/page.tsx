import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchArea, storageUrl, APP_STORE_URL } from '@/lib/supabase'
import type { Boulder, BoulderFace } from '@/lib/supabase'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const area = await fetchArea(id)
  if (!area) return { title: 'TOBG' }

  const totalRoutes = area.boulders.reduce((a, b) =>
    a + b.boulder_faces.reduce((a2, f) => a2 + f.route_segments.length, 0), 0)

  const description = `${area.crag.name} · ${area.boulders.length} 顆石頭 · ${totalRoutes} 條路線`

  return {
    title: `${area.name || area.crag.name} | TOBG`,
    description,
    openGraph: {
      title: area.name || area.crag.name,
      description,
      url: `https://share.tobg.app/area/${id}`,
      type: 'website',
      locale: 'zh_TW',
      siteName: 'TOBG 台灣戶外抱石指南',
    },
  }
}

export default async function AreaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const area = await fetchArea(id)
  if (!area) notFound()

  const displayName = area.name || area.crag.name

  return (
    <>
      {/* breadcrumb */}
      <div style={{ padding: '16px 16px 0' }}>
        <a href={`/crag/${area.crag_id}`} style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>
          ← {area.crag.name}
        </a>
      </div>

      {/* header */}
      <div style={{ padding: '12px 16px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>{displayName}</h1>
        {area.intro_text && (
          <p style={{ fontSize: 14, color: 'var(--text-sec)', marginTop: 6, lineHeight: 1.6 }}>
            {area.intro_text}
          </p>
        )}
      </div>

      {/* boulders */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {area.boulders
          .slice()
          .sort((a, b) => a.sequence_number - b.sequence_number)
          .map(boulder => (
            <BoulderCard key={boulder.id} boulder={boulder} />
          ))}
      </div>

      <div style={{ height: 100 }} />

      <CtaBanner label={`在 App 中查看「${displayName}」`} />
    </>
  )
}

function BoulderCard({ boulder }: { boulder: Boulder }) {
  const allRoutes = boulder.boulder_faces.flatMap(f => f.route_segments.map(s => s.route))
  const coverFace = boulder.boulder_faces.slice().sort((a, b) => a.sort_order - b.sort_order)[0]
  const coverImg = storageUrl(coverFace?.photo_path)

  return (
    <a
      href={APP_STORE_URL}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--card)', borderRadius: 8, padding: '12px 14px',
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', background: 'var(--card2)', flexShrink: 0 }}>
        {coverImg && <img src={coverImg} alt={boulder.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {boulder.name}
        </p>
        {allRoutes.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {allRoutes.slice(0, 5).map(r => (
              <span key={r.id} style={{
                fontSize: 11, fontWeight: 700, color: gradeColor(r.grade),
                background: `${gradeColor(r.grade)}22`, borderRadius: 4, padding: '1px 5px',
              }}>{r.grade}</span>
            ))}
          </div>
        )}
      </div>
      <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
        <path d="M1 1L6 6L1 11" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

function gradeColor(grade: string): string {
  const n = parseInt(grade.replace('V', ''))
  if (n <= 2) return '#34C759'
  if (n <= 4) return '#FF9500'
  if (n <= 6) return '#FF3B30'
  return '#AF52DE'
}

function CtaBanner({ label }: { label?: string }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid var(--sep)',
      padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
    }}>
      <a href={APP_STORE_URL} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: 'var(--amber)', borderRadius: 14, height: 52,
        fontWeight: 700, fontSize: 16, color: '#000', width: '100%',
      }}>
        {label || '在 App 中查看完整內容'}
      </a>
    </div>
  )
}
