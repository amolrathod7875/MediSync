'use client'

import { useState } from 'react'
import { 
  Heart, 
  Thermometer, 
  Wind, 
  Activity, 
  UploadCloud, 
  Sparkles, 
  Copy, 
  Download,
  FileText,
  User,
  Calendar,
  Stethoscope
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// Types
interface Patient {
  name: string
  age: number
  mrn: string
  chiefComplaint: string
  admissionDate: string
  attendingPhysician: string
}

interface Vital {
  label: string
  value: string
  unit: string
  status: 'normal' | 'elevated' | 'critical'
  icon: React.ComponentType<{ className?: string }>
}

// Dummy Patient Data
const patient: Patient = {
  name: 'John Doe',
  age: 65,
  mrn: 'MRN-2024-001234',
  chiefComplaint: 'Chest Pain',
  admissionDate: new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  attendingPhysician: 'Dr. Sarah Chen'
}

// Dummy Vitals Data
const vitals: Vital[] = [
  { label: 'Heart Rate', value: '78', unit: 'bpm', status: 'normal', icon: Heart },
  { label: 'Blood Pressure', value: '142/88', unit: 'mmHg', status: 'elevated', icon: Activity },
  { label: 'Temperature', value: '98.6', unit: '°F', status: 'normal', icon: Thermometer },
  { label: 'SpO2', value: '97', unit: '%', status: 'normal', icon: Wind },
  { label: 'Respiratory Rate', value: '18', unit: '/min', status: 'normal', icon: Wind }
]

// Placeholder Summary Content
const placeholderSummary = `## Discharge Summary

**Patient:** ${patient.name} (${patient.mrn})  
**Admission Date:** ${patient.admissionDate}  
**Discharge Date:** [Pending]

### Chief Complaint
${patient.chiefComplaint}, onset 3 days prior to admission. Patient presented with substernal chest pressure radiating to left arm, associated with diaphoresis and shortness of breath.

### History of Present Illness
65-year-old male with history of hypertension, hyperlipidemia, and type 2 diabetes presents with acute chest pain. Symptoms began approximately 72 hours ago with progressive severity. Cardiac enzymes elevated on admission.

### Hospital Course
- Admitted to cardiac telemetry unit
- Serial ECGs showing no acute ST changes
- Troponin peak at 2.5 ng/mL
- Started on aspirin, clopidogrel, heparin drip
- Cardiology consult placed
- Echocardiogram shows EF 55% with no wall motion abnormalities

### Assessment
Acute chest pain, likely musculoskeletal vs. cardiac origin. Rule out MI in progress.

### Plan
- Continue cardiac monitoring
- Repeat troponins in 6 hours
- outpatient follow-up with cardiology in 1 week
- Stress test if symptoms persist

---

[Generated content will appear here]`

// Status color mapping
const statusColors = {
  normal: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  elevated: 'text-amber-600 bg-amber-50 border-amber-200',
  critical: 'text-rose-600 bg-rose-50 border-rose-200'
}

const statusDotColors = {
  normal: 'bg-emerald-500',
  elevated: 'bg-amber-500',
  critical: 'bg-rose-500'
}

export default function HospitalDashboard() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSummary, setGeneratedSummary] = useState('')

  const handleGenerate = () => {
    setIsGenerating(true)
    // Simulate generation delay
    setTimeout(() => {
      setGeneratedSummary(placeholderSummary)
      setIsGenerating(false)
    }, 2000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSummary || placeholderSummary)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Main Content - Split Pane */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT PANEL - 30% width on desktop */}
        <div className="w-full lg:w-[30%] flex flex-col gap-4 p-4 overflow-y-auto border-r border-slate-200 bg-slate-50">
          
          {/* Patient Info Card */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</p>
                <p className="text-sm font-medium text-slate-900">{patient.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Age</p>
                  <p className="text-sm text-slate-900">{patient.age} years</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">MRN</p>
                  <p className="text-sm text-slate-900 font-mono">{patient.mrn}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Chief Complaint</p>
                <p className="text-sm text-slate-900">{patient.chiefComplaint}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Admission
                  </p>
                  <p className="text-sm text-slate-900">{patient.admissionDate}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Physician
                  </p>
                  <p className="text-sm text-slate-900">{patient.attendingPhysician}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vitals Grid */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                Current Vitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {vitals.map((vital) => (
                  <div
                    key={vital.label}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      statusColors[vital.status]
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <vital.icon className="w-4 h-4" />
                      <span className={cn('w-2 h-2 rounded-full', statusDotColors[vital.status])} />
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{vital.label}</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {vital.value}
                      <span className="text-xs font-normal text-slate-500 ml-1">{vital.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upload Medical Records Zone */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-teal-400 hover:bg-teal-50 transition-colors cursor-pointer group">
                <UploadCloud className="w-10 h-10 mx-auto text-slate-400 group-hover:text-teal-600 mb-3 transition-colors" />
                <p className="text-sm font-medium text-slate-700">Drag & drop medical records</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL - 70% width on desktop */}
        <div className="w-full lg:w-[70%] flex flex-col p-4 overflow-hidden">
          
          {/* Copilot Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-teal-600" />
              AI Discharge Summary Copilot
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate clinical documentation from patient records
            </p>
          </div>

          {/* Generate Button */}
          <div className="mb-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="h-11 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Discharge Summary'}
            </Button>
          </div>

          {/* Summary Output Area */}
          <Card className="flex-1 bg-white border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  Generated Summary
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    MD
                  </Button>
                </div>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1 p-6">
              {generatedSummary ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 bg-transparent p-0">
                    {generatedSummary}
                  </pre>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Click "Generate Discharge Summary" to create clinical documentation</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  )
}
