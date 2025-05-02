"use client"

import { Badge } from "@/components/ui/badge"
import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DataSourceIndicatorProps {
  dataSource: string
  usedMockData: boolean
  className?: string
}

export function DataSourceIndicator({ dataSource, usedMockData, className }: DataSourceIndicatorProps) {
  let color = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
  let label = "Real Data"
  let description = "This data comes from real-time API sources."

  if (usedMockData || dataSource === "mock") {
    color = "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
    label = "Mock Data"
    description = "This is simulated data for demonstration purposes."
  } else if (dataSource === "serpapi") {
    label = "Google Shopping Data"
    description = "This data comes from Google Shopping via SerpAPI."
  } else if (dataSource === "priceapi") {
    label = "PriceAPI Data"
    description = "This data comes from multiple sources via PriceAPI."
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center ${className}`}>
            <Badge variant="outline" className={`${color} flex items-center gap-1`}>
              <span>{label}</span>
              <InfoIcon className="h-3 w-3" />
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{description}</p>
          {usedMockData && (
            <p className="mt-2 text-xs">To get real data, please add valid API keys in your environment variables.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
