// Mock data generator for when API keys are invalid or missing

export function generateMockResults(query, stores) {
  const results = {}

  // More realistic base price based on product category
  const productCategory = determineProductCategory(query)
  const basePrice = getRealisticBasePrice(productCategory)

  // More realistic price adjustments for different stores
  const priceAdjustments = {
    amazon: 1.0,
    flipkart: 0.97, // Flipkart often has slightly lower prices
    croma: 1.03, // Croma tends to be slightly higher
    alibaba: 0.85, // Alibaba generally has lower prices
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
    // Add slight random variation to make prices more realistic
    const variationFactor = 0.98 + Math.random() * 0.04 // Between 0.98 and 1.02
    const price = Math.round(basePrice * (priceAdjustments[store] || 1.0) * variationFactor)

    // Get a realistic brand for this product category
    const brandPrefix = getBrandPrefix(query, store)

    results[store] = {
      title: `${brandPrefix} ${query} ${productType} (${store.charAt(0).toUpperCase() + store.slice(1)} Exclusive)`,
      price: price,
      image: `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(query)}`,
      link: `https://www.${store}.com/search?q=${encodeURIComponent(query)}`,
      specs: specs,
      lastUpdated: new Date().toISOString(),
      isRealData: false, // Flag to indicate this is mock data
    }
  }

  return results
}

// Helper function to determine product category from query
function determineProductCategory(query) {
  const queryLower = query.toLowerCase()

  if (queryLower.includes("laptop") || queryLower.includes("notebook")) return "laptop"
  if (queryLower.includes("tv") || queryLower.includes("television")) return "tv"
  if (queryLower.includes("headphone") || queryLower.includes("earphone") || queryLower.includes("earbud"))
    return "headphone"
  if (queryLower.includes("watch") || queryLower.includes("smartwatch")) return "watch"
  if (queryLower.includes("camera")) return "camera"
  if (queryLower.includes("tablet") || queryLower.includes("ipad")) return "tablet"
  if (queryLower.includes("phone") || queryLower.includes("smartphone") || queryLower.includes("mobile")) return "phone"
  if (queryLower.includes("monitor") || queryLower.includes("display")) return "monitor"
  if (queryLower.includes("speaker") || queryLower.includes("sound")) return "speaker"
  if (queryLower.includes("keyboard") || queryLower.includes("mouse")) return "peripheral"

  // Default to phone if no category is detected
  return "phone"
}

// Helper function to get realistic base price based on product category
function getRealisticBasePrice(category) {
  // Base prices are in INR (Indian Rupees)
  const basePrices = {
    laptop: 45000 + Math.floor(Math.random() * 30000), // 45,000 - 75,000 INR
    tv: 25000 + Math.floor(Math.random() * 50000), // 25,000 - 75,000 INR
    headphone: 2000 + Math.floor(Math.random() * 8000), // 2,000 - 10,000 INR
    watch: 3000 + Math.floor(Math.random() * 17000), // 3,000 - 20,000 INR
    camera: 20000 + Math.floor(Math.random() * 30000), // 20,000 - 50,000 INR
    tablet: 15000 + Math.floor(Math.random() * 35000), // 15,000 - 50,000 INR
    phone: 12000 + Math.floor(Math.random() * 38000), // 12,000 - 50,000 INR
    monitor: 8000 + Math.floor(Math.random() * 22000), // 8,000 - 30,000 INR
    speaker: 3000 + Math.floor(Math.random() * 12000), // 3,000 - 15,000 INR
    peripheral: 1000 + Math.floor(Math.random() * 4000), // 1,000 - 5,000 INR
  }

  return basePrices[category] || 10000 + Math.floor(Math.random() * 10000) // Default: 10,000 - 20,000 INR
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
    monitor: ["LG", "Samsung", "Dell", "ASUS", "BenQ", "ViewSonic"],
    speaker: ["JBL", "Sony", "Bose", "Harman Kardon", "Boat", "Marshall"],
    peripheral: ["Logitech", "Corsair", "Razer", "SteelSeries", "Microsoft", "HP"],
  }

  // Determine product category from query
  const category = determineProductCategory(query)

  // Get brands for the category
  const brands = commonBrands[category] || commonBrands.phone // Default to phone brands

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

  // Generate data for the last 12 months with more realistic price trends
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today)
    date.setMonth(today.getMonth() - i)

    const dataPoint = {
      date: `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`,
    }

    // Add price data for each store with realistic fluctuations
    for (const store of stores) {
      if (results[store]) {
        const basePrice = results[store].price

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

// Generate realistic price trends for a specific product over time
export function generateRealisticPriceTrend(basePrice, months = 12) {
  const today = new Date()
  const priceHistory = []

  // Tech products typically follow a price decay curve
  // New products start high and gradually decrease
  // With occasional spikes for sales events

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setMonth(today.getMonth() - i)

    // Base decay: products lose ~5% value every 3 months
    const ageDecay = 1 + i * 0.016

    // Seasonal events
    const month = date.getMonth()
    let seasonalFactor = 1.0

    // Major sales periods
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

    // Small random fluctuation
    const randomFactor = 0.98 + Math.random() * 0.04

    // Calculate price for this month
    const price = Math.round(basePrice * ageDecay * seasonalFactor * randomFactor)

    priceHistory.push({
      date: `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`,
      price: price,
    })
  }

  return priceHistory
}
