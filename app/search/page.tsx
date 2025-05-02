"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Search, AlertTriangle, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProductSelection } from "@/components/product-selection"
import { ApiStatusIndicator } from "@/components/api-status-indicator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SearchFilters } from "@/components/search-filters"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [apiStatus, setApiStatus] = useState({ usedMockData: false, message: null })

  const [sortBy, setSortBy] = useState("relevance")
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [showFilters, setShowFilters] = useState(false)

  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 100000],
    ratings: [],
    brands: [],
  })

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

  const handleSort = (value) => {
    setSortBy(value)

    // Sort the products based on the selected option
    const sortedProducts = [...products]

    switch (value) {
      case "price-low":
        sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case "price-high":
        sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case "rating":
        sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      default:
        // Keep original order for relevance
        break
    }

    setProducts(sortedProducts)
  }

  const handleFilterChange = (filters) => {
    setActiveFilters(filters)
  }

  const applyFilters = (products) => {
    if (!products) return []

    return products.filter((product) => {
      // Apply price filter
      const price = product.price || 0
      if (price < activeFilters.priceRange[0] || price > activeFilters.priceRange[1]) {
        return false
      }

      // Apply rating filter
      if (activeFilters.ratings.length > 0) {
        const rating = product.rating || 0
        const passesRating = activeFilters.ratings.some((r) => rating >= Number.parseInt(r))
        if (!passesRating) return false
      }

      // Apply brand filter
      if (activeFilters.brands.length > 0) {
        // Extract brand from title (simplified approach)
        const title = product.title || ""
        const passesBrand = activeFilters.brands.some((brand) => title.toLowerCase().includes(brand.toLowerCase()))
        if (!passesBrand) return false
      }

      return true
    })
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

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <SearchFilters onFilterChange={handleFilterChange} minPrice={0} maxPrice={100000} />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={handleSort}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Relevance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showFilters && (
          <div className="bg-muted/30 p-4 rounded-lg mb-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="price">
                <AccordionTrigger>Price Range</AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 px-2">
                    <Slider
                      defaultValue={[0, 100000]}
                      max={100000}
                      step={1000}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="mb-6"
                    />
                    <div className="flex justify-between">
                      <span>₹{priceRange[0].toLocaleString()}</span>
                      <span>₹{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {products.length > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{applyFilters(products).length} products found</p>
            {sortBy !== "relevance" && (
              <Button variant="ghost" size="sm" onClick={() => handleSort("relevance")}>
                <ArrowUpDown className="h-3 w-3 mr-1" />
                Reset Sort
              </Button>
            )}
          </div>
        )}
      </div>

      <ProductSelection
        products={applyFilters(products)}
        isLoading={isLoading}
        error={error}
        onProductSelect={handleProductSelect}
      />
    </div>
  )
}
