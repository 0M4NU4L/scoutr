"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Star, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProductSelectionProps {
  products: any[]
  isLoading: boolean
  error: string | null
  onProductSelect: (product: any) => void
}

export function ProductSelection({ products, isLoading, error, onProductSelect }: ProductSelectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <Skeleton className="h-48 w-full" />
              <div className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/3 mt-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!products || products.length === 0) {
    return (
      <Alert>
        <AlertDescription>No products found. Please try a different search term.</AlertDescription>
      </Alert>
    )
  }

  // Group products by model/variant
  const groupedProducts = products.reduce((acc, product) => {
    // Extract model from title (simplified approach)
    const modelMatch = product.title.match(/(\w+\s*\w*)\s+(model|series|edition|version)/i)
    const model = modelMatch ? modelMatch[1] : "Default"

    if (!acc[model]) {
      acc[model] = []
    }
    acc[model].push(product)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Select a Product to Compare</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product, index) => (
          <Card
            key={index}
            className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              selectedProduct === product.id ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => {
              setSelectedProduct(product.id)
              onProductSelect(product)
            }}
          >
            <CardContent className="p-0">
              <div className="relative">
                <div className="w-full h-48 relative bg-white dark:bg-gray-800">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                {selectedProduct === product.id && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="p-4">
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
                  <Button size="sm" variant={selectedProduct === product.id ? "default" : "outline"}>
                    {selectedProduct === product.id ? "Selected" : "Compare"}
                  </Button>
                </div>

                {product.specs && (
                  <div className="mt-2 text-xs text-muted-foreground line-clamp-2">{product.specs}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
