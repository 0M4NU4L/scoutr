import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ message: "Query parameter is required" }, { status: 400 })
    }

    let summary = null
    let factChecked = false
    let usedMockData = true

    // Try to get real data from Gemini API if available
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/gemini`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            task: "summary",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          summary = data.result
          factChecked = true
          usedMockData = false
          console.log("Successfully generated summary with Gemini API")
        } else {
          console.error("Failed to get summary from Gemini API, falling back to mock data")
        }
      } catch (geminiError) {
        console.error("Error calling Gemini API:", geminiError)
        console.log("Falling back to mock data for summary")
      }
    } else {
      console.log("Gemini API key not available, using mock data for summary")
    }

    // Fall back to mock data if Gemini API failed or is not available
    if (!summary) {
      summary = generateProductSummary(query)
    }

    return NextResponse.json({
      summary,
      factChecked,
      usedMockData,
    })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ message: "An error occurred while generating product summary" }, { status: 500 })
  }
}

function generateProductSummary(query) {
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

  // Generate summary based on product type
  const summaries = {
    smartphone: `
      <p>This smartphone offers an excellent balance of performance, camera quality, and battery life. Based on our analysis of customer reviews and technical specifications, it stands out in the mid-range segment with its competitive pricing.</p>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Key Strengths</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li>Impressive camera system that performs well in various lighting conditions</li>
        <li>All-day battery life with fast charging support</li>
        <li>Smooth performance for everyday tasks and moderate gaming</li>
        <li>Bright and vibrant display with good outdoor visibility</li>
      </ul>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Considerations</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li>Some users report occasional software glitches</li>
        <li>Camera performance drops in low-light conditions</li>
        <li>Limited storage expansion options</li>
      </ul>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Alternatives to Consider</h3>
      <p>If you're looking for alternatives, consider the Samsung Galaxy A series, Xiaomi Redmi Note series, or the OnePlus Nord lineup, which offer similar features at comparable price points.</p>
    `,

    laptop: `
      <p>This laptop delivers solid performance for productivity tasks, content creation, and casual gaming. It offers good value for money with its combination of processing power, display quality, and build construction.</p>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Key Strengths</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li>Powerful processor suitable for multitasking and demanding applications</li>
        <li>Crisp, color-accurate display ideal for content creation</li>
        <li>Comfortable keyboard with good key travel and backlighting</li>
        <li>Decent battery life for a laptop in this performance class</li>
      </ul>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Considerations</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li>Fan noise can be noticeable under heavy loads</li>
        <li>Limited port selection may require dongles for some users</li>
        <li>Average built-in speakers</li>
      </ul>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Alternatives to Consider</h3>
      <p>If you're exploring alternatives, look at the Dell XPS series, HP Envy lineup, or the ASUS ZenBook range, which compete in the same segment with different strengths in design, performance, and display quality.</p>
    `,

    television: `
      <p>This TV offers excellent picture quality and smart features at a competitive price point. It's well-suited for both casual viewing and more demanding content like sports and movies.</p>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Key Strengths</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li>Vibrant colors and deep blacks provide an immersive viewing experience</li>
        <li>Low input lag makes it suitable for gaming</li>
        <li>Comprehensive smart platform with popular streaming apps</li>
        <li>Good upscaling of lower resolution content</li>
      </ul>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Considerations</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li>Viewing angles could be better for larger rooms</li>
        <li>Audio quality is average and may benefit from a soundbar</li>
        <li>Smart interface can occasionally lag during navigation</li>
      </ul>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Alternatives to Consider</h3>
      <p>For similar features and performance, consider models from Sony's Bravia line, Samsung's QLED series, or LG's NanoCell TVs, which may offer different strengths in picture processing, smart features, or design.</p>
    `,

    headphones: `
      <p>These headphones deliver impressive sound quality and comfort for extended listening sessions. They represent a good investment for music enthusiasts and casual listeners alike.</p>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Key Strengths</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li>Well-balanced sound profile suitable for various music genres</li>
        <li>Effective noise cancellation that adapts to your environment</li>
        <li>Comfortable fit for extended listening sessions</li>
        <li>Solid battery life with quick charging capability</li>
      </ul>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Considerations</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li>Companion app required to access all features</li>
        <li>Call quality in noisy environments could be improved</li>
        <li>Premium price compared to some competitors</li>
      </ul>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Alternatives to Consider</h3>
      <p>If you're looking at alternatives, the Sony WH-1000XM series, Bose QuietComfort lineup, or Sennheiser Momentum models offer comparable audio quality and features with different strengths in noise cancellation, comfort, and sound signature.</p>
    `,

    default: `
      <p>This product offers a good balance of features, performance, and value based on our analysis of customer reviews and specifications. It competes well in its category with several standout features.</p>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Key Strengths</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li>Reliable performance for its intended use case</li>
        <li>Good build quality with attention to detail</li>
        <li>Intuitive user experience with minimal learning curve</li>
        <li>Competitive pricing compared to similar products</li>
      </ul>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Considerations</h3>
      <ul class="list-disc pl-5 space-y-1">
        <li>Some advanced features may require additional setup</li>
        <li>Customer support experience varies according to reviews</li>
        <li>May lack some premium features found in higher-end alternatives</li>
      </ul>
      
      <h3 class="text-lg font-medium mt-4 mb-2">Alternatives to Consider</h3>
      <p>Several competing products offer similar functionality with different strengths and weaknesses. Consider exploring alternatives that might better match your specific requirements and preferences.</p>
    `,
  }

  return summaries[productType] || summaries.default
}
