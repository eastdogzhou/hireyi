/**
 * Router Configuration
 * React Router v6 路由配置
 */

import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import RequireRole from '@/components/auth/RequireRole'

// Lazy load pages for code splitting
import { lazy } from 'react'

// Auth pages (public routes)
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage'))

// App pages (protected routes)
const CandidateList = lazy(() => import('@/pages/candidates/CandidateList'))
const CandidateDetail = lazy(() => import('@/pages/candidates/CandidateDetail'))
const PositionList = lazy(() => import('@/pages/positions/PositionList'))
const PositionDetail = lazy(() => import('@/pages/positions/PositionDetail'))
const OrganizationMembers = lazy(() => import('@/pages/organizations/OrganizationMembers'))

const NotFound = lazy(() => import('@/pages/NotFound'))

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },

  // Protected routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/candidates" replace />,
      },
      {
        path: 'candidates',
        element: <CandidateList />,
      },
      {
        path: 'candidates/:id',
        element: <CandidateDetail />,
      },
      {
        path: 'positions',
        element: <PositionList />,
      },
      {
        path: 'positions/:id',
        element: <PositionDetail />,
      },
      {
        path: 'organizations/:id/members',
        element: (
          <RequireRole allowedRoles={['creator', 'admin']}>
            <OrganizationMembers />
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
