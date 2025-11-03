/**
 * Router Configuration
 * 路由配置 - 定义应用的所有路由
 */

import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

// Lazy load pages for code splitting
import { lazy, Suspense } from 'react'

// Auth pages (public)
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { OnboardingPage } from './pages/auth/OnboardingPage'

// Business pages (protected)
const CandidateList = lazy(() => import('./pages/candidates/CandidateList'))
const CandidateDetail = lazy(() => import('./pages/candidates/CandidateDetail'))
const PositionList = lazy(() => import('./pages/positions/PositionList'))
const PositionDetail = lazy(() => import('./pages/positions/PositionDetail'))
const OrganizationMembers = lazy(() => import('./pages/organizations/OrganizationMembers'))

// Special pages
const NotFound = lazy(() => import('./pages/NotFound'))

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    </div>
  )
}

/**
 * Root layout with AuthProvider
 */
function RootLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

// Layout component
import { Sidebar } from './components/layout/Sidebar'

/**
 * Main application layout for protected routes
 * Includes collapsible sidebar navigation
 */
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      {/* Main content area with responsive left margin */}
      <main className="transition-all duration-300 ease-in-out ml-64 min-h-screen">
        <div className="container mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}

/**
 * Router configuration
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RootLayout>
        <Suspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <AppLayout>
              <Navigate to="/candidates" replace />
            </AppLayout>
          </ProtectedRoute>
        </Suspense>
      </RootLayout>
    ),
  },
  {
    path: '/login',
    element: (
      <RootLayout>
        <LoginPage />
      </RootLayout>
    ),
  },
  {
    path: '/register',
    element: (
      <RootLayout>
        <RegisterPage />
      </RootLayout>
    ),
  },
  {
    path: '/candidates',
    element: (
      <RootLayout>
        <Suspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <AppLayout>
              <CandidateList />
            </AppLayout>
          </ProtectedRoute>
        </Suspense>
      </RootLayout>
    ),
  },
  {
    path: '/candidates/:id',
    element: (
      <RootLayout>
        <Suspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <AppLayout>
              <CandidateDetail />
            </AppLayout>
          </ProtectedRoute>
        </Suspense>
      </RootLayout>
    ),
  },
  {
    path: '/positions',
    element: (
      <RootLayout>
        <Suspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <AppLayout>
              <PositionList />
            </AppLayout>
          </ProtectedRoute>
        </Suspense>
      </RootLayout>
    ),
  },
  {
    path: '/positions/:id',
    element: (
      <RootLayout>
        <Suspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <AppLayout>
              <PositionDetail />
            </AppLayout>
          </ProtectedRoute>
        </Suspense>
      </RootLayout>
    ),
  },
  {
    path: '/organizations/members',
    element: (
      <RootLayout>
        <Suspense fallback={<LoadingFallback />}>
          <ProtectedRoute>
            <AppLayout>
              <OrganizationMembers />
            </AppLayout>
          </ProtectedRoute>
        </Suspense>
      </RootLayout>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <RootLayout>
        <ProtectedRoute requireOrg={false}>
          <OnboardingPage />
        </ProtectedRoute>
      </RootLayout>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotFound />
      </Suspense>
    ),
  },
])
