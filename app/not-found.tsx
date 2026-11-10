import { APP_STORE_URL } from '@/lib/supabase'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🪨</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>找不到這個頁面</h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
        這個連結可能已失效，或內容尚未審核通過。
      </p>
      <a href={APP_STORE_URL} style={{
        background: '#FF9500', color: '#000', borderRadius: 14,
        padding: '14px 28px', fontWeight: 700, fontSize: 16,
      }}>
        下載 TOBG App
      </a>
    </div>
  )
}
