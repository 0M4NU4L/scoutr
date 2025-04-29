"use client"

import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApiStatusIndicatorProps {
  usedMockData: boolean
  message?: string | null
}

export function ApiStatusIndicator({ usedMockData, message }: ApiStatusIndicatorProps) {
  if (!usedMockData) {
    return (
      <div className="flex items-center text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4 mr-1" />
        <span>Using real data from API</span>
      </div>
    )
  }

  return (
    <Alert variant="warning" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-600 dark:text-amber-400">
        {message || "Using demo data. API key may be invalid or missing."}
      </AlertDescription>
    </Alert>
  )
}
