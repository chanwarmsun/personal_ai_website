'use client'

import React, { useState, useRef } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'

interface FileUploadComponentProps {
  onFileReady: (fileUrl: string, fileName: string, fileSize: string) => void
  maxSize?: number // MB
  acceptedTypes?: string[]
  uploadMethod?: 'base64' | 'github'
}

export default function FileUploadComponent({ 
  onFileReady, 
  maxSize = 50, 
  acceptedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip', '.rar'],
  uploadMethod = 'base64' 
}: FileUploadComponentProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{name: string, size: string, url: string} | null>(null)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      return `文件大小不能超过 ${maxSize}MB`
    }

    // 检查文件类型
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(fileExtension)) {
      return `不支持的文件格式，仅支持: ${acceptedTypes.join(', ')}`
    }

    return null
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)

    try {
      if (uploadMethod === 'base64') {
        await handleBase64Upload(file)
      } else {
        await handleGitHubUpload(file)
      }
    } catch (err) {
      setError('文件上传失败，请重试')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleBase64Upload = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        const fileSize = formatFileSize(file.size)
        
        const uploadedFileInfo = {
          name: file.name,
          size: fileSize,
          url: base64
        }
        
        setUploadedFile(uploadedFileInfo)
        onFileReady(base64, file.name, fileSize)
        resolve()
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  const handleGitHubUpload = async (file: File) => {
    // 这里可以集成GitHub API上传
    // 为简化示例，暂时使用base64方式
    await handleBase64Upload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      // 直接创建一个包含文件的FileList
      const fileInput = fileInputRef.current
      if (fileInput) {
        const dt = new DataTransfer()
        dt.items.add(file)
        fileInput.files = dt.files
        
        const event = new Event('change', { bubbles: true })
        Object.defineProperty(event, 'target', { value: fileInput, writable: false })
        fileInput.dispatchEvent(event)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeFile = () => {
    setUploadedFile(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {!uploadedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFileDialog}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept={acceptedTypes.join(',')}
            className="hidden"
          />
          
          {uploading ? (
            <div className="space-y-3">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
              <p className="text-indigo-600 font-medium">上传中...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload size={48} className="mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700">点击上传或拖拽文件到此处</p>
                <p className="text-sm text-gray-500 mt-1">
                  支持格式: {acceptedTypes.join(', ')}
                </p>
                <p className="text-sm text-gray-500">
                  最大文件大小: {maxSize}MB
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600" />
              <div>
                <p className="font-medium text-green-900">{uploadedFile.name}</p>
                <p className="text-sm text-green-700">大小: {uploadedFile.size}</p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="p-1 text-green-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={16} className="text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {uploadMethod === 'base64' && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <strong>提示:</strong> 文件将转换为base64格式存储在浏览器中。建议文件大小控制在5MB以内以获得最佳性能。
        </div>
      )}
    </div>
  )
} 