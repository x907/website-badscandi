import { Card, CardContent } from "@/components/ui/card";

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square bg-neutral-200 animate-pulse" />
      <CardContent className="p-4 sm:p-6">
        <div className="h-5 w-20 bg-neutral-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse mb-2" />
        <div className="h-3 w-full bg-neutral-200 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

export default function ShopLoading() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="h-9 w-3/4 bg-neutral-200 rounded animate-pulse mb-4" />
        <div className="h-6 w-2/3 bg-neutral-200 rounded animate-pulse" />
      </div>

      {/* Filter skeleton */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="h-10 w-48 bg-neutral-200 rounded-lg animate-pulse" />
        <div className="h-10 w-36 bg-neutral-200 rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-neutral-200 rounded-lg animate-pulse" />
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
