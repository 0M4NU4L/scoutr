"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Star, ArrowRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProductRecommendationsProps {
  productId: string
  productQuery: string
  onProductClick: (product: any) => void
}

export function ProductRecommendations({ productId, productQuery, onProductClick }: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("similar")

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!productQuery) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/similar-products?q=${encodeURIComponent(productQuery)}`)

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setRecommendations(data.products || [])
      } catch (err) {
        console.error("Error fetching recommendations:", err)
        setError(err.message || "Failed to load recommendations")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [productQuery])

  // Categorize products
  const categorizeProducts = () => {
    if (!recommendations.length) return { similar: [], premium: [], budget: [] }

    // Get average price
    const avgPrice = recommendations.reduce((sum, product) => sum + (product.price || 0), 0) / recommendations.length

    return recommendations.reduce(
      (acc, product) => {
        const price = product.price || 0

        if (price > avgPrice * 1.2) {
          acc.premium.push(product)
        } else if (price < avgPrice * 0.8) {
          acc.budget.push(product)
        } else {
          acc.similar.push(product)
        }

        return acc
      },
      { similar: [], premium: [], budget: [] },
    )
  }

  const { similar, premium, budget } = categorizeProducts()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You May Also Like</CardTitle>
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
          <CardTitle>You May Also Like</CardTitle>
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

  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>You May Also Like</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="similar" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="similar">Similar Products ({similar.length})</TabsTrigger>
            <TabsTrigger value="premium">Premium Options ({premium.length})</TabsTrigger>
            <TabsTrigger value="budget">Budget Picks ({budget.length})</TabsTrigger>
          </TabsList>

          {["similar", "premium", "budget"].map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(category === "similar" ? similar : category === "premium" ? premium : budget).map(
                  (product, index) => (
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
                        {category === "premium" && (
                          <Badge className="absolute top-2 right-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                            Premium
                          </Badge>
                        )}
                        {category === "budget" && (
                          <Badge className="absolute top-2 right-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Budget Pick
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
                        <div className="flex items-center justify-between">
                          <div className="font-bold">₹{product.price?.toLocaleString() || "N/A"}</div>
                          <Button size="sm" variant="ghost" className="p-0 h-auto">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
