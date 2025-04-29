// Mock data generator for when API keys are invalid or missing

export function generateMockResults(query, stores) {
  const results = {}

  // Base price with some randomness based on query length
  const basePrice = 5000 + query.length * 100 + Math.floor(Math.random() * 5000)

  // Price adjustments for different stores
  const priceAdjustments = {
    amazon: 1.0,
    flipkart: 1.05,
    croma: 0.95,
    alibaba: 0.85,
  }

  // Product types based on query
  let productType = "smartphone"
  let specs = ""

  if (query.toLowerCase().includes("laptop")) {
    productType = "laptop"
    specs = "Intel Core i5 | 8GB RAM | 512GB SSD | 15.6 inch Display"
  } else if (query.toLowerCase().includes("tv")) {
    productType = "television"
    specs = "4K UHD | Smart TV | HDR | 60Hz Refresh Rate"
  } else if (query.toLowerCase().includes("headphone")) {
    productType = "headphones"
    specs = "Bluetooth 5.0 | Active Noise Cancellation | 20 Hour Battery"
  } else if (query.toLowerCase().includes("watch")) {
    productType = "smartwatch"
    specs = "Heart Rate Monitor | GPS | 5 ATM Water Resistant | 7-Day Battery"
  } else if (query.toLowerCase().includes("camera")) {
    productType = "camera"
    specs = "24MP | 4K Video | 10x Optical Zoom | Image Stabilization"
  } else if (query.toLowerCase().includes("tablet")) {
    productType = "tablet"
    specs = "10.2 inch Display | 64GB Storage | Wi-Fi + Cellular | 10 Hour Battery"
  } else {
    // Default smartphone specs
    specs = "6GB RAM | 128GB Storage | 48MP Camera | 5000mAh Battery"
  }

  // Generate mock data for each store
  for (const store of stores) {
    const price = Math.round(basePrice * (priceAdjustments[store] || 1.0))
    const brandPrefix = getBrandPrefix(query, store)

    results[store] = {
      title: `${brandPrefix} ${query} ${productType} (${store.charAt(0).toUpperCase() + store.slice(1)} Exclusive)`,
      price: price,
      image: `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(query)}`,
      link: `https://www.${store}.com/search?q=${encodeURIComponent(query)}`,
      specs: specs,
    }
  }

  return results
}

// Helper function to generate a realistic brand name based on the query
function getBrandPrefix(query, store) {
  const commonBrands = {
    laptop: ["Dell", "HP", "Lenovo", "ASUS", "Acer", "Apple", "Microsoft"],
    phone: ["Samsung", "Apple", "OnePlus", "Xiaomi", "Realme", "Vivo", "OPPO"],
    tv: ["Samsung", "LG", "Sony", "TCL", "Hisense", "Xiaomi", "OnePlus"],
    headphone: ["Sony", "Bose", "JBL", "Sennheiser", "Skullcandy", "Boat", "Apple"],
    watch: ["Apple", "Samsung", "Fossil", "Garmin", "Fitbit", "Amazfit", "Noise"],
    camera: ["Canon", "Nikon", "Sony", "Fujifilm", "Panasonic", "GoPro"],
    tablet: ["Apple", "Samsung", "Lenovo", "Microsoft", "Xiaomi", "Realme"],
  }

  // Determine product category from query
  let category = "phone" // default
  for (const cat of Object.keys(commonBrands)) {
    if (query.toLowerCase().includes(cat)) {
      category = cat
      break
    }
  }

  // Get brands for the category
  const brands = commonBrands[category]

  // Use query to deterministically select a brand (so same query always gets same brand)
  const brandIndex = Math.abs(query.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % brands.length

  return brands[brandIndex]
}

export function generateMockPriceHistory(results) {
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
