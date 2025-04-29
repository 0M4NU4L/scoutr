"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, TrendingUp, ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { STORE_LOGOS, STORES } from "@/lib/constants"

export default function Home() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedStores, setSelectedStores] = useState({
    amazon: true,
    flipkart: true,
    croma: true,
    alibaba: false,
  })

  // Handle store selection
  const handleStoreSelection = (store) => {
    setSelectedStores((prev) => ({
      ...prev,
      [store]: !prev[store],
    }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return

    // Navigate to the search page with the query
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-950">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                <span className="text-blue-600 dark:text-blue-400">Scoutr</span> - Find the Best Deals
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                Compare prices across multiple e-commerce platforms and save money on your purchases.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <div className="flex space-x-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => document.getElementById("search-section").scrollIntoView({ behavior: "smooth" })}
                >
                  Start Comparing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-3 items-center">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col space-y-1.5 pb-4">
                <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-2xl font-semibold leading-none tracking-tight mt-4">Multi-Store Search</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                Search across Amazon, Flipkart, Croma, and more to find the best deals on your favorite products.
              </div>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col space-y-1.5 pb-4">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-2xl font-semibold leading-none tracking-tight mt-4">Price Trends</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                View price history and trends to make informed purchasing decisions and buy at the right time.
              </div>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col space-y-1.5 pb-4">
                <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-2xl font-semibold leading-none tracking-tight mt-4">Direct Links</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                Get direct links to product pages on e-commerce websites for a seamless shopping experience.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section
        id="search-section"
        className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-blue-950"
      >
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-2xl font-bold">Compare Prices Across Platforms</h2>
            <p className="text-muted-foreground">Select the stores you want to compare and enter your product</p>
          </div>

          {/* Store Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {Object.keys(STORES).map((store) => (
              <div key={store} className="flex items-center space-x-2">
                <Checkbox
                  id={`store-${store}`}
                  checked={selectedStores[store]}
                  onCheckedChange={() => handleStoreSelection(store)}
                />
                <Label htmlFor={`store-${store}`} className="flex items-center space-x-2 cursor-pointer">
                  <Image
                    src={STORE_LOGOS[store] || "/placeholder.svg"}
                    alt={`${STORES[store]} logo`}
                    width={80}
                    height={24}
                    className="h-6 w-auto object-contain"
                  />
                </Label>
              </div>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="w-full">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Input
                  type="text"
                  placeholder="Search for a product..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-12 pl-4 pr-10 text-base w-full"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
              <Button type="submit" className="h-12 px-6 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                Compare Prices
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-slate-900 text-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-6 w-6" />
              <span className="text-xl font-bold">Scoutr</span>
            </div>
            <p className="text-sm text-slate-400">© {new Date().getFullYear()} Scoutr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
