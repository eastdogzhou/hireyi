/**
 * Router Configuration
 * React Router v6 路由配置
 */

import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'

// Lazy load pages for code splitting
import { lazy } from 'react'

const CandidateList = lazy(() => import('@/pages/candidates/CandidateList'))
const CandidateDetail = lazy(() => import('@/pages/candidates/CandidateDetail'))
const PositionList = lazy(() => import('@/pages/positions/PositionList'))
const PositionDetail = lazy(() => import('@/pages/positions/PositionDetail'))

const NotFound = lazy(() => import('@/pages/NotFound'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
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
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
