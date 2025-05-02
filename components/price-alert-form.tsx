"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Bell } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

interface PriceAlertFormProps {
  productId: string
  productTitle: string
  currentPrice: number
}

export function PriceAlertForm({ productId, productTitle, currentPrice }: PriceAlertFormProps) {
  const [open, setOpen] = useState(false)
  const [targetPrice, setTargetPrice] = useState(Math.floor(currentPrice * 0.9).toString())
  const [email, setEmail] = useState("")
  const [notifyOnAnyDrop, setNotifyOnAnyDrop] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    // In a real app, this would save the alert to a database
    // For now, we'll just show a success message
    alert(`Price alert set for ${productTitle} at ₹${targetPrice}`)
    setOpen(false)
  }

  const suggestedPrices = [
    Math.floor(currentPrice * 0.95),
    Math.floor(currentPrice * 0.9),
    Math.floor(currentPrice * 0.85),
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          Price Alert
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Price Alert</DialogTitle>
          <DialogDescription>We'll notify you when the price drops below your target price.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Product</Label>
              <Input id="product" value={productTitle} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="current-price">Current Price</Label>
              <Input id="current-price" value={`₹${currentPrice.toLocaleString()}`} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target-price">Target Price (₹)</Label>
              <Input
                id="target-price"
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Enter your target price"
              />
              <div className="flex gap-2 mt-1">
                {suggestedPrices.map((price) => (
                  <Button
                    key={price}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTargetPrice(price.toString())}
                  >
                    ₹{price.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email for notifications</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="any-drop" checked={notifyOnAnyDrop} onCheckedChange={setNotifyOnAnyDrop} />
              <Label htmlFor="any-drop">Also notify me on any price drop</Label>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Alert will be active for 30 days</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Set Alert</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
