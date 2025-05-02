"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataSourceIndicator } from "@/components/data-source-indicator"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { STORES } from "@/lib/constants"

interface PriceChartProps {
  priceHistory: any[]
  usedMockData: boolean
  dataSource: string
}

export function PriceChart({ priceHistory, usedMockData, dataSource }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState("12m")
  const [chartData, setChartData] = useState(priceHistory || [])

  // Colors for each store
  const storeColors = {
    amazon: "#FF9900",
    flipkart: "#2874F0",
    croma: "#212121",
    alibaba: "#FF6A00",
  }

  useEffect(() => {
    if (!priceHistory) return

    // Filter data based on selected time range
    let filteredData = [...priceHistory]

    if (timeRange === "3m") {
      filteredData = priceHistory.slice(-3)
    } else if (timeRange === "6m") {
      filteredData = priceHistory.slice(-6)
    }

    setChartData(filteredData)
  }, [timeRange, priceHistory])

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>No price history data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Get all stores that have data
  const availableStores = Object.keys(priceHistory[0]).filter((key) => key !== "date")

  // Calculate price trends
  const calculateTrend = (store: string) => {
    if (chartData.length < 2) return { trend: "stable", percentage: 0 }

    const firstPrice = chartData[0][store]
    const lastPrice = chartData[chartData.length - 1][store]

    if (!firstPrice || !lastPrice) return { trend: "stable", percentage: 0 }

    const difference = lastPrice - firstPrice
    const percentage = Math.round((difference / firstPrice) * 100)

    let trend = "stable"
    if (percentage < -5) trend = "decreasing"
    if (percentage > 5) trend = "increasing"

    return { trend, percentage: Math.abs(percentage) }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Price History</CardTitle>
          <CardDescription>Compare prices over time</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceIndicator dataSource={dataSource} usedMockData={usedMockData} />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="12m">12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="trends">Price Trends</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  {availableStores.map((store) => (
                    <Line
                      key={store}
                      type="monotone"
                      dataKey={store}
                      name={STORES[store as keyof typeof STORES] || store}
                      stroke={storeColors[store as keyof typeof storeColors] || "#8884d8"}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="trends">
            <div className="space-y-4">
              {availableStores.map((store) => {
                const { trend, percentage } = calculateTrend(store)
                const storeName = STORES[store as keyof typeof STORES] || store

                return (
                  <div key={store} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: storeColors[store as keyof typeof storeColors] || "#8884d8" }}
                      />
                      <span className="font-medium">{storeName}</span>
                    </div>
                    <div
                      className={`
                      ${trend === "decreasing" ? "text-green-600" : ""}
                      ${trend === "increasing" ? "text-red-600" : ""}
                      ${trend === "stable" ? "text-gray-600" : ""}
                    `}
                    >
                      {trend === "decreasing" && "↓"}
                      {trend === "increasing" && "↑"}
                      {trend === "stable" && "→"} {percentage}% {trend}
                    </div>
                  </div>
                )
              })}

              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  Price trends are calculated based on the selected time period.
                  {usedMockData && " Note that these trends are simulated for demonstration purposes."}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
