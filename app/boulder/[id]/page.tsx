import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchBoulder, storageUrl, APP_STORE_URL } from '@/lib/supabase'
import type { BoulderFace, Route } from '@/lib/supabase'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const boulder = await fetchBoulder(id)
  if (!boulder) return { title: 'TOBG' }

  const allRoutes = boulder.boulder_faces.flatMap(f => f.route_segments.map(s => s.route))
  const grades = [...new Set(allRoutes.map(r => r.grade))].join(' · ')
  const description = `${boulder.area.crag.name} · ${boulder.area.name || ''} · ${allRoutes.length} 條路線${grades ? ` (${grades})` : ''}`

  const coverFace = boulder.boulder_faces.slice().sort((a, b) => a.sort_order - b.sort_order)[0]
  const coverImg = storageUrl(coverFace?.photo_path)

  return {
    title: `${boulder.name} | TOBG`,
    description,
    openGraph: {
      title: boulder.name,
      description,
      url: `https://share.tobg.app/boulder/${id}`,
      images: coverImg ? [{ url: coverImg, width: 1200, height: 630, alt: boulder.name }] : [],
      type: 'website',
      locale: 'zh_TW',
      siteName: 'TOBG 台灣戶外抱石指南',
    },
    twitter: {
      card: 'summary_large_image',
      title: boulder.name,
      description,
      images: coverImg ? [coverImg] : [],
    },
  }
}

export default async function BoulderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const boulder = await fetchBoulder(id)
  if (!boulder) notFound()

  const allRoutes = boulder.boulder_faces.flatMap(f =>
    f.route_segments.map(seg => seg.route)
  )

  return (
    <>
      {/* breadcrumb */}
      <div style={{ padding: '16px 16px 0' }}>
        <a href={`/crag/${boulder.area.crag.id}`} style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>
          ← {boulder.area.crag.name}
        </a>
      </div>

      {/* header */}
      <div style={{ padding: '10px 16px 16px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>{boulder.name}</h1>
        {boulder.notes && (
          <p style={{ fontSize: 14, color: 'var(--text-sec)', marginTop: 6, lineHeight: 1.6 }}>
            {boulder.notes}
          </p>
        )}
      </div>

      {/* Face photos */}
      {boulder.boulder_faces
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(face => (
          <FaceSection key={face.id} face={face} />
        ))}

      {/* Finding notes */}
      {boulder.finding_notes && (
        <div style={{ padding: '0 16px 16px' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-ter)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            找到石頭
          </h2>
          <div style={{ background: 'var(--card)', borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6 }}>
              {boulder.finding_notes}
            </p>
          </div>
        </div>
      )}

      <div style={{ height: 100 }} />

      <CtaBanner boulderName={boulder.name} routeCount={allRoutes.length} />
    </>
  )
}

function FaceSection({ face }: { face: BoulderFace }) {
  const photoUrl = storageUrl(face.photo_path)
  const routes = face.route_segments.map(s => s.route)
  const faceLabel = face.label && !face.is_implicit_default ? face.label : null

  return (
    <a href={APP_STORE_URL} style={{ display: 'block', margin: '0 0 2px' }}>
      {/* face photo */}
      <div style={{ position: 'relative', background: '#111', aspectRatio: '4/3', overflow: 'hidden' }}>
        {photoUrl && (
          <img src={photoUrl} alt={faceLabel || '面照片'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {faceLabel && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
            borderRadius: 6, padding: '3px 8px',
            fontSize: 12, fontWeight: 600, color: 'rgba(255,149,0,0.9)',
          }}>
            {faceLabel}
          </div>
        )}
        {/* topo hint */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
          borderRadius: 6, padding: '3px 8px',
          fontSize: 11, color: 'rgba(255,255,255,0.7)',
        }}>
          在 App 中查看 Topo →
        </div>
      </div>

      {/* routes under this face */}
      {routes.length > 0 && (
        <div style={{ background: 'var(--card)', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {routes.map(r => <RouteRow key={r.id} route={r} />)}
        </div>
      )}
    </a>
  )
}

function RouteRow({ route }: { route: Route }) {
  const color = gradeColor(route.grade)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        fontSize: 13, fontWeight: 800, color,
        background: `${color}22`, borderRadius: 5, padding: '2px 7px', flexShrink: 0,
      }}>
        {route.grade}
      </span>
      <span style={{ fontSize: 15, fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {route.name}
      </span>
      {route.first_ascent_by && (
        <span style={{ fontSize: 12, color: 'var(--text-ter)', flexShrink: 0 }}>
          FA: {route.first_ascent_by}
        </span>
      )}
    </div>
  )
}

function gradeColor(grade: string): string {
  const n = parseInt(grade.replace('V', ''))
  if (n <= 2) return '#34C759'
  if (n <= 4) return '#FF9500'
  if (n <= 6) return '#FF3B30'
  return '#AF52DE'
}

function CtaBanner({ boulderName, routeCount }: { boulderName: string; routeCount: number }) {
  const label = routeCount > 0
    ? `查看完整 Topo (${routeCount} 條路線)`
    : `在 App 中查看「${boulderName}」`
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
        {label}
      </a>
    </div>
  )
}
