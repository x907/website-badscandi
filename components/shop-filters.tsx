"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/product-card";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
}

type SortOption = "newest" | "price-low" | "price-high" | "name";
type AvailabilityFilter = "all" | "in-stock" | "sold";

interface ShopFiltersProps {
  products: Product[];
}

export function ShopFilters({ products }: ShopFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }

    // Availability filter
    if (availability === "in-stock") {
      result = result.filter((product) => product.stock > 0);
    } else if (availability === "sold") {
      result = result.filter((product) => product.stock === 0);
    }

    // Sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.priceCents - b.priceCents);
        break;
      case "price-high":
        result.sort((a, b) => b.priceCents - a.priceCents);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        // Keep original order (assumed to be newest first from DB)
        break;
    }

    return result;
  }, [products, searchQuery, sortBy, availability]);

  const hasActiveFilters =
    searchQuery.trim() !== "" || availability !== "all" || sortBy !== "newest";

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
    setAvailability("all");
  };

  const inStockCount = products.filter((p) => p.stock > 0).length;
  const soldCount = products.filter((p) => p.stock === 0).length;

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle (Mobile) */}
        <Button
          variant="outline"
          className="sm:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 h-2 w-2 rounded-full bg-amber-500" />
          )}
        </Button>

        {/* Desktop Filters */}
        <div className="hidden sm:flex gap-3">
          <Select
            value={availability}
            onValueChange={(value) => setAvailability(value as AvailabilityFilter)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({products.length})</SelectItem>
              <SelectItem value="in-stock">In Stock ({inStockCount})</SelectItem>
              <SelectItem value="sold">Sold ({soldCount})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Filters (Collapsible) */}
      {showFilters && (
        <div className="sm:hidden flex flex-col gap-3 mb-6 p-4 bg-neutral-50 rounded-lg">
          <Select
            value={availability}
            onValueChange={(value) => setAvailability(value as AvailabilityFilter)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({products.length})</SelectItem>
              <SelectItem value="in-stock">In Stock ({inStockCount})</SelectItem>
              <SelectItem value="sold">Sold ({soldCount})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-6 text-sm text-neutral-600">
          <span>
            Showing {filteredAndSortedProducts.length} of {products.length} products
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto py-1 px-2">
            Clear all
          </Button>
        </div>
      )}

      {/* Product Grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-600 mb-4">No products match your search.</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}
    </div>
  );
}
