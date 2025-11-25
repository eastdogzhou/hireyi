/**
 * Smart Screening Modal
 * 智能筛选模态框 - 为职位筛选候选人
 */

import { useState } from 'react'
import { useSmartScreening } from '@/hooks/api'
import type { SmartScreeningRequest } from '@/types'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/ui/components/common/Modal'
import { Button } from '@/ui/components/common/Button'
import { Badge } from '@/ui/components/common/Badge'
import { LoadingSpinner } from '@/ui/components/common/Loading'
import { Input } from '@/ui/components/common/Input'
import { Zap, Users, TrendingUp, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface SmartScreeningModalProps {
  /**
   * Modal open state
   */
  open: boolean

  /**
   * Close handler
   */
  onClose: () => void

  /**
   * Position ID to screen for
   */
  positionId: number

  /**
   * Position title
   */
  positionTitle: string

  /**
   * Success callback
   */
  onSuccess?: () => void
}

/**
 * Smart Screening Modal Component
 */
export const SmartScreeningModal: React.FC<SmartScreeningModalProps> = ({
  open,
  onClose,
  positionId,
  positionTitle,
  onSuccess,
}) => {
  const [params, setParams] = useState<SmartScreeningRequest>({
    position_id: positionId,
    limit: 100,
    min_score: 2,
  })
  const [screeningResult, setScreeningResult] = useState<any>(null)
  const [isScreening, setIsScreening] = useState(false)

  const smartScreeningMutation = useSmartScreening()

  // Handle parameter change
  const handleLimitChange = (value: string) => {
    const limit = parseInt(value) || 100
    setParams(prev => ({ ...prev, limit }))
  }

  const handleMinScoreChange = (value: string) => {
    const min_score = parseInt(value) || 1
    setParams(prev => ({ ...prev, min_score: Math.max(1, Math.min(4, min_score)) as 1 | 2 | 3 | 4 }))
  }

  // Handle screening
  const handleScreen = async () => {
    setIsScreening(true)
    setScreeningResult(null)

    try {
      const result = await smartScreeningMutation.mutateAsync({
        positionId,
        request: params,
      })

      setScreeningResult(result)

      // Auto close after success if all candidates added
      if (result.total_matched > 0) {
        setTimeout(() => {
          onSuccess?.()
          handleClose()
        }, 2000)
      }
    } catch (error) {
      console.error('Smart screening failed:', error)
      setScreeningResult({
        total_screened: 0,
        total_matched: 0,
        matches: [],
        execution_time: 0,
        error: '筛选失败，请稍后重试',
      })
    } finally {
      setIsScreening(false)
    }
  }

  // Handle close
  const handleClose = () => {
    if (!isScreening) {
      setParams({
        position_id: positionId,
        limit: 100,
        min_score: 2,
      })
      setScreeningResult(null)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          <span>智能筛选</span>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Position Info */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">为以下职位筛选候选人：</p>
                <p className="text-sm text-gray-700 mt-1">{positionTitle}</p>
              </div>
            </div>
          </div>

          {/* Parameters */}
          {!screeningResult && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">筛选参数</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Max candidates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最多筛选候选人数
                  </label>
                  <Input
                    type="number"
                    value={params.limit}
                    onChange={e => handleLimitChange(e.target.value)}
                    min={1}
                    max={200}
                    placeholder="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    建议：50-150人，数量越多耗时越长
                  </p>
                </div>

                {/* Min score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最低匹配分数
                  </label>
                  <Input
                    type="number"
                    value={params.min_score}
                    onChange={e => handleMinScoreChange(e.target.value)}
                    min={1}
                    max={4}
                    placeholder="2"
                  />
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4].map(score => (
                      <button
                        key={score}
                        onClick={() => setParams(prev => ({ ...prev, min_score: score as 1 | 2 | 3 | 4 }))}
                        className={`flex-1 px-2 py-1 text-xs rounded ${
                          params.min_score === score
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {score}星
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">筛选流程说明：</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>从人才库中预筛选候选人（关键词匹配）</li>
                      <li>使用AI对候选人进行智能评分</li>
                      <li>按匹配度排序，返回最优候选人</li>
                      <li>自动跳过已关联的候选人</li>
                    </ul>
                    <p className="mt-2 text-blue-800">
                      ⏱️ 预计耗时：{Math.ceil((params.limit || 100) / 10)}秒 - {Math.ceil((params.limit || 100) / 5)}秒
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Screening Progress */}
          {isScreening && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <LoadingSpinner size="lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-orange-500 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-900 font-medium mt-6">正在智能筛选候选人...</p>
              <p className="text-sm text-gray-500 mt-2">
                AI正在分析候选人与职位的匹配度，请稍候
              </p>
            </div>
          )}

          {/* Screening Results */}
          {screeningResult && !isScreening && (
            <div className="space-y-4">
              {screeningResult.error ? (
                /* Error State */
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="font-medium text-red-900 mb-1">筛选失败</p>
                  <p className="text-sm text-red-700">{screeningResult.error}</p>
                </div>
              ) : (
                /* Success State */
                <>
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="font-medium text-green-900 mb-2">筛选完成！</p>
                    <div className="flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          已筛选 <span className="font-semibold">{screeningResult.total_screened}</span> 人
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">
                          匹配 <span className="font-semibold text-green-600">{screeningResult.total_matched}</span> 人
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      耗时 {screeningResult.execution_time?.toFixed(1)}秒
                    </p>
                  </div>

                  {/* Top Matches Preview */}
                  {screeningResult.matches && screeningResult.matches.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        最佳匹配 (前{Math.min(5, screeningResult.matches.length)}名)
                      </h4>
                      <div className="space-y-2">
                        {screeningResult.matches.slice(0, 5).map((match: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                          >
                            {/* Rank */}
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-sm flex-shrink-0">
                              {index + 1}
                            </div>

                            {/* Score */}
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className="w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center">
                                <span className="text-lg font-bold text-orange-600">
                                  {match.overall_score_numeric}
                                </span>
                              </div>
                            </div>

                            {/* Candidate Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{match.candidate?.name || '候选人'}</p>
                              {match.candidate?.skills && match.candidate.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {match.candidate.skills.slice(0, 3).map((skill: string, i: number) => (
                                    <Badge key={i} variant="default" size="sm">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {match.candidate.skills.length > 3 && (
                                    <Badge variant="gray" size="sm">
                                      +{match.candidate.skills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Match Scores */}
                            <div className="flex gap-2 text-xs text-gray-600 flex-shrink-0">
                              <div className="text-center">
                                <div className="text-orange-500 font-semibold">
                                  {'⭐'.repeat(match.relevance_score)}
                                </div>
                                <div className="text-gray-500 mt-0.5">技能</div>
                              </div>
                              <div className="text-center">
                                <div className="text-orange-500 font-semibold">
                                  {'⭐'.repeat(match.fit_score)}
                                </div>
                                <div className="text-gray-500 mt-0.5">经验</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {screeningResult.matches.length > 5 && (
                        <p className="text-sm text-gray-500 text-center mt-3">
                          还有 {screeningResult.matches.length - 5} 个候选人已添加到职位
                        </p>
                      )}
                    </div>
                  )}

                  {screeningResult.total_matched === 0 && (
                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="font-medium text-gray-700 mb-1">未找到匹配的候选人</p>
                      <p className="text-sm text-gray-500">
                        尝试降低最低分数要求或增加筛选人数
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={isScreening}>
            {screeningResult ? '完成' : '取消'}
          </Button>

          {!screeningResult && (
            <Button
              variant="primary"
              onClick={handleScreen}
              disabled={isScreening}
              loading={isScreening}
              icon={<Zap className="w-4 h-4" />}
            >
              {isScreening ? '筛选中...' : '开始筛选'}
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  )
}

SmartScreeningModal.displayName = 'SmartScreeningModal'
