import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ message: "Query parameter is required" }, { status: 400 })
    }

    let products = []
    let usedMockData = true

    // Try to get real data from SerpAPI if available
    if (process.env.SERPAPI_KEY) {
      try {
        // Use SerpAPI for product search
        const apiUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}`

        console.log(`Fetching product combinations from Google Shopping...`)
        const response = await fetch(apiUrl)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Error fetching from Google Shopping: ${response.status} ${response.statusText}`, errorText)
          throw new Error(`API error: ${errorText}`)
        }

        const data = await response.json()
        console.log(`Successfully fetched product combinations from Google Shopping`)

        // Extract shopping results
        const shoppingResults = data.shopping_results || []

        if (shoppingResults.length > 0) {
          // Process all results
          products = shoppingResults.map((item, index) => ({
            id: item.product_id || `product-${index}`,
            title: item.title,
            price: Number.parseFloat(item.price?.replace(/[^0-9.]/g, "") || 0),
            image: item.thumbnail,
            rating: Number.parseFloat(item.rating) || (3 + Math.random() * 2).toFixed(1),
            reviewCount: item.reviews || Math.floor(Math.random() * 1000) + 100,
            link: item.link,
            source: item.source,
            specs: extractSpecsFromTitle(item.title),
            stores: {
              // We'll populate this when a specific product is selected
            },
          }))

          usedMockData = false
        }
      } catch (apiError) {
        console.error(`API error: ${apiError.message || apiError}`)
        console.log("Using mock data for product combinations instead")
      }
    }

    // Fall back to mock data if SerpAPI failed or is not available
    if (products.length === 0) {
      products = generateMockProductCombinations(query)
    }

    // Try to enhance product combinations with Gemini if available
    if (process.env.GEMINI_API_KEY && products.length > 0) {
      try {
        console.log("Attempting to enhance products with Gemini API...")

        // Make the request to the Gemini API
        const enhanceResponse = await fetch(`${request.nextUrl.origin}/api/gemini`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `${query} product variants and models`,
            task: "enhance",
          }),
          // Add a timeout to prevent hanging requests
          signal: AbortSignal.timeout(10000), // 10 second timeout
        })

        // Log the response status
        console.log(`Gemini API response status: ${enhanceResponse.status}`)

        if (enhanceResponse.ok) {
          const enhanceData = await enhanceResponse.json()

          if (enhanceData.success === false) {
            console.log(`Gemini API returned error: ${enhanceData.message}`)
          } else {
            console.log("Successfully enhanced products with Gemini API")
          }
        } else {
          // Get error details
          let errorDetails = "Unknown error"
          try {
            const errorText = await enhanceResponse.text()
            errorDetails = errorText
          } catch (e) {
            errorDetails = "Could not read error response"
          }

          console.error(
            `Failed to enhance products with Gemini API: ${enhanceResponse.status} ${enhanceResponse.statusText}`,
          )
          console.error(`Error details: ${errorDetails}`)
        }
      } catch (geminiError) {
        // Provide more detailed error logging
        console.error("Error enhancing product combinations with Gemini:", geminiError.name, geminiError.message)
        if (geminiError.cause) {
          console.error("Error cause:", geminiError.cause)
        }
        console.log("Continuing with existing product data")
      }
    } else {
      if (!process.env.GEMINI_API_KEY) {
        console.log("Gemini API key not available, skipping product enhancement")
      }
    }

    return NextResponse.json({
      products,
      usedMockData,
    })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ message: "An error occurred while fetching product combinations" }, { status: 500 })
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

// Function to generate mock product combinations
function generateMockProductCombinations(query) {
  // Extract potential product type from query
  let productType = "smartphone"

  if (query.toLowerCase().includes("laptop")) {
    productType = "laptop"
  } else if (query.toLowerCase().includes("tv")) {
    productType = "television"
  } else if (query.toLowerCase().includes("headphone")) {
    productType = "headphones"
  } else if (query.toLowerCase().includes("watch")) {
    productType = "smartwatch"
  } else if (query.toLowerCase().includes("camera")) {
    productType = "camera"
  } else if (query.toLowerCase().includes("tablet")) {
    productType = "tablet"
  }

  // Generate product variations
  const products = []
  const brands = getBrandsForProductType(productType)
  const basePrice = 5000 + Math.floor(Math.random() * 15000)

  // Generate 8-12 product combinations
  const numProducts = 8 + Math.floor(Math.random() * 5)

  for (let i = 0; i < numProducts; i++) {
    const brand = brands[i % brands.length]
    const model = getModelName(productType, i)
    const priceVariation = 0.8 + Math.random() * 0.4 // 80% to 120% of base price
    const storage = getStorageVariation(i, productType)
    const color = getColorVariation(i)

    products.push({
      id: `product-${i}`,
      title: `${brand} ${model} ${productType} ${storage} ${color}`,
      price: Math.round(basePrice * priceVariation),
      image: `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(brand)}`,
      rating: (3 + Math.random() * 2).toFixed(1), // 3.0 to 5.0
      reviewCount: Math.floor(Math.random() * 1000) + 100,
      specs: generateMockSpecs(productType, storage, color),
    })
  }

  return products
}

