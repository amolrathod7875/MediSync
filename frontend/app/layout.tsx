import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MediSync - AI Shift-Handoff & Discharge Copilot',
  description: 'AI-powered clinical documentation with RAG-based generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-primary-600">
                    MediSync
                  </h1>
                  <span className="ml-2 text-sm text-gray-500">
                    AI Discharge & Handoff Copilot
                  </span>
                </div>
                <nav className="flex space-x-4">
                  <a href="/" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </a>
                  <a href="/upload" className="text-gray-600 hover:text-gray-900">
                    Upload
                  </a>
                  <a href="/documents" className="text-gray-600 hover:text-gray-900">
                    Documents
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
