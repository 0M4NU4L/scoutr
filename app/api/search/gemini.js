export async function enhanceResultsWithGemini(results, query) {
  if (!process.env.GEMINI_API_KEY) {
    console.log("Gemini API key is missing. Skipping enhancement.")
    return results
  }

  try {
    console.log("Enhancing results with Gemini API for query:", query)

    // Prepare the API request
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Enhance the following product information for "${query}" with accurate specifications and details.
                Current product information: ${JSON.stringify(results)}
                
                For each store's product, provide:
                1. A more detailed and accurate product title
                2. Key specifications in the format "Key: Value | Key: Value"
                3. An estimated rating based on typical reviews for this type of product
                
                Return the response as JSON in the exact same format as the input, but with enhanced information.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error:", errorText)
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Extract the generated text from the response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    // Try to extract JSON from the response
    try {
      // Find JSON in the response (it might be wrapped in markdown code blocks)
      const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) ||
        generatedText.match(/```\s*([\s\S]*?)\s*```/) || [null, generatedText]

      const jsonStr = jsonMatch[1]
      const enhancedResults = JSON.parse(jsonStr)

      // Merge the enhanced results with the original results
      for (const store in enhancedResults) {
        if (results[store] && enhancedResults[store]) {
          results[store] = {
            ...results[store],
            ...enhancedResults[store],
            specs: enhancedResults[store].specs || results[store].specs,
            title: enhancedResults[store].title || results[store].title,
          }
        }
      }

      console.log("Successfully enhanced results with Gemini")
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError)
      console.log("Raw response:", generatedText)
    }

    return results
  } catch (error) {
    console.error("Error enhancing results with Gemini:", error)
    return results
  }
}
