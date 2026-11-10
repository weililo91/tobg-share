import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TOBG | 台灣戶外抱石指南',
  description: '在地台灣戶外抱石社群。尋找岩場、發現石頭、查看路線。',
  metadataBase: new URL('https://share.tobg.app'),
  openGraph: {
    siteName: 'TOBG 台灣戶外抱石指南',
    type: 'website',
    locale: 'zh_TW',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}