function getBrandsForProductType(productType) {
  const brandsByType = {
    laptop: ["Dell", "HP", "Lenovo", "ASUS", "Acer", "Apple", "Microsoft"],
    smartphone: ["Samsung", "Apple", "OnePlus", "Xiaomi", "Realme", "Vivo", "OPPO"],
    television: ["Samsung", "LG", "Sony", "TCL", "Hisense", "Xiaomi", "OnePlus"],
    headphones: ["Sony", "Bose", "JBL", "Sennheiser", "Skullcandy", "Boat", "Apple"],
    smartwatch: ["Apple", "Samsung", "Fossil", "Garmin", "Fitbit", "Amazfit", "Noise"],
    camera: ["Canon", "Nikon", "Sony", "Fujifilm", "Panasonic", "GoPro"],
    tablet: ["Apple", "Samsung", "Lenovo", "Microsoft", "Xiaomi", "Realme"],
  }

  return brandsByType[productType] || brandsByType.smartphone
}

function getModelName(productType, index) {
  const modelsByType = {
    laptop: ["Inspiron", "Pavilion", "ThinkPad", "ZenBook", "Swift", "MacBook", "Surface"],
    smartphone: ["Galaxy S", "iPhone", "Nord", "Redmi Note", "GT", "V", "Reno"],
    television: ["QLED", "NanoCell", "Bravia", "P Series", "U Series", "Mi TV", "TV"],
    headphones: ["WH-1000XM", "QuietComfort", "Tune", "HD", "Crusher", "Rockerz", "AirPods"],
    smartwatch: ["Watch", "Galaxy Watch", "Gen", "Forerunner", "Versa", "GTS", "ColorFit"],
    camera: ["EOS", "Z", "Alpha", "X-T", "Lumix", "Hero"],
    tablet: ["iPad", "Galaxy Tab", "Tab", "Surface", "Pad", "Pad"],
  }

  const models = modelsByType[productType] || modelsByType.smartphone
  const model = models[index % models.length]

  // Add a number to the model
  return `${model} ${Math.floor(Math.random() * 10) + 1}`
}

function getStorageVariation(index, productType) {
  if (productType === "smartphone" || productType === "tablet") {
    const ramOptions = ["4GB", "6GB", "8GB", "12GB"]
    const storageOptions = ["64GB", "128GB", "256GB", "512GB"]

    const ram = ramOptions[index % ramOptions.length]
    const storage = storageOptions[Math.floor(index / 4) % storageOptions.length]

    return `${ram} RAM ${storage}`
  } else if (productType === "laptop") {
    const ramOptions = ["8GB", "16GB", "32GB"]
    const storageOptions = ["256GB SSD", "512GB SSD", "1TB SSD"]

    const ram = ramOptions[index % ramOptions.length]
    const storage = storageOptions[Math.floor(index / 3) % storageOptions.length]

    return `${ram} RAM ${storage}`
  } else if (productType === "television") {
    const sizeOptions = ['32"', '43"', '50"', '55"', '65"']
    return sizeOptions[index % sizeOptions.length]
  }

  return ""
}

function getColorVariation(index) {
  const colors = ["Black", "White", "Blue", "Silver", "Gold", "Gray", "Red", "Green"]
  return colors[index % colors.length]
}

function generateMockSpecs(productType, storage, color) {
  const specs = []

  if (storage) {
    specs.push(storage)
  }

  if (color) {
    specs.push(`Color: ${color}`)
  }

  if (productType === "smartphone") {
    specs.push("Camera: 48MP + 12MP + 5MP")
    specs.push("Battery: 5000mAh")
    specs.push("Display: 6.5 inch")
    specs.push("Processor: Snapdragon 888")
  } else if (productType === "laptop") {
    specs.push("Display: 15.6 inch")
    specs.push("Processor: Intel Core i7")
    specs.push("Graphics: NVIDIA GTX 1650")
    specs.push("Battery: 6 hours")
  } else if (productType === "television") {
    specs.push("Resolution: 4K UHD")
    specs.push("Smart TV: Yes")
    specs.push("HDR: Yes")
    specs.push("Refresh Rate: 60Hz")
  }

  return specs.join(" | ")
}
