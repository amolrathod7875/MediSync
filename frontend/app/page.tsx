'use client'

import { useState, useEffect } from 'react'
import { FileText, Upload, Activity, ClipboardList, Plus, ArrowRight, CheckCircle } from 'lucide-react'

interface Document {
  document_id: string
  filename: string
  status: string
  created_at: string
}

interface Summary {
  summary_id: string
  summary_type: string
  status: string
  generated_at: string
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch initial data
    fetchDocuments()
    fetchSummaries()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/documents/')
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummaries = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/summary/')
      const data = await response.json()
      setSummaries(data.summaries || [])
    } catch (error) {
      console.error('Error fetching summaries:', error)
    }
  }

  const stats = [
    {
      name: 'Total Documents',
      value: documents.length,
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      name: 'Pending Processing',
      value: documents.filter(d => d.status === 'created').length,
      icon: Activity,
      color: 'bg-yellow-500'
    },
    {
      name: 'Generated Summaries',
      value: summaries.length,
      icon: ClipboardList,
      color: 'bg-green-500'
    },
    {
      name: 'Signed Off',
      value: summaries.filter(s => s.status === 'signed').length,
      icon: CheckCircle,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to MediSync
            </h1>
            <p className="text-primary-100">
              AI-powered clinical documentation with clickable citations
            </p>
          </div>
          <a
            href="/upload"
            className="flex items-center px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Documents
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Generate Discharge Summary
          </h2>
          <p className="text-gray-600 mb-4">
            Create a comprehensive discharge summary from uploaded patient documents.
          </p>
          <a
            href="/generate?type=discharge"
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            Start Generation <ArrowRight className="w-4 h-4 ml-1" />
          </a>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create Handoff Note
          </h2>
          <p className="text-gray-600 mb-4">
            Generate a structured shift handoff note for the next care team.
          </p>
          <a
            href="/generate?type=handoff"
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            Start Generation <ArrowRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No documents yet. <a href="/upload" className="text-primary-600 hover:underline">Upload your first document</a>
            </div>
          ) : (
            documents.slice(0, 5).map((doc) => (
              <div key={doc.document_id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-sm text-gray-500">{new Date(doc.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  doc.status === 'processed' ? 'bg-green-100 text-green-800' :
                  doc.status === 'chunked' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {doc.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
