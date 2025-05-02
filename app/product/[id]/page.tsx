"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Check, Star, AlertTriangle, Info, Share2, Heart, Download, Calendar } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PriceAlertForm } from "@/components/price-alert-form"
import { PriceHistoryCard } from "@/components/price-history-card"
import { ProductRecommendations } from "@/components/product-recommendations"

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

  const [isFavorite, setIsFavorite] = useState(false)
  const [showPriceAlert, setShowPriceAlert] = useState(false)
  const [alertPrice, setAlertPrice] = useState("")
  const [showShareOptions, setShowShareOptions] = useState(false)

  const handlePriceAlert = () => {
    if (!alertPrice) return

    // In a real app, this would save the alert to a database
    setShowPriceAlert(false)
    // Show success message
    alert(`Price alert set for ₹${alertPrice}`)
  }

  const handleShare = (platform) => {
    const shareUrl = window.location.href
    const shareTitle = product?.title || "Check out this product on Scoutr"

    let shareLink = ""

    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`
        break
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`
        break
      case "email":
        shareLink = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareUrl)}`
        break
    }

    if (shareLink) {
      window.open(shareLink, "_blank")
    }

    setShowShareOptions(false)
  }

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

        <div className="flex flex-col gap-2">
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

          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={isFavorite ? "text-red-500" : ""}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <PriceAlertForm
              productId={productId}
              productTitle={product.title}
              currentPrice={cheapestInfo?.price || 0}
            />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setShowShareOptions(!showShareOptions)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {priceHistory && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        // In a real app, this would generate and download a CSV
                        alert("Price history would be downloaded as CSV")
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download price history</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>

      {/* Share options popup */}
      {showShareOptions && (
        <div className="absolute right-4 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleShare("twitter")}>
              Twitter
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleShare("facebook")}>
              Facebook
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleShare("whatsapp")}>
              WhatsApp
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleShare("email")}>
              Email
            </Button>
          </div>
        </div>
      )}

      {/* Price alert dialog */}
      {showPriceAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Set Price Alert</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We'll notify you when the price drops below your target price.
            </p>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="alert-price">Target Price (₹)</Label>
                <Input
                  id="alert-price"
                  type="number"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  placeholder="Enter your target price"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Alert will be active for 30 days</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPriceAlert(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePriceAlert}>Set Alert</Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {cheapestInfo && cheapestInfo.store && (
                  <div className="absolute bottom-2 right-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded text-xs font-medium">
                    Best deal at {STORES[cheapestInfo.store]}
                  </div>
                )}
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

                {/* Add price history preview */}
                {priceHistory && priceHistory.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Price Trend</h3>
                    <div className="text-xs text-muted-foreground mb-1">Last 30 days</div>
                    <div className="h-[100px]">
                      <PriceChart data={priceHistory.slice(-6)} />
                    </div>
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
                <PriceHistoryCard
                  priceHistory={priceHistory}
                  stores={Object.keys(product.stores).filter((store) => product.stores[store] !== null)}
                />
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
              <ProductRecommendations
                productId={productId}
                productQuery={productQuery}
                onProductClick={(product) => {
                  router.push(`/product/${product.id}?q=${encodeURIComponent(product.title)}&id=${product.id}`)
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-full h-24 relative bg-white dark:bg-gray-800">
                <Image
                  src={`/placeholder.svg?height=100&width=100&text=Product${i}`}
                  alt={`Recently viewed product ${i}`}
                  fill
                  className="object-contain p-2"
                />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium line-clamp-1">Product {i}</p>
                <p className="text-xs text-muted-foreground">₹{(Math.random() * 10000 + 5000).toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
