"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "./ui/button";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
  X,
  Loader2,
  Package,
  Eye,
  EyeOff,
  Star,
  GripVertical,
  EyeClosed,
  AlertCircle,
} from "lucide-react";

// Maximum images per product (matches server validation)
const MAX_PRODUCT_IMAGES = 10;

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  imageUrls: string[];
  stock: number;
  featured: boolean;
  hidden: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  altText: string | null;
  category: string | null;
  tags: string | null;
  materials: string | null;
  colors: string | null;
  dimensions: string | null;
  room: string | null;
  createdAt: string;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  priceCents: string;
  imageUrls: string[];
  stock: string;
  featured: boolean;
  hidden: boolean;
  metaTitle: string;
  metaDescription: string;
  altText: string;
  category: string;
  tags: string;
  materials: string;
  colors: string;
  dimensions: string;
  room: string;
}

const initialFormData: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  priceCents: "",
  imageUrls: [],
  stock: "0",
  featured: false,
  hidden: false,
  metaTitle: "",
  metaDescription: "",
  altText: "",
  category: "",
  tags: "",
  materials: "",
  colors: "",
  dimensions: "",
  room: "",
};

export function AdminProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/products");
      if (response.ok) {
        const data = await response.json();
        // Handle paginated response format
        setProducts(data.products || data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Enforce max image limit
    const remainingSlots = MAX_PRODUCT_IMAGES - formData.imageUrls.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${MAX_PRODUCT_IMAGES} images allowed`);
      e.target.value = "";
      return;
    }

    // Limit files to remaining slots
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    if (filesToUpload.length < files.length) {
      setError(`Only uploading ${filesToUpload.length} images (max ${MAX_PRODUCT_IMAGES} total)`);
    }

    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          return data.url;
        } else {
          throw new Error(data.error || "Failed to upload image");
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...uploadedUrls],
      }));
    } catch (error) {
      console.error("Upload error:", error);
      setError(error instanceof Error ? error.message : "Failed to upload images");
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be selected again
      e.target.value = "";
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = formData.imageUrls[index];

    // Remove from form immediately for responsive UI
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));

    // Delete from S3 in background (only for product images)
    if (imageUrl.includes("/products/")) {
      try {
        await fetch("/api/admin/upload/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });
      } catch (error) {
        console.error("Failed to delete image from S3:", error);
        // Don't show error to user - image is already removed from form
      }
    }
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return; // Already primary
    setFormData((prev) => {
      const newUrls = [...prev.imageUrls];
      const [movedUrl] = newUrls.splice(index, 1);
      newUrls.unshift(movedUrl);
      return { ...prev, imageUrls: newUrls };
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setFormData((prev) => {
      const newUrls = [...prev.imageUrls];
      const [movedUrl] = newUrls.splice(fromIndex, 1);
      newUrls.splice(toIndex, 0, movedUrl);
      return { ...prev, imageUrls: newUrls };
    });
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      priceCents: (product.priceCents / 100).toFixed(2),
      imageUrls: product.imageUrls.length > 0 ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []),
      stock: product.stock.toString(),
      featured: product.featured,
      hidden: product.hidden,
      metaTitle: product.metaTitle || "",
      metaDescription: product.metaDescription || "",
      altText: product.altText || "",
      category: product.category || "",
      tags: product.tags || "",
      materials: product.materials || "",
      colors: product.colors || "",
      dimensions: product.dimensions || "",
      room: product.room || "",
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Convert price to cents
      const priceCents = Math.round(parseFloat(formData.priceCents) * 100);

      const payload = {
        ...formData,
        priceCents,
        stock: parseInt(formData.stock) || 0,
        imageUrl: formData.imageUrls[0] || "", // Primary image for backwards compatibility
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";

      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        fetchProducts();
      } else {
        setError(data.error || "Failed to save product");
      }
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete product");
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !product.featured }),
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error("Toggle featured error:", error);
    }
  };

  const toggleHidden = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !product.hidden }),
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error("Toggle hidden error:", error);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Management</h1>
          <p className="text-neutral-600">
            Add, edit, and manage your products
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
          />
        </div>
        <div className="flex gap-4 text-sm text-neutral-600">
          <span>{products.length} products</span>
          <span>{products.filter((p) => p.featured).length} featured</span>
          <span>{products.filter((p) => p.hidden).length} hidden</span>
          <span>
            {products.filter((p) => p.stock <= 5).length} low stock
          </span>
        </div>
      </div>

      {/* Products Grid/Table */}
      {isLoading ? (
        <div className="text-center py-12 text-neutral-600">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <p className="text-neutral-600">
            {search ? "No products match your search" : "No products yet"}
          </p>
          {!search && (
            <Button onClick={openCreateModal} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Product
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">
                    Category
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-neutral-600">
                    Price
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-neutral-600">
                    Stock
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">
                    Images
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">
                    Featured
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">
                    Visible
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-neutral-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-neutral-50 ${product.hidden ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.altText || product.name}
                            className="h-12 w-12 object-cover rounded border border-neutral-200"
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-neutral-500">
                            /{product.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {product.category || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(product.priceCents)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-sm ${
                          product.stock <= 0
                            ? "bg-red-100 text-red-800"
                            : product.stock <= 5
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-neutral-600">
                        {product.imageUrls?.length || 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleFeatured(product)}
                        className={`p-1 rounded transition-colors ${
                          product.featured
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-neutral-400 hover:bg-neutral-100"
                        }`}
                        title={product.featured ? "Remove from featured" : "Add to featured"}
                      >
                        <Star className={`h-5 w-5 ${product.featured ? "fill-amber-600" : ""}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleHidden(product)}
                        className={`p-1 rounded transition-colors ${
                          product.hidden
                            ? "text-red-500 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                        title={product.hidden ? "Hidden from shop (click to show)" : "Visible in shop (click to hide)"}
                      >
                        {product.hidden ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          title="Edit product"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">Basic Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, slug: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Price (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceCents}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, priceCents: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, stock: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, category: e.target.value }))
                      }
                      placeholder="e.g., Rugs, Wall Art"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, featured: e.target.checked }))
                    }
                    className="h-4 w-4 text-amber-900 border-neutral-300 rounded focus:ring-amber-900"
                  />
                  <label htmlFor="featured" className="text-sm text-neutral-700">
                    Featured product (shown on homepage)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hidden"
                    checked={formData.hidden}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hidden: e.target.checked }))
                    }
                    className="h-4 w-4 text-amber-900 border-neutral-300 rounded focus:ring-amber-900"
                  />
                  <label htmlFor="hidden" className="text-sm text-neutral-700">
                    Hidden product (not visible in shop or homepage)
                  </label>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">Product Images</h3>
                <p className="text-sm text-neutral-500">
                  Upload multiple images. The first image will be the primary/hero image.
                  Click the star to set a different image as primary.
                </p>

                {/* Image Grid */}
                {formData.imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {formData.imageUrls.map((url, index) => (
                      <div
                        key={url}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                          index === 0
                            ? "border-amber-500 ring-2 ring-amber-500/20"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        {/* Grip handle for drag indication */}
                        <div className="absolute top-1 right-1 z-10 p-1 bg-white/80 rounded opacity-50 group-hover:opacity-100 transition-opacity cursor-grab">
                          <GripVertical className="h-3 w-3 text-neutral-500" />
                        </div>

                        {/* Image position number */}
                        <div className="absolute top-1 left-1 z-10 w-5 h-5 bg-black/60 text-white text-xs font-medium rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>

                        <img
                          src={url}
                          alt={`Product image ${index + 1}`}
                          className="aspect-square object-cover"
                        />

                        {/* Primary badge */}
                        {index === 0 && (
                          <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded">
                            Primary
                          </div>
                        )}

                        {/* Hover controls */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index)}
                              className="p-2 bg-white rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Set as primary image"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-2 bg-white rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Reorder buttons */}
                        <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index - 1)}
                              className="p-1.5 bg-white rounded shadow-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 text-xs font-medium"
                              title="Move left"
                            >
                              &larr;
                            </button>
                          )}
                          {index < formData.imageUrls.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index + 1)}
                              className="p-1.5 bg-white rounded shadow-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 text-xs font-medium"
                              title="Move right"
                            >
                              &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <div className="flex items-center gap-3 flex-wrap">
                  <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                    formData.imageUrls.length >= MAX_PRODUCT_IMAGES
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : "bg-neutral-100 hover:bg-neutral-200"
                  }`}>
                    <Upload className="h-4 w-4" />
                    {isUploading ? "Uploading..." : "Upload Images"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading || formData.imageUrls.length >= MAX_PRODUCT_IMAGES}
                    />
                  </label>
                  <span className={`text-sm ${
                    formData.imageUrls.length >= MAX_PRODUCT_IMAGES
                      ? "text-amber-600 font-medium"
                      : "text-neutral-500"
                  }`}>
                    {formData.imageUrls.length} / {MAX_PRODUCT_IMAGES} images
                  </span>
                  {formData.imageUrls.length >= MAX_PRODUCT_IMAGES && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Maximum reached
                    </span>
                  )}
                </div>

                {formData.imageUrls.length === 0 && !isUploading && (
                  <p className="text-sm text-red-600">
                    At least one image is required
                  </p>
                )}

                {isUploading && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading images...
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Alt Text (for all images)
                  </label>
                  <input
                    type="text"
                    value={formData.altText}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, altText: e.target.value }))
                    }
                    placeholder="Describe the image for accessibility"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">Product Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Materials
                    </label>
                    <input
                      type="text"
                      value={formData.materials}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, materials: e.target.value }))
                      }
                      placeholder="e.g., 100% wool"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Colors
                    </label>
                    <input
                      type="text"
                      value={formData.colors}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, colors: e.target.value }))
                      }
                      placeholder="e.g., Natural, Cream"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Dimensions
                    </label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, dimensions: e.target.value }))
                      }
                      placeholder='e.g., 24" x 36"'
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Room
                    </label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, room: e.target.value }))
                      }
                      placeholder="e.g., Living Room, Bedroom"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    placeholder="Comma-separated tags"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                  />
                </div>
              </div>

              {/* SEO */}
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">SEO</h3>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))
                    }
                    placeholder="Custom title for search engines"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))
                    }
                    rows={2}
                    placeholder="Custom description for search engines"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || formData.imageUrls.length === 0}
                  className="flex-1 gap-2"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingProduct ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
