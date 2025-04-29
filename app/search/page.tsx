"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Search, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProductSelection } from "@/components/product-selection"
import { ApiStatusIndicator } from "@/components/api-status-indicator"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [apiStatus, setApiStatus] = useState({ usedMockData: false, message: null })

  useEffect(() => {
    if (initialQuery) {
      fetchProducts(initialQuery)
    }
  }, [initialQuery])

  const fetchProducts = async (searchQuery) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)
    setApiStatus({ usedMockData: false, message: null })

    try {
      // Add a timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

      const response = await fetch(`/api/product-combinations?q=${encodeURIComponent(searchQuery.trim())}`, {
        signal: controller.signal,
      })

      // Clear the timeout
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.products || data.products.length === 0) {
        setError("No products found. Please try a different search term.")
        setProducts([])
      } else {
        setProducts(data.products)

        // Set API status
        if (data.usedMockData) {
          setApiStatus({
            usedMockData: true,
            message: "Using demo data. API key may be invalid or missing.",
          })
        }
      }
    } catch (err) {
      console.error("Search error:", err)

      // Handle abort/timeout specifically
      if (err.name === "AbortError") {
        setError("Search request timed out. Please try again.")
      } else {
        setError(err.message || "Something went wrong. Please try again.")
      }

      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return

    // Update URL with search query
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    fetchProducts(query)
  }

  const handleProductSelect = (product) => {
    router.push(`/product/${product.id}?q=${encodeURIComponent(product.title)}&id=${product.id}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button onClick={() => router.push("/")} variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        <h1 className="text-2xl font-bold mb-4">Product Search</h1>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search for a product..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 pl-4 pr-10 text-base w-full"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
          <Button type="submit" className="h-10 px-6 bg-blue-600 hover:bg-blue-700">
            Search
          </Button>
        </form>

        {apiStatus.usedMockData && (
          <div className="mt-2 mb-4">
            <ApiStatusIndicator usedMockData={apiStatus.usedMockData} message={apiStatus.message} />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <ProductSelection products={products} isLoading={isLoading} error={error} onProductSelect={handleProductSelect} />
    </div>
  )
}
