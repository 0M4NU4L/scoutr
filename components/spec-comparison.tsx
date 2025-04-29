"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X } from "lucide-react"
import Image from "next/image"
import { STORE_LOGOS, STORES } from "@/lib/constants"

interface SpecComparisonProps {
  product: any
}

export function SpecComparison({ product }: SpecComparisonProps) {
  // Extract all specs from all stores
  const extractSpecs = () => {
    const allSpecs = new Map()

    Object.keys(product.stores).forEach((store) => {
      if (!product.stores[store] || !product.stores[store].specs) return

      const specs = product.stores[store].specs.split(" | ")
      specs.forEach((spec) => {
        const [key, value] = spec.includes(":") ? spec.split(":").map((s) => s.trim()) : [spec, "Yes"]
        if (!allSpecs.has(key)) {
          allSpecs.set(key, { key })
        }
      })
    })

    // Now fill in the values for each store
    Object.keys(product.stores).forEach((store) => {
      if (!product.stores[store] || !product.stores[store].specs) return

      const specs = product.stores[store].specs.split(" | ")
      specs.forEach((spec) => {
        const [key, value] = spec.includes(":") ? spec.split(":").map((s) => s.trim()) : [spec, "Yes"]
        allSpecs.get(key)[store] = value
      })
    })

    return Array.from(allSpecs.values())
  }

  const specs = extractSpecs()

  // Get stores that have specs
  const storesWithSpecs = Object.keys(product.stores).filter(
    (store) => product.stores[store] && product.stores[store].specs,
  )

  if (storesWithSpecs.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Specification Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Specification</TableHead>
              {storesWithSpecs.map((store) => (
                <TableHead key={store} className="text-center">
                  <div className="flex flex-col items-center">
                    <Image
                      src={STORE_LOGOS[store] || "/placeholder.svg"}
                      alt={`${STORES[store]} logo`}
                      width={80}
                      height={24}
                      className="h-6 w-auto object-contain mb-1"
                    />
                    <span className="text-xs">{STORES[store]}</span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {specs.map((spec, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{spec.key}</TableCell>
                {storesWithSpecs.map((store) => (
                  <TableCell key={store} className="text-center">
                    {spec[store] ? (
                      spec[store] === "Yes" ? (
                        <Check className="h-4 w-4 mx-auto text-green-500" />
                      ) : (
                        spec[store]
                      )
                    ) : (
                      <X className="h-4 w-4 mx-auto text-muted-foreground" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
