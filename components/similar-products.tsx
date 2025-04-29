"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Star } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SimilarProductsProps {
  products: any[]
  isLoading: boolean
  error: string | null
  onProductClick: (product: any) => void
}

export function SimilarProducts({ products, isLoading, error, onProductClick }: SimilarProductsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Similar Products</CardTitle>
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
          <CardTitle>Similar Products</CardTitle>
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
          <CardTitle>Similar Products</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">No similar products found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Similar Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product, index) => (
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
                  <div className="font-bold">₹{product.price.toLocaleString()}</div>
                  <Button size="sm" variant="outline">
                    Compare
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
