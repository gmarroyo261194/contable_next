import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  )
}
