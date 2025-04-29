"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Check, Star, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PriceChart } from "@/components/price-chart"
import { STORE_LOGOS, STORES } from "@/lib/constants"
import { ProductSummary } from "@/components/product-summary"
import { ReviewComparison } from "@/components/review-comparison"
import { ApiStatusIndicator } from "@/components/api-status-indicator"
import { VendorComparisonTable } from "@/components/vendor-comparison-table"
import { EnhancedAlternatives } from "@/components/enhanced-alternatives"

export default function ProductDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productQuery = searchParams.get("q") || ""
  const productId = searchParams.get("id") || ""

  const [product, setProduct] = useState(null)
  const [priceHistory, setPriceHistory] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [summary, setSummary] = useState({ loading: true, data: null, error: null })
  const [similarProducts, setSimilarProducts] = useState({ loading: true, data: [], error: null })
  const [apiStatus, setApiStatus] = useState({ usedMockData: false, message: null })

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productQuery) {
        router.push("/")
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Fetch product details
        const response = await fetch(`/api/product?q=${encodeURIComponent(productQuery)}&id=${productId}`)

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setProduct(data.product)
        setPriceHistory(data.priceHistory)
        setApiStatus({
          usedMockData: data.usedMockData,
          message: data.usedMockData ? "Using demo data. API key may be invalid or missing." : null,
        })

        // Fetch product summary
        fetchProductSummary(data.product)

        // Fetch similar products
        fetchSimilarProducts(data.product)
      } catch (err) {
        console.error("Error fetching product details:", err)
        setError(err.message || "Failed to load product details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductDetails()
  }, [productQuery, productId, router])

  const fetchProductSummary = async (productData) => {
    setSummary({ loading: true, data: null, error: null })

    try {
      const response = await fetch(`/api/summary?q=${encodeURIComponent(productQuery)}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setSummary({
        loading: false,
        data: {
          text: data.summary,
          factChecked: data.factChecked,
        },
        error: null,
      })
    } catch (err) {
      console.error("Error fetching product summary:", err)
      setSummary({ loading: false, data: null, error: "Failed to load product summary" })
    }
  }

  const fetchSimilarProducts = async (productData) => {
    setSimilarProducts({ loading: true, data: [], error: null })

    try {
      const response = await fetch(`/api/similar-products?q=${encodeURIComponent(productQuery)}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setSimilarProducts({ loading: false, data: data.products, error: null })
    } catch (err) {
      console.error("Error fetching similar products:", err)
      setSimilarProducts({ loading: false, data: [], error: "Failed to load similar products" })
    }
  }

  // Find the cheapest price among all stores
  const findCheapestPrice = () => {
    if (!product) return null

    let cheapest = Number.POSITIVE_INFINITY
    let cheapestStore = null

    Object.keys(product.stores).forEach((store) => {
      if (product.stores[store]?.price && product.stores[store].price < cheapest) {
        cheapest = product.stores[store].price
        cheapestStore = store
      }
    })

    return cheapest === Number.POSITIVE_INFINITY ? null : { price: cheapest, store: cheapestStore }
  }

  const cheapestInfo = findCheapestPrice()

  // Calculate price trends
  const calculatePriceTrend = (store) => {
    if (!priceHistory || priceHistory.length < 2 || !product?.stores[store]) return null

    const currentPrice = product.stores[store].price
    const previousPrice = priceHistory[priceHistory.length - 2][store]

    if (!previousPrice) return null

    const difference = currentPrice - previousPrice
    const percentChange = (difference / previousPrice) * 100

    return {
      trend: difference < 0 ? "down" : difference > 0 ? "up" : "stable",
      difference: Math.abs(difference),
      percentChange: Math.abs(percentChange).toFixed(1),
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search
        </Button>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>Product not found. Please try another search.</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-12">
      {/* Back button and title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <Button
            onClick={() => router.push("/search?q=" + encodeURIComponent(productQuery))}
            variant="outline"
            size="sm"
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Product Selection
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{product.title}</h1>
          {apiStatus.usedMockData && (
            <div className="mt-2">
              <ApiStatusIndicator usedMockData={apiStatus.usedMockData} message={apiStatus.message} />
            </div>
          )}
        </div>

        {cheapestInfo && (
          <div className="flex items-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-4 py-2 rounded-lg">
            <div className="mr-3">
              <p className="text-sm font-medium">Best Price</p>
              <p className="text-xl font-bold">₹{cheapestInfo.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center">
              <Image
                src={STORE_LOGOS[cheapestInfo.store] || "/placeholder.svg"}
                alt={`${STORES[cheapestInfo.store]} logo`}
                width={80}
                height={24}
                className="h-6 w-auto object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product image and basic info */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="w-full aspect-square relative bg-white dark:bg-gray-800">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.title}
                  fill
                  className="object-contain p-4"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-muted text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">{product.rating || "N/A"}</span>
                  <span className="ml-2 text-sm text-muted-foreground">({product.reviewCount || 0} reviews)</span>
                </div>

                {product.specs && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Key Specifications</h3>
                    <ul className="text-sm space-y-1">
                      {product.specs.split(" | ").map((spec, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <ProductSummary
                product={product}
                isLoading={summary.loading}
                summary={summary.data}
                error={summary.error}
              />

              {/* Price history preview */}
              {priceHistory && priceHistory.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Price History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <PriceChart data={priceHistory} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <VendorComparisonTable product={product} cheapestStore={cheapestInfo?.store} />
                </CardContent>
              </Card>

              {/* Price history chart */}
              {priceHistory && priceHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Price History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <PriceChart data={priceHistory} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <ReviewComparison product={product} />
            </TabsContent>

            {/* Alternatives Tab */}
            <TabsContent value="alternatives" className="space-y-6">
              <EnhancedAlternatives
                products={similarProducts.data}
                currentProduct={product}
                isLoading={similarProducts.loading}
                error={similarProducts.error}
                onProductClick={(product) => {
                  router.push(`/product/${product.id}?q=${encodeURIComponent(product.title)}&id=${product.id}`)
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
