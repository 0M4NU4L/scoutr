import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const body = await request.json()
    const { query, task } = body

    if (!query) {
      return NextResponse.json({ message: "Query parameter is required", success: false }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { message: "Gemini API key is missing. Please add it to your environment variables.", success: false },
        { status: 500 },
      )
    }

    // Determine which prompt to use based on the task
    let prompt = ""
    if (task === "summary") {
      prompt = `Generate a comprehensive product summary for "${query}". 
      Include key strengths, considerations, and alternatives to consider. 
      Format the response in HTML with appropriate headings and lists. 
      Focus on factual information and avoid making up specific details.
      Keep the summary concise but informative.`
    } else if (task === "factCheck") {
      prompt = `Fact check the following product: "${query}". 
      Provide accurate information about its specifications, features, and common user experiences.
      Format the response in a structured way with bullet points for key facts.
      If there are any common misconceptions about this product, please clarify them.`
    } else if (task === "enhance") {
      prompt = `Enhance the product information for "${query}" with additional details.
      Include technical specifications, key features, and any notable aspects of this product.
      Format the response as structured data that can be easily parsed.`
    } else {
      return NextResponse.json({ message: "Invalid task specified", success: false }, { status: 400 })
    }

    console.log(`Calling Gemini API for task: ${task} with query: ${query}`)

    try {
      // Call Gemini API with the updated endpoint and format
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
          // Add a timeout to prevent hanging requests
          signal: AbortSignal.timeout(15000), // 15 second timeout
        },
      )

      console.log(`Gemini API response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Gemini API error:", errorText)
        return NextResponse.json(
          {
            message: `Gemini API error: ${response.status} ${response.statusText}`,
            error: errorText,
            success: false,
          },
          { status: 502 }, // Bad Gateway - indicates an error from the upstream service
        )
      }

      const data = await response.json()

      // Extract the generated text from the response
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

      if (!generatedText) {
        console.warn("Gemini API returned empty response")
        return NextResponse.json({
          message: "Gemini API returned empty response",
          result: "",
          task,
          success: false,
        })
      }

      console.log(`Successfully generated ${task} with Gemini API`)

      return NextResponse.json({
        result: generatedText,
        task,
        success: true,
      })
    } catch (apiError) {
      console.error("Gemini API call error:", apiError.name, apiError.message)

      // Check if it's a timeout error
      if (apiError.name === "AbortError" || apiError.name === "TimeoutError") {
        return NextResponse.json(
          { message: "Gemini API request timed out", success: false },
          { status: 504 }, // Gateway Timeout
        )
      }

      return NextResponse.json({ message: `Gemini API error: ${apiError.message}`, success: false }, { status: 500 })
    }
  } catch (error) {
    console.error("API route error:", error)
    // Return a more graceful error response
    return NextResponse.json(
      {
        message: error.message || "An error occurred",
        success: false,
        result: null,
      },
      { status: 500 },
    )
  }
}
