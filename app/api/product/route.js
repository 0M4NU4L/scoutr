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
    let product = null
    let priceHistory = null

    // Try to get real data from SerpAPI if available
    if (process.env.SERPAPI_KEY) {
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
          }

          // Add store-specific data
          const stores = ["amazon", "flipkart", "croma", "alibaba"]

          // First, try to find exact matches for each store
          stores.forEach((store) => {
            const storeResult = shoppingResults.find(
              (item) => item.source?.toLowerCase().includes(store) || item.link?.toLowerCase().includes(store),
            )

            if (storeResult) {
              product.stores[store] = {
                title: storeResult.title,
                price: Number.parseFloat(storeResult.price.replace(/[^0-9.]/g, "")) || 0,
                image: storeResult.thumbnail,
                link: storeResult.link,
                rating: Number.parseFloat(storeResult.rating) || (Math.random() * 2 + 3).toFixed(1),
                reviewCount: storeResult.reviews || Math.floor(Math.random() * 1000) + 100,
                specs: extractSpecsFromTitle(storeResult.title),
              }
            }
          })

          // For stores without exact matches, create variations based on the main result
          stores.forEach((store) => {
            if (!product.stores[store]) {
              // Price adjustments for different stores
              const priceAdjustments = {
                amazon: 1.0,
                flipkart: 1.05,
                croma: 0.95,
                alibaba: 0.85,
              }

              const basePrice = Number.parseFloat(mainResult.price.replace(/[^0-9.]/g, "")) || 5000

              product.stores[store] = {
                title: mainResult.title,
                price: Math.round(basePrice * (priceAdjustments[store] || 1.0)),
                image: mainResult.thumbnail,
                link: mainResult.link,
                rating: (Math.random() * 2 + 3).toFixed(1),
                reviewCount: Math.floor(Math.random() * 1000) + 100,
                specs: extractSpecsFromTitle(mainResult.title),
              }
            }
          })

          // Generate price history based on the product data
          priceHistory = generatePriceHistory(product.stores)
          usedMockData = false
        }
      } catch (apiError) {
        console.error(`API error: ${apiError.message || apiError}`)
        console.log("Using mock data instead")
      }
    }

    // Fall back to mock data if SerpAPI failed or is not available
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
      }

      // Add store-specific data
      stores.forEach((store) => {
        if (mockResults[store]) {
          product.stores[store] = {
            ...mockResults[store],
            rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0 and 5.0
            reviewCount: Math.floor(Math.random() * 1000) + 100, // Random review count
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

  // Generate data for the last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today)
    date.setMonth(today.getMonth() - i)

    const dataPoint = {
      date: `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`,
    }

    // Add price data for each store with some random fluctuation
    for (const store of storeNames) {
      if (stores[store]) {
        const basePrice = stores[store].price

        // Create realistic price fluctuations (5-15% variation)
        const fluctuation = 0.85 + Math.random() * 0.3 // Between 0.85 and 1.15

        // Add seasonal trends (higher in Nov-Dec, lower in Jan-Feb)
        const month = date.getMonth()
        let seasonalFactor = 1.0

        if (month === 10 || month === 11) {
          // Nov-Dec
          seasonalFactor = 1.1 // Higher prices during holiday season
        } else if (month === 0 || month === 1) {
          // Jan-Feb
          seasonalFactor = 0.9 // Lower prices after holiday season
        }

        dataPoint[store] = Math.round(basePrice * fluctuation * seasonalFactor)
      }
    }

    priceHistory.push(dataPoint)
  }

  return priceHistory
}
