"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProductSummaryProps {
  product: any
  isLoading: boolean
  summary: {
    text: string
    factChecked: boolean
  } | null
  error: string | null
}

export function ProductSummary({ product, isLoading, summary, error }: ProductSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Product Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Product Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Product Summary</CardTitle>
          {summary?.factChecked && (
            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              <span>Fact Checked</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none">
          {summary?.text ? (
            <div dangerouslySetInnerHTML={{ __html: summary.text }} />
          ) : (
            <p>
              {product.title} is available across multiple e-commerce platforms. Compare prices and reviews to find the
              best deal.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
