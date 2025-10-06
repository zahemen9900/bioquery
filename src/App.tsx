import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext'
import { ChatProvider } from '@/contexts/ChatContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/toast/ToastProvider'
import AuthPage from '@/pages/auth'
import AuthCallbackPage from '@/pages/auth/callback'
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
        <UserPreferencesProvider>
          <ChatProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />

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
            </ToastProvider>
          </ChatProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
