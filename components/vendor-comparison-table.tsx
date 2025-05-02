"use client"

import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ShoppingBag, AlertTriangle } from "lucide-react"
import { STORE_LOGOS, STORES } from "@/lib/constants"
import { DataSourceIndicator } from "@/components/data-source-indicator"

interface VendorComparisonTableProps {
  product: any
  cheapestStore?: string | null
  usedMockData?: boolean
  dataSource?: string
}

export function VendorComparisonTable({
  product,
  cheapestStore,
  usedMockData = true,
  dataSource = "mock",
}: VendorComparisonTableProps) {
  if (!product || !product.stores || Object.keys(product.stores).length === 0) {
    return <div className="text-center py-4">No vendor data available for this product.</div>
  }

  // Get all stores
  const stores = Object.keys(product.stores).filter((store) => product.stores[store] !== null)

  // Extract all possible specification keys from all stores
  const allSpecKeys = new Set<string>()
  stores.forEach((store) => {
    if (product.stores[store]?.specs) {
      const specs = product.stores[store].specs.split(" | ")
      specs.forEach((spec: string) => {
        const key = spec.includes(":") ? spec.split(":")[0].trim() : spec.trim()
        allSpecKeys.add(key)
      })
    }
  })

  // Get spec value for a specific store and key
  const getSpecValue = (store: string, key: string): string => {
    if (!product.stores[store]?.specs) return "-"

    const specs = product.stores[store].specs.split(" | ")
    const spec = specs.find((s: string) => s.startsWith(key) || s === key)

    if (!spec) return "-"
    return spec.includes(":") ? spec.split(":")[1].trim() : "Yes"
  }

  // Format price in INR
  const formatPrice = (price: number): string => {
    if (!price) return "-"

    // Format as Indian currency (₹)
    return `₹${price.toLocaleString("en-IN")}`
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end mb-2">
        <DataSourceIndicator
          dataSource={dataSource || product.dataSource || "unknown"}
          usedMockData={usedMockData || product.usedMockData || false}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Specification</TableHead>
            {stores.map((store) => (
              <TableHead key={store} className="text-center">
                <div className="flex flex-col items-center">
                  <Image
                    src={STORE_LOGOS[store as keyof typeof STORE_LOGOS] || "/placeholder.svg"}
                    alt={`${STORES[store as keyof typeof STORES]} logo`}
                    width={80}
                    height={24}
                    className="h-6 w-auto object-contain mb-1"
                  />
                  <span className="text-xs">{STORES[store as keyof typeof STORES]}</span>
                  {cheapestStore === store && (
                    <Badge className="mt-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Best Price
                    </Badge>
                  )}
                  {product.stores[store].isRealData === false && (
                    <div className="flex items-center mt-1 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <span>Estimated</span>
                    </div>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Product Name */}
          <TableRow>
            <TableCell className="font-medium">Product Name</TableCell>
            {stores.map((store) => (
              <TableCell key={store} className="text-center">
                {product.stores[store]?.title || "-"}
              </TableCell>
            ))}
          </TableRow>

          {/* Price */}
          <TableRow>
            <TableCell className="font-medium">Price</TableCell>
            {stores.map((store) => (
              <TableCell
                key={store}
                className={`text-center font-bold ${cheapestStore === store ? "text-green-600" : ""}`}
              >
                {product.stores[store]?.price ? formatPrice(product.stores[store].price) : "-"}
              </TableCell>
            ))}
          </TableRow>

          {/* Rating */}
          <TableRow>
            <TableCell className="font-medium">Rating</TableCell>
            {stores.map((store) => (
              <TableCell key={store} className="text-center">
                {product.stores[store]?.rating ? (
                  <div className="flex items-center justify-center">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(product.stores[store].rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-muted text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-1 text-xs">{product.stores[store].rating}</span>
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>
            ))}
          </TableRow>

          {/* Reviews */}
          <TableRow>
            <TableCell className="font-medium">Reviews</TableCell>
            {stores.map((store) => (
              <TableCell key={store} className="text-center">
                {product.stores[store]?.reviewCount ? product.stores[store].reviewCount.toLocaleString("en-IN") : "-"}
              </TableCell>
            ))}
          </TableRow>

          {/* Specifications */}
          {Array.from(allSpecKeys).map((key) => (
            <TableRow key={key}>
              <TableCell className="font-medium">{key}</TableCell>
              {stores.map((store) => (
                <TableCell key={store} className="text-center">
                  {getSpecValue(store, key)}
                </TableCell>
              ))}
            </TableRow>
          ))}

          {/* Buy Button */}
          <TableRow>
            <TableCell className="font-medium">Buy Now</TableCell>
            {stores.map((store) => (
              <TableCell key={store} className="text-center">
                {product.stores[store]?.link ? (
                  <a href={product.stores[store].link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <ShoppingBag className="mr-1 h-3 w-3" />
                      Buy on {STORES[store as keyof typeof STORES]}
                    </Button>
                  </a>
                ) : (
                  "-"
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>

      {usedMockData && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Price Accuracy Notice</span>
          </div>
          <p className="mt-1">
            Some or all of the prices shown are simulated for demonstration purposes. To get real-time accurate prices,
            please add the required API keys in your environment variables.
          </p>
        </div>
      )}
    </div>
  )
}
