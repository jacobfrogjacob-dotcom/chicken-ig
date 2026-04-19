import type { Metadata } from 'next'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'

export const metadata: Metadata = {
  title: 'IG粉絲小程序',
  description: 'IG粉絲抽卡系統',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}