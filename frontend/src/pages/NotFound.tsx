/**
 * 404 Not Found Page
 * 页面未找到
 */

import { Link } from 'react-router-dom'
import { Button } from '@/ui/components/common'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-orange-500">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4">页面未找到</h2>
        <p className="text-gray-600 mt-2 mb-8">
          抱歉，您访问的页面不存在或已被移除。
        </p>
        <Link to="/">
          <Button>返回首页</Button>
        </Link>
      </div>
    </div>
  )
}
