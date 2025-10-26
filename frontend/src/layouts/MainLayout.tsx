/**
 * Main Layout Component
 * 应用主布局 - 侧边栏 + 主内容区
 */

import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { LoadingSpinner } from '@/ui/components/common'

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Breadcrumb will be added here */}
              <h1 className="text-2xl font-semibold text-gray-900">
                AI Resume Scanning System
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {/* User menu will be added here */}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
