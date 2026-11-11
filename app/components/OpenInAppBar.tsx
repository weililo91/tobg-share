'use client'

import { APP_STORE_URL } from '@/lib/supabase'

type EntityType = 'crag' | 'area' | 'boulder'

export default function OpenInAppBar({ entity, id }: { entity: EntityType; id: string }) {
  function handleOpen() {
    // 嘗試用 custom URL scheme 喚起 App
    window.location.href = `tobg://${entity}/${id}`
    // 1.5 秒後若 App 未安裝，跳 App Store
    setTimeout(() => {
      window.location.href = APP_STORE_URL
    }, 1500)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#1C1C1E',
      borderTop: '1px solid #2C2C2E',
      padding: '12px 16px',
      paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 100,
    }}>
      {/* App icon */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/app-icon.jpg"
        alt="TOBG"
        width={44}
        height={44}
        style={{
          borderRadius: 10,
          flexShrink: 0,
          objectFit: 'cover',
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>
          TOBG 台灣戶外抱石指南
        </div>
        <div style={{ color: '#8E8E93', fontSize: 13, marginTop: 2 }}>
          在 App 中查看完整內容
        </div>
      </div>

      <button
        onClick={handleOpen}
        style={{
          background: '#FF9500',
          color: '#000000',
          border: 'none',
          borderRadius: 20,
          padding: '8px 18px',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        開啟
      </button>
    </div>
  )
}
