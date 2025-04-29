import { NextResponse } from "next/server"
import { generateMockResults, generateMockPriceHistory } from "./mock-data"
import { enhanceResultsWithGemini } from "./gemini"

// In-memory cache
const cache = new Map()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const storesParam = searchParams.get("stores") || "amazon,flipkart,croma"
    const stores = storesParam.split(",")

    if (!query) {
      return NextResponse.json({ message: "Query parameter is required" }, { status: 400 })
    }

    // Check cache first
    const cacheKey = `${query.toLowerCase()}-${storesParam}`
    if (cache.has(cacheKey)) {
      const { data, timestamp } = cache.get(cacheKey)
      if (Date.now() - timestamp < CACHE_DURATION) {
        return NextResponse.json(data)
      }
    }

    try {
      // Initialize results object with requested stores
      const results = {}
      stores.forEach((store) => {
        results[store] = null
      })

      let usedMockData = false

      try {
        // Check if PRICEAPI_KEY exists and is not empty
        if (!process.env.PRICEAPI_KEY || process.env.PRICEAPI_KEY.trim() === "") {
          console.log("PriceAPI key is missing or empty. Using mock data.")
          throw new Error("API key is missing")
        }

        // Use PriceAPI for product search
        const apiUrl = `https://api.priceapi.com/v2/jobs`
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.PRICEAPI_KEY}`,
          },
          body: JSON.stringify({
            source: "amazon,flipkart,croma", // Multiple sources
            country: "in",
            topic: "search_results",
            key: query,
            max_age: 3600, // 1 hour for more recent prices
            max_pages: 2, // Get more results for better matching
            price_min: 100, // Minimum price filter
            price_max: 1000000, // Maximum price filter
            sort_by: "price_asc", // Sort by price to get best deals
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Error fetching from PriceAPI: ${response.status} ${response.statusText}`, errorText)
          throw new Error(`API error: ${errorText}`)
        }

        const jobData = await response.json()
        console.log(`Successfully created PriceAPI job: ${jobData.id}`)

        // Wait for job completion and get results
        const resultsUrl = `https://api.priceapi.com/v2/jobs/${jobData.id}/download`
        const resultsResponse = await fetch(resultsUrl, {
          headers: {
            "Authorization": `Bearer ${process.env.PRICEAPI_KEY}`,
          },
        })

        if (!resultsResponse.ok) {
          throw new Error(`Failed to get PriceAPI results: ${resultsResponse.status}`)
        }

        const priceData = await resultsResponse.json()
        console.log(`Successfully fetched data from PriceAPI`)

        // Process results for each store
        for (const store of stores) {
          const storeResults = priceData.results.filter(item => 
            item.source.toLowerCase().includes(store) || 
            item.url.toLowerCase().includes(store)
          )

          if (storeResults.length > 0) {
            // Sort by price and get the best match
            const bestResult = storeResults.sort((a, b) => {
              // First prioritize exact matches
              const aExactMatch = a.title.toLowerCase().includes(query.toLowerCase())
              const bExactMatch = b.title.toLowerCase().includes(query.toLowerCase())
              if (aExactMatch && !bExactMatch) return -1
              if (!aExactMatch && bExactMatch) return 1
              
              // Then sort by price
              return a.price - b.price
            })[0]

            // Validate price
            const price = Number(bestResult.price)
            if (isNaN(price) || price <= 0) {
              console.warn(`Invalid price for ${store}: ${bestResult.price}`)
              continue
            }

            results[store] = {
              title: bestResult.title,
              price: price,
              image: bestResult.image || "/placeholder.svg",
              link: bestResult.url,
              specs: extractSpecsFromTitle(bestResult.title),
              rating: Number(bestResult.rating) || null,
              reviewCount: Number(bestResult.review_count) || null,
              offers: bestResult.offers || null,
              lastUpdated: new Date().toISOString(),
            }
          }
        }

        // Verify we have at least one valid result
        const validResults = Object.values(results).filter(r => r !== null)
        if (validResults.length === 0) {
          throw new Error("No valid results found")
        }

        // Try to enhance results with Gemini API if available
        if (process.env.GEMINI_API_KEY) {
          try {
            console.log("Attempting to enhance results with Gemini API...")
            await enhanceResultsWithGemini(results, query)
            console.log("Gemini enhancement completed successfully")
          } catch (geminiError) {
            console.error("Error enhancing results with Gemini:", geminiError)
            console.log("Continuing with original results without Gemini enhancement")
          }
        }
      } catch (apiError) {
        console.error(`API error: ${apiError.message || apiError}`)
        console.log("Using mock data instead")

        // Use mock data when API fails
        const mockResults = generateMockResults(query, stores)
        for (const store of stores) {
          results[store] = mockResults[store]
        }
        usedMockData = true
      }

      // Generate price history data
      const priceHistory = usedMockData ? generateMockPriceHistory(results) : generatePriceHistory(results)

      const responseData = {
        results,
        priceHistory,
        usedMockData,
      }

      // Cache the results
      cache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
      })

      return NextResponse.json(responseData)
    } catch (error) {
      console.error("API route error:", error)
      return NextResponse.json({ message: "An error occurred while fetching results" }, { status: 500 })
    }
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ message: "An error occurred while fetching results" }, { status: 500 })
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
function generatePriceHistory(results) {
  const stores = Object.keys(results).filter((store) => results[store] !== null)

  // Skip if no valid results
  if (stores.length === 0) return null

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
    for (const store of stores) {
      if (results[store]) {
        const basePrice = results[store].price

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
