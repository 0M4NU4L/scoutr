"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Star, ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EnhancedAlternativesProps {
  products: any[]
  currentProduct: any
  isLoading: boolean
  error: string | null
  onProductClick: (product: any) => void
}

export function EnhancedAlternatives({
  products,
  currentProduct,
  isLoading,
  error,
  onProductClick,
}: EnhancedAlternativesProps) {
  const [comparisonView, setComparisonView] = useState<"grid" | "table">("grid")

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alternative Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="p-3">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alternative Products</CardTitle>
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

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alternative Products</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">No alternative products found.</p>
        </CardContent>
      </Card>
    )
  }

  // Categorize alternatives as better, similar, or other
  const categorizeAlternatives = () => {
    if (!currentProduct) return { better: [], similar: [], other: [] }

    const currentPrice = currentProduct.price || 0
    const currentRating = Number.parseFloat(currentProduct.rating) || 0

    return products.reduce(
      (acc, product) => {
        const price = product.price || 0
        const rating = Number.parseFloat(product.rating) || 0

        // Better: Higher rating and similar or lower price
        if (rating > currentRating + 0.5 && price <= currentPrice * 1.15) {
          acc.better.push(product)
        }
        // Similar: Similar rating and similar price
        else if (
          Math.abs(rating - currentRating) <= 0.5 &&
          price >= currentPrice * 0.85 &&
          price <= currentPrice * 1.15
        ) {
          acc.similar.push(product)
        }
        // Other: Everything else
        else {
          acc.other.push(product)
        }

        return acc
      },
      { better: [], similar: [], other: [] },
    )
  }

  const { better, similar, other } = categorizeAlternatives()

  // Compare a specific product with the current product
  const compareWithCurrent = (product) => {
    const currentPrice = currentProduct?.price || 0
    const currentRating = Number.parseFloat(currentProduct?.rating) || 0
    const price = product.price || 0
    const rating = Number.parseFloat(product.rating) || 0

    const priceDiff = ((price - currentPrice) / currentPrice) * 100
    const ratingDiff = rating - currentRating

    return {
      priceDiff,
      ratingDiff,
      isPriceBetter: priceDiff < 0,
      isRatingBetter: ratingDiff > 0,
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Alternative Products</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={comparisonView === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setComparisonView("grid")}
          >
            Grid
          </Button>
          <Button
            variant={comparisonView === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setComparisonView("table")}
          >
            Table
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="better">
          <TabsList className="mb-4">
            <TabsTrigger value="better">Better Options ({better.length})</TabsTrigger>
            <TabsTrigger value="similar">Similar Products ({similar.length})</TabsTrigger>
            <TabsTrigger value="other">Other Alternatives ({other.length})</TabsTrigger>
          </TabsList>

          {["better", "similar", "other"].map((category) => (
            <TabsContent key={category} value={category}>
              {comparisonView === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(category === "better" ? better : category === "similar" ? similar : other).map((product, index) => {
                    const comparison = compareWithCurrent(product)

                    return (
                      <div
                        key={index}
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onProductClick(product)}
                      >
                        <div className="w-full h-40 relative bg-white dark:bg-gray-800">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.title}
                            fill
                            className="object-contain p-2"
                          />
                          {category === "better" && (
                            <Badge className="absolute top-2 right-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.title}</h3>
                          <div className="flex items-center mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(product.rating || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-muted text-muted-foreground"
                                }`}
                              />
                            ))}
                            <span className="text-xs ml-1">{product.rating || "N/A"}</span>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold">₹{product.price?.toLocaleString() || "N/A"}</div>
                            <div className="text-xs">
                              {comparison.priceDiff !== 0 && (
                                <span className={comparison.isPriceBetter ? "text-green-600" : "text-red-600"}>
                                  {comparison.isPriceBetter ? "↓" : "↑"}
                                  {Math.abs(comparison.priceDiff).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Comparison highlights */}
                          <div className="mt-2 text-xs space-y-1">
                            {comparison.ratingDiff !== 0 && (
                              <div className="flex items-center">
                                {comparison.isRatingBetter ? (
                                  <ThumbsUp className="h-3 w-3 text-green-600 mr-1" />
                                ) : (
                                  <ThumbsDown className="h-3 w-3 text-red-600 mr-1" />
                                )}
                                <span>
                                  Rating: {comparison.isRatingBetter ? "Better by " : "Lower by "}
                                  {Math.abs(comparison.ratingDiff).toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              onProductClick(product)
                            }}
                          >
                            Compare <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-center">Price</th>
                        <th className="p-2 text-center">Rating</th>
                        <th className="p-2 text-center">Comparison</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(category === "better" ? better : category === "similar" ? similar : other).map(
                        (product, index) => {
                          const comparison = compareWithCurrent(product)

                          return (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-12 h-12 relative">
                                    <Image
                                      src={product.image || "/placeholder.svg"}
                                      alt={product.title}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                  <span className="text-sm font-medium line-clamp-2">{product.title}</span>
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <div className="font-bold">₹{product.price?.toLocaleString() || "N/A"}</div>
                                {comparison.priceDiff !== 0 && (
                                  <div
                                    className={`text-xs ${comparison.isPriceBetter ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {comparison.isPriceBetter ? "↓" : "↑"}
                                    {Math.abs(comparison.priceDiff).toFixed(1)}%
                                  </div>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center">
                                  <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < Math.floor(product.rating || 0)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-muted text-muted-foreground"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="ml-1 text-xs">{product.rating || "N/A"}</span>
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <div className="text-xs space-y-1">
                                  {comparison.ratingDiff !== 0 && (
                                    <div className="flex items-center justify-center">
                                      {comparison.isRatingBetter ? (
                                        <ThumbsUp className="h-3 w-3 text-green-600 mr-1" />
                                      ) : (
                                        <ThumbsDown className="h-3 w-3 text-red-600 mr-1" />
                                      )}
                                      <span>
                                        Rating: {comparison.isRatingBetter ? "+" : "-"}
                                        {Math.abs(comparison.ratingDiff).toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <Button size="sm" variant="outline" onClick={() => onProductClick(product)}>
                                  Compare
                                </Button>
                              </td>
                            </tr>
                          )
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
