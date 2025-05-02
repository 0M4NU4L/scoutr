"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { SlidersHorizontal, X } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"

interface SearchFiltersProps {
  onFilterChange: (filters: any) => void
  minPrice?: number
  maxPrice?: number
}

export function SearchFilters({ onFilterChange, minPrice = 0, maxPrice = 100000 }: SearchFiltersProps) {
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice])
  const [ratings, setRatings] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value)
  }

  const handleRatingChange = (value: string) => {
    setRatings(ratings.includes(value) ? ratings.filter((r) => r !== value) : [...ratings, value])
  }

  const handleBrandChange = (value: string) => {
    setBrands(brands.includes(value) ? brands.filter((b) => b !== value) : [...brands, value])
  }

  const applyFilters = () => {
    onFilterChange({
      priceRange,
      ratings,
      brands,
    })
  }

  const resetFilters = () => {
    setPriceRange([minPrice, maxPrice])
    setRatings([])
    setBrands([])
    onFilterChange({
      priceRange: [minPrice, maxPrice],
      ratings: [],
      brands: [],
    })
  }

  // Sample brands - in a real app, these would come from the API
  const availableBrands = ["Samsung", "Apple", "Sony", "LG", "Bose", "Dell", "HP", "Lenovo"]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Filter Products</SheetTitle>
          <SheetDescription>Narrow down your search results with these filters.</SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-6">
          <Accordion type="single" collapsible defaultValue="price" className="w-full">
            <AccordionItem value="price">
              <AccordionTrigger>Price Range</AccordionTrigger>
              <AccordionContent>
                <div className="pt-4 px-2">
                  <Slider
                    defaultValue={priceRange}
                    max={maxPrice}
                    step={1000}
                    value={priceRange}
                    onValueChange={handlePriceChange}
                    className="mb-6"
                  />
                  <div className="flex justify-between">
                    <span>₹{priceRange[0].toLocaleString()}</span>
                    <span>₹{priceRange[1].toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number.parseInt(e.target.value), priceRange[1]])}
                      className="w-1/2"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                      className="w-1/2"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rating">
              <AccordionTrigger>Rating</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {["4", "3", "2", "1"].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={ratings.includes(rating)}
                        onCheckedChange={() => handleRatingChange(rating)}
                      />
                      <Label htmlFor={`rating-${rating}`} className="flex items-center">
                        {rating}+ Stars
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="brand">
              <AccordionTrigger>Brand</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {availableBrands.map((brand) => (
                    <div key={brand} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand}`}
                        checked={brands.includes(brand)}
                        onCheckedChange={() => handleBrandChange(brand)}
                      />
                      <Label htmlFor={`brand-${brand}`}>{brand}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={resetFilters} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <SheetClose asChild>
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
