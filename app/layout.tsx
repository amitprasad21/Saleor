import Navbar from '@/components/Navbar'
import './globals.css'
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '600', '700']
 })

export const metadata: Metadata = {
  title: 'Saleor',
  description: 'Track product prices effortlessly and save money on your online shopping.',
  icons: {
    icon: '/favicon.png'
  }
}

import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider>
          <main className="max-w-10xl mx-auto min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1">
              {children}
            </div>
            
            {/* Standard Footer */}
            <footer className="w-full border-t mt-auto py-8 text-center text-sm text-gray-500 flex flex-col items-center gap-4">
              <div className="flex items-center gap-0">
                <img src="/logo.png" alt="logo" className="w-[56px] h-[56px] object-contain -mr-1" />
                <span className="font-spaceGrotesk font-bold text-[34px] text-primary">Saleor</span>
              </div>
              <p>© 2026 Saleor. All rights reserved.</p>
            </footer>
          </main>
        </ClerkProvider>
      </body>
    </html>
  )
}
