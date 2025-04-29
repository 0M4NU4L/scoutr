"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Star, ThumbsUp, MessageSquare } from "lucide-react"
import { STORE_LOGOS, STORES } from "@/lib/constants"

interface ReviewComparisonProps {
  product: any
}

export function ReviewComparison({ product }: ReviewComparisonProps) {
  const [activeStore, setActiveStore] = useState(Object.keys(product.stores)[0])

  // Generate mock review data for demonstration
  const generateReviewData = (store: string) => {
    const storeData = product.stores[store]
    if (!storeData) return null

    // Ensure rating is a number
    const rating =
      typeof storeData.rating === "number"
        ? storeData.rating
        : typeof storeData.rating === "string"
          ? Number.parseFloat(storeData.rating)
          : Math.floor(Math.random() * 2) + 3

    const reviewCount = storeData.reviewCount || Math.floor(Math.random() * 500) + 50

    // Generate rating distribution
    const ratingDistribution = {
      5: Math.floor(Math.random() * 40) + 30, // 30-70%
      4: Math.floor(Math.random() * 30) + 15, // 15-45%
      3: Math.floor(Math.random() * 15) + 5, // 5-20%
      2: Math.floor(Math.random() * 10) + 1, // 1-11%
      1: Math.floor(Math.random() * 5) + 1, // 1-6%
    }

    // Normalize to 100%
    const total = Object.values(ratingDistribution).reduce((sum, val) => sum + val, 0)
    Object.keys(ratingDistribution).forEach((key) => {
      ratingDistribution[key] = Math.round((ratingDistribution[key] / total) * 100)
    })

    // Generate sample reviews
    const reviews = [
      {
        author: "John D.",
        rating: 5,
        title: "Excellent product, highly recommended!",
        content:
          "I've been using this for a month now and I'm very impressed with the quality and performance. It exceeds my expectations in every way.",
        date: "2 weeks ago",
        helpful: Math.floor(Math.random() * 50) + 5,
      },
      {
        author: "Sarah M.",
        rating: 4,
        title: "Great value for money",
        content:
          "This product offers excellent features for the price point. There are a few minor issues but overall I'm satisfied with my purchase.",
        date: "1 month ago",
        helpful: Math.floor(Math.random() * 30) + 3,
      },
      {
        author: "Raj P.",
        rating: 3,
        title: "Decent but has some flaws",
        content:
          "The product works as advertised but there are some design issues that could be improved. Customer service was helpful when I had questions.",
        date: "3 weeks ago",
        helpful: Math.floor(Math.random() * 20) + 2,
      },
    ]

    return {
      rating,
      reviewCount,
      ratingDistribution,
      reviews,
    }
  }

  const storeReviews = {}
  Object.keys(product.stores).forEach((store) => {
    if (product.stores[store]) {
      storeReviews[store] = generateReviewData(store)
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeStore} onValueChange={setActiveStore} className="w-full">
          <TabsList className="mb-6">
            {Object.keys(product.stores).map((store) => {
              if (!product.stores[store]) return null
              return (
                <TabsTrigger key={store} value={store} className="flex items-center">
                  <Image
                    src={STORE_LOGOS[store] || "/placeholder.svg"}
                    alt={`${STORES[store]} logo`}
                    width={80}
                    height={24}
                    className="h-5 w-auto object-contain mr-2"
                  />
                  <span>{STORES[store]}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {Object.keys(storeReviews).map((store) => {
            const reviewData = storeReviews[store]
            if (!reviewData) return null

            // Ensure rating is a number and format it safely
            const formattedRating = typeof reviewData.rating === "number" ? reviewData.rating.toFixed(1) : "0.0"

            return (
              <TabsContent key={store} value={store} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Overall rating */}
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                    <div className="text-4xl font-bold mb-2">{formattedRating}</div>
                    <div className="flex items-center mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(reviewData.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-muted text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">Based on {reviewData.reviewCount} reviews</div>
                  </div>

                  {/* Rating distribution */}
                  <div className="md:col-span-2 p-4 border rounded-lg">
                    <h3 className="text-sm font-medium mb-4">Rating Distribution</h3>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center">
                          <div className="flex items-center w-12">
                            <span className="text-sm mr-1">{rating}</span>
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          </div>
                          <div className="flex-1 mx-2">
                            <Progress value={reviewData.ratingDistribution[rating]} className="h-2" />
                          </div>
                          <div className="w-12 text-right text-sm">{reviewData.ratingDistribution[rating]}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review list */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Top Reviews</h3>
                  <div className="space-y-4">
                    {reviewData.reviews.map((review, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="font-medium">{review.author}</div>
                            <div className="text-sm text-muted-foreground ml-2">{review.date}</div>
                          </div>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-muted text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <h4 className="font-medium mb-1">{review.title}</h4>
                        <p className="text-sm mb-3">{review.content}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          <span>{review.helpful} people found this helpful</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Showing top reviews from {STORES[store]}. Visit their website to see all {reviewData.reviewCount}{" "}
                  reviews.
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
