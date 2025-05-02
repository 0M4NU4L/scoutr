import { NextResponse } from "next/server"
import { generateMockResults, generateMockPriceHistory } from "../search/mock-data"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const productId = searchParams.get("id")

    if (!query) {
      return NextResponse.json({ message: "Query parameter is required" }, { status: 400 })
    }

    let usedMockData = true
    let dataSource = "mock"
    let product = null
    let priceHistory = null

    // Try to get real data from SerpAPI if available
    if (process.env.SERPAPI_KEY && process.env.SERPAPI_KEY.trim() !== "") {
      try {
        // Use SerpAPI for product search
        const apiUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}`

        console.log(`Fetching from Google Shopping...`)
        const response = await fetch(apiUrl)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Error fetching from Google Shopping: ${response.status} ${response.statusText}`, errorText)
          throw new Error(`API error: ${errorText}`)
        }

        const data = await response.json()
        console.log(`Successfully fetched data from Google Shopping`)

        // Check if we have actual results
        if (!data.shopping_results || data.shopping_results.length === 0) {
          console.log("No shopping results found. Using mock data.")
          throw new Error("No shopping results found")
        }

        dataSource = "serpapi"
        usedMockData = false

        // Extract shopping results
        const shoppingResults = data.shopping_results || []

        if (shoppingResults.length > 0) {
          // Create a product object from the first result
          const mainResult = shoppingResults[0]

          product = {
            id: productId || mainResult.product_id || "product-id",
            title: mainResult.title,
            image: mainResult.thumbnail,
            rating: Number.parseFloat(mainResult.rating) || (Math.random() * 2 + 3).toFixed(1),
            reviewCount: mainResult.reviews || Math.floor(Math.random() * 1000) + 100,
            specs: extractSpecsFromTitle(mainResult.title),
            stores: {},
            isRealData: true,
            dataSource: "serpapi",
          }

          // Add store-specific data
          const stores = ["amazon", "flipkart", "croma", "alibaba"]

          // First, try to find exact matches for each store
          stores.forEach((store) => {
            const storeResult = shoppingResults.find(
              (item) => item.source?.toLowerCase().includes(store) || item.link?.toLowerCase().includes(store),
            )

            if (storeResult) {
              // Extract price from string (remove currency symbol and commas)
              const priceText = storeResult.price || ""
              const price = Number.parseFloat(priceText.replace(/[^0-9.]/g, ""))

              product.stores[store] = {
                title: storeResult.title,
                price: price || 0,
                image: storeResult.thumbnail,
                link: storeResult.link,
                rating: Number.parseFloat(storeResult.rating) || (Math.random() * 2 + 3).toFixed(1),
                reviewCount: storeResult.reviews || Math.floor(Math.random() * 1000) + 100,
                specs: extractSpecsFromTitle(storeResult.title),
                isRealData: true,
              }
            }
          })

          // For stores without exact matches, create variations based on the main result
          stores.forEach((store) => {
            if (!product.stores[store]) {
              // Price adjustments for different stores
              const priceAdjustments = {
                amazon: 1.0,
                flipkart: 0.97,
                croma: 1.03,
                alibaba: 0.85,
              }

              const basePrice = Number.parseFloat(mainResult.price.replace(/[^0-9.]/g, "")) || 5000
              const variationFactor = 0.98 + Math.random() * 0.04 // Between 0.98 and 1.02

              product.stores[store] = {
                title: mainResult.title,
                price: Math.round(basePrice * (priceAdjustments[store] || 1.0) * variationFactor),
                image: mainResult.thumbnail,
                link: mainResult.link,
                rating: (Math.random() * 2 + 3).toFixed(1),
                reviewCount: Math.floor(Math.random() * 1000) + 100,
                specs: extractSpecsFromTitle(mainResult.title),
                isRealData: false, // Flag to indicate this is partially mock data
              }
            }
          })

          // Generate price history based on the product data
          priceHistory = generatePriceHistory(product.stores)
        }
      } catch (apiError) {
        console.error(`API error: ${apiError.message || apiError}`)
        console.log("Using mock data instead")
      }
    }

    // Try PriceAPI as a fallback if SerpAPI failed or is not available
    if (usedMockData && process.env.PRICEAPI_KEY && process.env.PRICEAPI_KEY.trim() !== "") {
      try {
        console.log("Attempting to fetch data from PriceAPI...")

        // Use PriceAPI for product search
        const apiUrl = `https://api.priceapi.com/v2/jobs`
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PRICEAPI_KEY}`,
          },
          body: JSON.stringify({
            source: "amazon,flipkart,croma",
            country: "in",
            topic: "search_results",
            key: query,
            max_age: 3600,
            max_pages: 1,
          }),
        })

        if (!response.ok) {
          throw new Error(`PriceAPI error: ${response.status}`)
        }

        const jobData = await response.json()

        // Wait for job completion and get results
        const resultsUrl = `https://api.priceapi.com/v2/jobs/${jobData.id}/download`
        const resultsResponse = await fetch(resultsUrl, {
          headers: {
            Authorization: `Bearer ${process.env.PRICEAPI_KEY}`,
          },
        })

        if (!resultsResponse.ok) {
          throw new Error(`Failed to get PriceAPI results: ${resultsResponse.status}`)
        }

        const priceData = await resultsResponse.json()

        if (priceData.results && priceData.results.length > 0) {
          console.log("Successfully fetched data from PriceAPI")
          dataSource = "priceapi"
          usedMockData = false

          // Create product object
          const mainResult = priceData.results[0]

          product = {
            id: productId || "product-id",
            title: mainResult.title,
            image: mainResult.image || `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(query)}`,
            rating: Number(mainResult.rating) || (Math.random() * 2 + 3).toFixed(1),
            reviewCount: Number(mainResult.review_count) || Math.floor(Math.random() * 1000) + 100,
            specs: extractSpecsFromTitle(mainResult.title),
            stores: {},
            isRealData: true,
            dataSource: "priceapi",
          }

          // Add store-specific data
          const stores = ["amazon", "flipkart", "croma", "alibaba"]

          stores.forEach((store) => {
            const storeResults = priceData.results.filter(
              (item) => item.source?.toLowerCase().includes(store) || item.url?.toLowerCase().includes(store),
            )

            if (storeResults.length > 0) {
              const storeResult = storeResults[0]

              product.stores[store] = {
                title: storeResult.title,
                price: Number(storeResult.price) || 0,
                image: storeResult.image || `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(store)}`,
                link: storeResult.url,
                rating: Number(storeResult.rating) || (Math.random() * 2 + 3).toFixed(1),
                reviewCount: Number(storeResult.review_count) || Math.floor(Math.random() * 1000) + 100,
                specs: extractSpecsFromTitle(storeResult.title),
                isRealData: true,
              }
            }
          })

          // For stores without data, create variations
          stores.forEach((store) => {
            if (!product.stores[store]) {
              // Similar to the SerpAPI implementation
              const priceAdjustments = {
                amazon: 1.0,
                flipkart: 0.97,
                croma: 1.03,
                alibaba: 0.85,
              }

              // Find a store with data to base our estimates on
              const baseStore = Object.keys(product.stores).find((s) => product.stores[s] !== null)

              if (baseStore) {
                const basePrice = product.stores[baseStore].price
                const variationFactor = 0.98 + Math.random() * 0.04

                product.stores[store] = {
                  title: product.title,
                  price: Math.round(basePrice * (priceAdjustments[store] || 1.0) * variationFactor),
                  image: product.image,
                  link: `https://www.${store}.com/search?q=${encodeURIComponent(query)}`,
                  rating: (Math.random() * 2 + 3).toFixed(1),
                  reviewCount: Math.floor(Math.random() * 1000) + 100,
                  specs: product.specs,
                  isRealData: false,
                }
              }
            }
          })

          // Generate price history
          priceHistory = generatePriceHistory(product.stores)
        } else {
          throw new Error("No results found from PriceAPI")
        }
      } catch (priceApiError) {
        console.error(`PriceAPI error: ${priceApiError.message || priceApiError}`)
        console.log("Using mock data as final fallback")
      }
    }

    // Fall back to mock data if all APIs failed or are not available
    if (!product) {
      // Generate mock product data
      const stores = ["amazon", "flipkart", "croma", "alibaba"]
      const mockResults = generateMockResults(query, stores)

      // Create a more detailed product object
      product = {
        id: productId || "mock-product-id",
        title: mockResults.amazon?.title || query,
        image: mockResults.amazon?.image || "/placeholder.svg",
        rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0 and 5.0
        reviewCount: Math.floor(Math.random() * 1000) + 100, // Random review count
        specs: mockResults.amazon?.specs || null,
        stores: {},
        isRealData: false,
        dataSource: "mock",
      }

      // Add store-specific data
      stores.forEach((store) => {
        if (mockResults[store]) {
          product.stores[store] = {
            ...mockResults[store],
            rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0 and 5.0
            reviewCount: Math.floor(Math.random() * 1000) + 100, // Random review count
            isRealData: false,
          }
        }
      })

      // Generate price history
      priceHistory = generateMockPriceHistory(mockResults)
    }

    // Try to enhance product data with Gemini if available
    if (process.env.GEMINI_API_KEY && product) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/gemini`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: product.title,
            task: "enhance",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          // Use the enhanced data to improve specs if available
          if (data.result) {
            product.enhancedSpecs = data.result
          }
        }
      } catch (geminiError) {
        console.error("Error enhancing product with Gemini:", geminiError)
      }
    }

    return NextResponse.json({
      product,
      priceHistory,
      usedMockData,
      dataSource,
    })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ message: "An error occurred while fetching product details" }, { status: 500 })
  }
}

// Function to extract specifications from product title
function extractSpecsFromTitle(title) {
  if (!title) return null

  // Common patterns for specifications in product titles
  const patterns = [
    // RAM and storage pattern (e.g., "8GB RAM 128GB Storage")
    { regex: /(\d+\s*GB\s*RAM|\d+\s*GB\s*Storage|\d+\s*TB\s*Storage)/gi, prefix: "" },

    // Screen size pattern (e.g., "6.5 inch display")
    { regex: /(\d+(\.\d+)?\s*inch|\d+(\.\d+)?\s*")/gi, prefix: "Display: " },

    // Resolution pattern (e.g., "1080p" or "4K")
    { regex: /(1080p|2160p|4K|UHD|Full HD|HD)/gi, prefix: "Resolution: " },

    // Processor pattern (e.g., "Snapdragon 888" or "A15 Bionic")
    { regex: /(Snapdragon|Exynos|MediaTek|A\d+|Intel|AMD|Ryzen|Core i\d+)/gi, prefix: "Processor: " },

    // Camera pattern (e.g., "48MP camera")
    { regex: /(\d+\s*MP)/gi, prefix: "Camera: " },

    // Battery pattern (e.g., "5000mAh")
    { regex: /(\d+\s*mAh)/gi, prefix: "Battery: " },

    // Color pattern
    { regex: /(Black|White|Blue|Red|Green|Gold|Silver|Gray|Rose Gold|Purple)/gi, prefix: "Color: " },
  ]

  const specs = []

  // Extract specs based on patterns
  patterns.forEach((pattern) => {
    const matches = [...title.matchAll(pattern.regex)]
    if (matches.length > 0) {
      // Get unique matches
      const uniqueMatches = [...new Set(matches.map((m) => m[0]))]
      specs.push(`${pattern.prefix}${uniqueMatches.join(", ")}`)
    }
  })

  // If we couldn't extract any specs, return null
  if (specs.length === 0) return null

  return specs.join(" | ")
}

// Function to generate price history data
function generatePriceHistory(stores) {
  const storeNames = Object.keys(stores).filter((store) => stores[store] !== null)

  // Skip if no valid stores
  if (storeNames.length === 0) return null

  const today = new Date()
  const priceHistory = []

  // Generate data for the last 12 months with more realistic price trends
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today)
    date.setMonth(today.getMonth() - i)

    const dataPoint = {
      date: `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`,
    }

    // Add price data for each store with realistic fluctuations
    for (const store of storeNames) {
      if (stores[store]) {
        const basePrice = stores[store].price

        // Create realistic price fluctuations based on market trends
        // We'll use a combination of:
        // 1. Seasonal trends (sales periods, new model releases)
        // 2. General price decay for tech products
        // 3. Small random fluctuations

        // 1. Seasonal factor
        const month = date.getMonth()
        let seasonalFactor = 1.0

        // Major sales periods in India
        if (month === 9) {
          // October - Diwali sales
          seasonalFactor = 0.85
        } else if (month === 0) {
          // January - New Year sales
          seasonalFactor = 0.9
        } else if (month === 7) {
          // August - Independence Day sales
          seasonalFactor = 0.92
        } else if (month === 5) {
          // June - End of financial year
          seasonalFactor = 0.95
        }

        // 2. Price decay factor - tech products generally decrease in price over time
        // More recent months have less decay
        const decayFactor = 1 + i * 0.01 // Older months have higher prices

        // 3. Random fluctuation (small variations between -2% and +2%)
        const randomFactor = 0.98 + Math.random() * 0.04

        // Calculate final price with all factors
        dataPoint[store] = Math.round(basePrice * seasonalFactor * decayFactor * randomFactor)
      }
    }

    priceHistory.push(dataPoint)
  }

  return priceHistory
}
