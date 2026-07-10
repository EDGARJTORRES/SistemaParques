import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClientProvider } from '@/components/client-provider'

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'MPCH: SISPARQUES',
  description: 'Sistema de Mantenimiento de parques',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/img/logomuni3.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/img/logomuni3.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/img/logomuni3.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  )
}
