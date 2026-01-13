"use client";

import { Check, Clock, Package, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AddProductResponse,
  API_ENDPOINTS,
  fileToBase64,
  type ProductsResponse,
  type ProductWithoutEmbedding,
} from "@/lib/visual-search-config";

type VendorUploadProps = {
  onProductAdded?: () => void;
};

export function VendorUpload({ onProductAdded }: VendorUploadProps) {
  const [productName, setProductName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<ProductWithoutEmbedding[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    const response = await fetch(API_ENDPOINTS.products).catch(() => null);
    if (response?.ok) {
      const data: ProductsResponse = await response.json();
      setAllProducts(data.products);
    }
    setIsLoadingProducts(false);
  }, []);

  useEffect(() => {
    fetchProducts();
}, [fetchProducts]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (deletingId) return; // Prevent multiple deletes at once
    
    setDeletingId(productId);
    setError(null);

    const response = await fetch(API_ENDPOINTS.deleteProduct(productId), {
      method: "DELETE",
    }).catch(() => null);

    if (!response) {
      setError("Network error while deleting product");
      setDeletingId(null);
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      setError(errorData.message || "Failed to delete product");
      setDeletingId(null);
      return;
    }

    // Remove from local state
    setAllProducts((prev) => prev.filter((p) => p.id !== productId));
    setDeletingId(null);
    onProductAdded?.(); // Notify parent to refresh health/product count
  }, [deletingId, onProductAdded]);

  const handleFileSelect = useCallback((file: File) => {
    if (file?.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    } else {
      setError("Please select a valid image file");
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(productName.trim() && selectedFile)) {
      setError("Please provide both a product name and image");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const imageBase64 = await fileToBase64(selectedFile);

    const response = await fetch(API_ENDPOINTS.products, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: productName, imageBase64 }),
    }).catch(() => null);

    if (!response) {
      setError("Network error");
      setIsLoading(false);
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      setError(errorData.message || "Failed to add product");
      setIsLoading(false);
      return;
    }

    const data: AddProductResponse = await response.json();
    setSuccess(`Added "${data.product.name}" successfully!`);
    setProductName("");
    setSelectedFile(null);
    setPreview(null);
    await fetchProducts();
    onProductAdded?.(); // Notify parent to refresh health/product count
    setIsLoading(false);

    setTimeout(() => setSuccess(null), 3000);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg shadow-orange-500/25">
          <Upload className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white text-xl">Vendor Upload</h2>
          <p className="text-gray-400 text-sm">Add products to the catalog</p>
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label
            className="font-medium text-gray-300 text-sm"
            htmlFor="productName"
          >
            Product Name
          </label>
          <input
            className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 shadow-sm transition-all focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
            id="productName"
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g., Classic Denim Jacket"
            type="text"
            value={productName}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            className="font-medium text-gray-300 text-sm"
            htmlFor="productImage"
          >
            Product Image
          </label>
          <button
            aria-label="Upload product image"
            className={(() => {
              const baseClasses =
                "relative w-full cursor-pointer rounded-2xl border-2 border-dashed bg-transparent p-6 text-center transition-all";
              if (isDragging) {
                return `${baseClasses} border-orange-400 bg-orange-900/20`;
              }
              if (preview) {
                return `${baseClasses} border-gray-700 bg-gray-800/50`;
              }
              return `${baseClasses} border-gray-700 bg-gray-800/50 hover:border-orange-500/50 hover:bg-orange-900/10`;
            })()}
            onClick={() => fileInputRef.current?.click()}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            type="button"
          >
            <input
              accept="image/*"
              aria-hidden="true"
              className="hidden"
              id="productImage"
              onChange={handleFileChange}
              ref={fileInputRef}
              tabIndex={-1}
              type="file"
            />
            {preview ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  alt="Preview"
                  className="h-32 w-32 rounded-xl object-cover shadow-md"
                  height={128}
                  src={preview}
                  width={128}
                />
                <span className="text-gray-400 text-sm">
                  Click or drag to replace
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="rounded-full bg-orange-900/30 p-4">
                  <Upload className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-300">
                    Drop your image here
                  </p>
                  <p className="text-gray-500 text-sm">or click to browse</p>
                </div>
              </div>
            )}
          </button>
        </div>

        {error !== null && (
          <div className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success !== null && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-emerald-400 text-sm">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        <button
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-400 hover:to-rose-400 hover:shadow-orange-500/30 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          disabled={isLoading || !productName.trim() || !selectedFile}
          type="submit"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span>Add Product</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900/30">
              <Package className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Product Catalog</h3>
              <p className="text-gray-400 text-sm">
                {allProducts.length} product
                {allProducts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300 disabled:opacity-50"
            disabled={isLoadingProducts}
            onClick={fetchProducts}
            title="Refresh products"
            type="button"
          >
            <RefreshCw
              className={`h-5 w-5 ${isLoadingProducts ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {(() => {
          if (isLoadingProducts) {
            return (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            );
          }

          if (allProducts.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-700 border-dashed bg-gray-800/30 px-6 py-12">
                <Package className="mb-3 h-12 w-12 text-gray-600" />
                <p className="font-medium text-gray-400">No products yet</p>
                <p className="text-gray-500 text-sm">
                  Add your first product above
                </p>
              </div>
            );
          }

return (
            <div className="grid grid-cols-2 gap-3">
              {allProducts.map((product) => (
                <div
                  className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gray-800 p-3 transition-all hover:border-gray-600"
                  key={product.id}
                >
                  {/* Delete button */}
                  <button
                    className="absolute top-2 right-2 z-10 rounded-lg bg-red-900/80 p-1.5 text-red-400 opacity-0 transition-all hover:bg-red-800 hover:text-red-300 group-hover:opacity-100 disabled:opacity-50"
                    disabled={deletingId === product.id}
                    onClick={() => handleDeleteProduct(product.id)}
                    title="Delete product"
                    type="button"
                  >
                    {deletingId === product.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                  <div className="aspect-square overflow-hidden rounded-lg bg-gray-700">
                    <img
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      height={128}
                      src={product.imageUrl}
                      width={128}
                    />
                  </div>
                  <div className="mt-2 flex flex-col gap-1">
                    <p
                      className="truncate font-medium text-white"
                      title={product.name}
                    >
                      {product.name}
                    </p>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="h-3 w-3" />
                      {formatDate(product.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
