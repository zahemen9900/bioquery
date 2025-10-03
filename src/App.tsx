import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/AppLayout'
import AuthProvider from '@/contexts/AuthContext'
import ChatProvider from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/auth-context-types'
import { ThemeProvider } from '@/contexts/ThemeContext'
import AuthPage from '@/pages/auth'
import CollectionsPage from '@/pages/collections'
import DiscoverPage from '@/pages/discover'
import HomePage from '@/pages/home'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-scheme-background text-scheme-text">
        Preparing your workspace…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected routes with AppLayout */}
            <Route
              path="/discover"
              element={
                <ProtectedRoute>
                  <ChatProvider>
                    <AppLayout>
                      <DiscoverPage />
                    </AppLayout>
                  </ChatProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/collections"
              element={
                <ProtectedRoute>
                  <ChatProvider>
                    <AppLayout>
                      <CollectionsPage />
                    </AppLayout>
                  </ChatProvider>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
