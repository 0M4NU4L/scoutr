"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface PriceHistoryData {
  date: string
  [key: string]: any
}

interface PriceChartProps {
  data: PriceHistoryData[]
}

const COLORS = {
  amazon: "#FF9900",
  flipkart: "#2874F0",
  croma: "#212121",
  alibaba: "#FF6A00",
}

export function PriceChart({ data }: PriceChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full">No price history available</div>
  }

  // Get all store keys except 'date'
  const stores = Object.keys(data[0]).filter((key) => key !== "date")

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
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
        <Tooltip formatter={(value) => [`₹${value}`, ""]} labelFormatter={(label) => `Date: ${label}`} />
        <Legend />
        {stores.map((store, index) => (
          <Line
            key={store}
            type="monotone"
            dataKey={store}
            stroke={COLORS[store] || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
            activeDot={{ r: 8 }}
            name={store.charAt(0).toUpperCase() + store.slice(1)}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
