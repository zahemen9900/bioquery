import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import { ChatProvider } from '@/contexts/ChatContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import AuthPage from '@/pages/auth'
import CollectionsPage from '@/pages/collections'
import DiscoverPage from '@/pages/discover'
import HomePage from '@/pages/home'

function DashboardLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/collections" element={<CollectionsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
