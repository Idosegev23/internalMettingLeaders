import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'מסמך התנעה - לידרס 2025',
  description: 'טופס פגישת בריף פנימית',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  )
}

