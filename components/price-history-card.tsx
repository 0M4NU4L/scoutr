"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PriceChart } from "@/components/price-chart"
import { Button } from "@/components/ui/button"
import { Download, Calendar, TrendingDown, TrendingUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface PriceHistoryCardProps {
  priceHistory: any[]
  stores: string[]
}

export function PriceHistoryCard({ priceHistory, stores }: PriceHistoryCardProps) {
  const [timeRange, setTimeRange] = useState("all")

  if (!priceHistory || priceHistory.length === 0) {
    return null
  }

  // Filter price history based on selected time range
  const filteredHistory = (() => {
    switch (timeRange) {
      case "1m":
        return priceHistory.slice(-3) // Last 3 months
      case "3m":
        return priceHistory.slice(-6) // Last 6 months
      case "6m":
        return priceHistory.slice(-9) // Last 9 months
      default:
        return priceHistory // All data
    }
  })()

  // Calculate price trends
  const calculateTrends = () => {
    if (filteredHistory.length < 2) return {}

    const trends = {}
    const firstPoint = filteredHistory[0]
    const lastPoint = filteredHistory[filteredHistory.length - 1]

    stores.forEach((store) => {
      if (firstPoint[store] && lastPoint[store]) {
        const startPrice = firstPoint[store]
        const endPrice = lastPoint[store]
        const difference = endPrice - startPrice
        const percentChange = (difference / startPrice) * 100

        trends[store] = {
          direction: difference < 0 ? "down" : "up",
          difference: Math.abs(difference),
          percentChange: Math.abs(percentChange).toFixed(1),
        }
      }
    })

    return trends
  }

  const trends = calculateTrends()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Price History</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="1m">Last month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <PriceChart data={filteredHistory} />
        </div>

        {/* Price trends summary */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.keys(trends).map((store) => (
            <div key={store} className="flex items-center p-2 rounded-lg border">
              <div
                className={`p-2 rounded-full mr-2 ${
                  trends[store].direction === "down" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}
              >
                {trends[store].direction === "down" ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium capitalize">{store}</p>
                <p className="text-xs text-muted-foreground">
                  {trends[store].direction === "down" ? "Decreased" : "Increased"} by{" "}
                  <span className={trends[store].direction === "down" ? "text-green-600" : "text-red-600"}>
                    {trends[store].percentChange}%
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
