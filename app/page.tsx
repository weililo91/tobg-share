import { redirect } from 'next/navigation'

// share.tobg.app 根路徑直接轉到 App Store
export default function Home() {
  redirect('https://apps.apple.com/tw/app/tobg/id6791601219')
}
