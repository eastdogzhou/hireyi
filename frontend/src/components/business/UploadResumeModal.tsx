/**
 * Upload Resume Modal
 * 简历上传模态框 - 支持批量上传和解析结果展示
 */

import { useState } from 'react'
import { useBatchUploadResumes } from '@/hooks/api'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/ui/components/common/Modal'
import { Button } from '@/ui/components/common/Button'
import { FileUpload } from '@/ui/components/form/FileUpload'
import { Badge } from '@/ui/components/common/Badge'
import { LoadingSpinner } from '@/ui/components/common/Loading'
import { CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react'

export interface UploadResumeModalProps {
  /**
   * Modal open state
   */
  open: boolean

  /**
   * Close handler
   */
  onClose: () => void

  /**
   * Optional position ID to associate resumes with
   */
  positionId?: number

  /**
   * Success callback
   */
  onSuccess?: () => void
}

interface UploadResult {
  file_name: string
  status: string  // "success" | "failed"
  candidate?: any
  error?: string
}

/**
 * Upload Resume Modal Component
 */
export const UploadResumeModal: React.FC<UploadResumeModalProps> = ({
  open,
  onClose,
  positionId,
  onSuccess,
}) => {
  const [files, setFiles] = useState<File[]>([])
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const batchUploadMutation = useBatchUploadResumes()

  // Handle file change
  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles)
    // Clear results when files change
    if (uploadResults.length > 0) {
      setUploadResults([])
    }
  }

  // Handle upload
  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadResults([])

    try {
      const result = await batchUploadMutation.mutateAsync({
        files,
        positionId,
      })

      // Set results
      setUploadResults(result.results)

      // If all successful, call success callback after a short delay
      if (result.successful === result.total) {
        setTimeout(() => {
          onSuccess?.()
          handleClose()
        }, 1500)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      // Create error results for all files
      setUploadResults(
        files.map(file => ({
          file_name: file.name,
          status: 'failed',
          error: '上传失败',
        }))
      )
    } finally {
      setIsUploading(false)
    }
  }

  // Handle close
  const handleClose = () => {
    if (!isUploading) {
      setFiles([])
      setUploadResults([])
      onClose()
    }
  }

  // Calculate statistics
  const totalFiles = files.length
  const successCount = uploadResults.filter(r => r.status === 'success').length
  const failedCount = uploadResults.filter(r => r.status === 'failed').length

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      <ModalHeader>上传简历</ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* File Upload Area */}
          {uploadResults.length === 0 && (
            <FileUpload
              name="resumes"
              label="选择简历文件"
              accept=".pdf,.doc,.docx,.html,.htm,.md,.markdown,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.tif"
              multiple
              maxFiles={20}
              maxSize={10 * 1024 * 1024}
              files={files}
              onChange={handleFileChange}
              helperText="支持 PDF、Word、HTML、Markdown、图片格式，单个文件最大10MB，一次最多上传20个文件"
            />
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600 mt-4">正在上传和解析简历...</p>
              <p className="text-sm text-gray-500 mt-2">
                这可能需要几分钟时间，请耐心等待
              </p>
            </div>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && !isUploading && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">
                      成功: {successCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">
                      失败: {failedCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      总计: {totalFiles}
                    </span>
                  </div>
                </div>
              </div>

              {/* Results List */}
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {uploadResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">{result.file_name}</p>
                          <Badge variant={result.status === 'success' ? 'success' : 'default'} size="sm">
                            {result.status === 'success' ? '成功' : '失败'}
                          </Badge>
                        </div>

                        {result.status === 'success' && result.candidate && (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              候选人: <span className="font-medium">{result.candidate.name}</span>
                            </p>
                            {result.candidate.email && (
                              <p className="text-xs text-gray-500">{result.candidate.email}</p>
                            )}
                            {result.candidate.skills && result.candidate.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {result.candidate.skills.slice(0, 5).map((skill: string, i: number) => (
                                  <Badge key={i} variant="default" size="sm">
                                    {skill}
                                  </Badge>
                                ))}
                                {result.candidate.skills.length > 5 && (
                                  <Badge variant="gray" size="sm">
                                    +{result.candidate.skills.length - 5}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {result.status === 'failed' && result.error && (
                          <div className="flex items-start gap-2 mt-1">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{result.error}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Retry Failed */}
              {failedCount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    部分简历上传失败，请检查文件格式或稍后重试
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={isUploading}>
            {uploadResults.length > 0 && successCount > 0 ? '完成' : '取消'}
          </Button>

          {uploadResults.length === 0 && (
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
              loading={isUploading}
            >
              {isUploading ? '上传中...' : `上传 ${files.length} 个文件`}
            </Button>
          )}

          {uploadResults.length > 0 && failedCount > 0 && (
            <Button
              variant="primary"
              onClick={() => {
                // Reset to allow retry
                setUploadResults([])
                setFiles(files.filter((_, i) => uploadResults[i].status === 'failed'))
              }}
            >
              重试失败的文件
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  )
}

UploadResumeModal.displayName = 'UploadResumeModal'
