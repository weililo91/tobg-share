import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchCrag, storageUrl, APP_STORE_URL } from '@/lib/supabase'
import type { Crag, Area, Boulder } from '@/lib/supabase'

// ─── Helpers ────────────────────────────────────────────────────────────────

function countRoutes(areas: Area[]): number {
  return areas.reduce((acc, area) =>
    acc + area.boulders.reduce((a2, b) =>
      a2 + b.boulder_faces.reduce((a3, f) =>
        a3 + f.route_segments.length, 0), 0), 0)
}

function gradeColor(grade: string): string {
  const n = parseInt(grade.replace('V', ''))
  if (n <= 2) return '#34C759'
  if (n <= 4) return '#FF9500'
  if (n <= 6) return '#FF3B30'
  return '#AF52DE'
}

// ─── OG Metadata (server-side) ───────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const crag = await fetchCrag(id)
  if (!crag) return { title: 'TOBG' }

  const totalBoulders = crag.areas.reduce((a, area) => a + area.boulders.length, 0)
  const totalRoutes = countRoutes(crag.areas)
  const coverImg = storageUrl(crag.cover_image_path)

  const description = [
    crag.city && crag.district ? `${crag.city} ${crag.district}` : (crag.city || crag.district),
    `${totalBoulders} 顆石頭`,
    `${totalRoutes} 條路線`,
  ].filter(Boolean).join(' · ')

  return {
    title: `${crag.name} | TOBG 台灣戶外抱石指南`,
    description,
    openGraph: {
      title: `${crag.name}`,
      description,
      url: `https://share.tobg.app/crag/${id}`,
      images: coverImg ? [{ url: coverImg, width: 1200, height: 630, alt: crag.name }] : [],
      type: 'website',
      locale: 'zh_TW',
      siteName: 'TOBG 台灣戶外抱石指南',
    },
    twitter: {
      card: 'summary_large_image',
      title: crag.name,
      description,
      images: coverImg ? [coverImg] : [],
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CragPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const crag = await fetchCrag(id)
  if (!crag) notFound()

  const coverImg = storageUrl(crag.cover_image_path)
  const totalBoulders = crag.areas.reduce((a, area) => a + area.boulders.length, 0)
  const totalRoutes = countRoutes(crag.areas)

  return (
    <>
      {/* ─ Hero ─ */}
      <div style={{ position: 'relative', width: '100%', height: 280, background: '#111' }}>
        {coverImg ? (
          <img
            src={coverImg}
            alt={crag.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,149,0,0.25) 0%, transparent 70%)',
          }} />
        )}
        {/* gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, #000 100%)',
        }} />
        {/* title */}
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          {crag.city && (
            <p style={{ fontSize: 13, color: 'rgba(255,149,0,0.9)', fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>
              {crag.city}{crag.district ? ` · ${crag.district}` : ''}
            </p>
          )}
          <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{crag.name}</h1>
        </div>
      </div>

      {/* ─ Stats row ─ */}
      <a href={APP_STORE_URL} style={{ display: 'block', background: 'var(--card)', margin: '0 16px', borderRadius: 'var(--r-card)', padding: '14px 16px', display: 'flex', gap: 24 }}>
        <StatItem value={crag.areas.length} label="個區域" />
        <div style={{ width: 1, background: 'var(--sep)' }} />
        <StatItem value={totalBoulders} label="顆石頭" />
        <div style={{ width: 1, background: 'var(--sep)' }} />
        <StatItem value={totalRoutes} label="條路線" />
      </a>

      {/* ─ Approach note ─ */}
      {crag.approach_details && (
        <Section title="路線指引">
          <p style={{ fontSize: 15, color: 'var(--text-sec)', lineHeight: 1.6 }}>
            {crag.approach_details}
          </p>
        </Section>
      )}

      {/* ─ Hazard ─ */}
      {crag.hazard_note && (
        <Section title="⚠️ 注意事項">
          <p style={{ fontSize: 14, color: 'rgba(255,149,0,0.9)', lineHeight: 1.6 }}>
            {crag.hazard_note}
          </p>
        </Section>
      )}

      {/* ─ Areas & Boulders ─ */}
      {crag.areas.map(area => (
        <AreaSection key={area.id} area={area} />
      ))}

      {/* ─ Bottom padding for CTA bar ─ */}
      <div style={{ height: 100 }} />

      {/* ─ Fixed CTA ─ */}
      <CtaBanner label={`在 App 中查看「${crag.name}」`} />
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>{value}</p>
      <p style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 2 }}>{label}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '20px 16px 0' }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-ter)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
        {title}
      </h2>
      <div style={{ background: 'var(--card)', borderRadius: 'var(--r-card)', padding: '14px 16px' }}>
        {children}
      </div>
    </div>
  )
}

function AreaSection({ area }: { area: Area }) {
  const hasImplicitDefault = area.name === ''
  const displayName = hasImplicitDefault ? '石頭列表' : area.name

  return (
    <div style={{ padding: '20px 16px 0' }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-ter)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
        {displayName}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {area.boulders
          .slice()
          .sort((a, b) => a.sequence_number - b.sequence_number)
          .map((boulder, idx) => (
            <BoulderRow key={boulder.id} boulder={boulder} index={idx} />
          ))}
      </div>
    </div>
  )
}

function BoulderRow({ boulder, index }: { boulder: Boulder; index: number }) {
  // collect all routes from all faces
  const allRoutes = boulder.boulder_faces.flatMap(f =>
    f.route_segments.map(seg => seg.route)
  )

  // cover image: first face photo
  const coverFace = boulder.boulder_faces
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)[0]
  const coverImg = storageUrl(coverFace?.photo_path)

  const isFirst = index === 0
  const isLast = index === -1 // will never be last here

  return (
    <a
      href={APP_STORE_URL}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--card)',
        borderRadius: index === 0 ? '12px 12px 4px 4px' : '4px',
        padding: '12px 16px',
      }}
    >
      {/* thumbnail */}
      <div style={{
        width: 52, height: 52, borderRadius: 8, overflow: 'hidden',
        background: 'var(--card2)', flexShrink: 0,
      }}>
        {coverImg && (
          <img src={coverImg} alt={boulder.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>

      {/* info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {boulder.name}
        </p>
        {allRoutes.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {allRoutes.slice(0, 5).map(r => (
              <span key={r.id} style={{
                fontSize: 11, fontWeight: 700, color: gradeColor(r.grade),
                background: `${gradeColor(r.grade)}22`,
                borderRadius: 4, padding: '1px 5px',
              }}>
                {r.grade}
              </span>
            ))}
            {allRoutes.length > 5 && (
              <span style={{ fontSize: 11, color: 'var(--text-ter)' }}>+{allRoutes.length - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* chevron */}
      <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
        <path d="M1 1L6 6L1 11" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

function CtaBanner({ label }: { label?: string }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--sep)',
      padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
    }}>
      <a
        href={APP_STORE_URL}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'var(--amber)',
          borderRadius: 'var(--r-btn)',
          height: 52,
          fontWeight: 700,
          fontSize: 16,
          color: '#000',
          width: '100%',
        }}
      >
        <AppStoreIcon />
        {label || '在 App 中查看完整內容'}
      </a>
    </div>
  )
}

function AppStoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M13.5 2H6.5C4.01 2 2 4.01 2 6.5V13.5C2 15.99 4.01 18 6.5 18H13.5C15.99 18 18 15.99 18 13.5V6.5C18 4.01 15.99 2 13.5 2Z" fill="black" stroke="black" strokeWidth="0"/>
      <path d="M7.5 13.5L10 9.5L12.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 13.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 9.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
