import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'I\'m Feeling Lucky',
  description: 'Feeling Lucky but as a webpage. Spin the wheel to visit a random website.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
