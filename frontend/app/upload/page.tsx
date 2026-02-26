'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'

interface UploadedFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  response?: any
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending' as const
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/plain': ['.txt']
    }
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFiles = async () => {
    setIsUploading(true)
    
    for (const uploadedFile of files) {
      if (uploadedFile.status !== 'pending') continue
      
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id ? { ...f, status: 'uploading' as const } : f
      ))

      const formData = new FormData()
      formData.append('file', uploadedFile.file)

      try {
        const response = await fetch('http://localhost:8000/api/v1/upload/', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id ? { 
              ...f, 
              status: 'success' as const,
              response: data 
            } : f
          ))
        } else {
          throw new Error('Upload failed')
        }
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { 
            ...f, 
            status: 'error' as const,
            error: 'Upload failed'
          } : f
        ))
      }
    }

    setIsUploading(false)
  }

  const pendingFiles = files.filter(f => f.status === 'pending')
  const hasPendingFiles = pendingFiles.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Clinical Documents</h1>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg text-gray-600">Drop the files here...</p>
        ) : (
          <>
            <p className="text-lg text-gray-600 mb-2">
              Drag and drop clinical documents here
            </p>
            <p className="text-sm text-gray-500">
              or click to select files (PDF, Images, CSV, JSON, TXT)
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Files to Upload ({files.length})
          </h2>
          <div className="space-y-3">
            {files.map((uploadedFile) => (
              <div 
                key={uploadedFile.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center">
                  <File className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {uploadedFile.status === 'pending' && (
                    <span className="text-sm text-gray-500 mr-3">Ready</span>
                  )}
                  {uploadedFile.status === 'uploading' && (
                    <span className="text-sm text-blue-600 mr-3">Uploading...</span>
                  )}
                  {uploadedFile.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  )}
                  {uploadedFile.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                  )}
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <button
            onClick={uploadFiles}
            disabled={!hasPendingFiles || isUploading}
            className={`mt-6 w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              hasPendingFiles && !isUploading
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      )}

      {/* Supported Formats */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Supported File Formats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            PDF Documents
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Images (PNG, JPG)
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            CSV Files
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
            JSON Files
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
            Text Files
          </div>
        </div>
      </div>
    </div>
  )
}
