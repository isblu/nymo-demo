"use client";

import { ImageIcon, RefreshCw, Search, Sparkles, Type } from "lucide-react";
import { useCallback, useState } from "react";
import {
  API_ENDPOINTS,
  fileToBase64,
  type SearchResponse,
  type SearchResult,
} from "@/lib/visual-search-config";

type SearchMode = "image" | "text";

function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

function getScoreStyles(score: number): string {
  if (score >= 0.8) {
    return "bg-emerald-900/30 text-emerald-400";
  }
  if (score >= 0.6) {
    return "bg-lime-900/30 text-lime-400";
  }
  if (score >= 0.4) {
    return "bg-amber-900/30 text-amber-400";
  }
  return "bg-orange-900/30 text-orange-400";
}

type SearchResultCardProps = {
  result: SearchResult;
  index: number;
};

function SearchResultCard({ result, index }: SearchResultCardProps) {
  return (
    <div
      className="flex gap-4 rounded-xl border border-gray-700 bg-gray-800 p-4 transition-all hover:border-gray-600"
      style={{
        animationDelay: `${index * 50}ms`,
        animation: "fadeInUp 0.3s ease-out forwards",
      }}
    >
<img
        alt={result.product.name}
        className="h-20 w-20 flex-shrink-0 rounded-lg object-cover shadow-sm"
        height={128}
        src={result.product.imageUrl}
        width={128}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="truncate font-medium text-white">
            {result.product.name}
          </h4>
          <span
            className={`flex-shrink-0 rounded-lg px-2.5 py-1 font-semibold text-xs ${getScoreStyles(result.score)}`}
          >
            {formatScore(result.score)}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${result.score * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

type SearchResultsProps = {
  results: SearchResult[];
};

function SearchResults({ results }: SearchResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-white">
          {results.length > 0
            ? `Found ${results.length} match${results.length !== 1 ? "es" : ""}`
            : "No matches found"}
        </h3>
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((result, index) => (
            <SearchResultCard
              index={index}
              key={result.product.id}
              result={result}
            />
          ))}
        </div>
      )}

      {results.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-700 border-dashed bg-gray-800/30 px-6 py-12">
          <Search className="mb-3 h-12 w-12 text-gray-600" />
          <p className="font-medium text-gray-400">No similar products found</p>
          <p className="text-gray-500 text-sm">
            Try a different image or query
          </p>
        </div>
      )}
    </div>
  );
}

export function SearchDemo() {
  const [searchMode, setSearchMode] = useState<SearchMode>("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [textQuery, setTextQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (file?.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResults([]);
      setHasSearched(false);
      setError(null);
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

  const getDropZoneClassName = () => {
    const baseClasses =
      "relative block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all";
    if (isDragging) {
      return `${baseClasses} border-indigo-400 bg-indigo-900/20`;
    }
    if (preview) {
      return `${baseClasses} border-gray-700 bg-gray-800/50`;
    }
    return `${baseClasses} border-gray-700 bg-gray-800/50 hover:border-indigo-500/50 hover:bg-indigo-900/10`;
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setError(null);
    setResults([]);
    setHasSearched(false);
  };

  const performSearch = async (
    mode: SearchMode,
    file: File | null,
    query: string
  ): Promise<{ response: Response | null; error: string | null }> => {
    if (mode === "image" && file) {
      const imageBase64 = await fileToBase64(file);
      const result = await fetch(API_ENDPOINTS.search, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      }).catch(() => null);
      return { response: result, error: result ? null : "Network error" };
    }
    const result = await fetch(API_ENDPOINTS.textSearch, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim() }),
    }).catch(() => null);
    return { response: result, error: result ? null : "Network error" };
  };

  const handleSearch = async () => {
    if (searchMode === "image" && !selectedFile) {
      setError("Please select an image to search");
      return;
    }
    if (searchMode === "text" && !textQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { response, error: fetchError } = await performSearch(
      searchMode,
      selectedFile,
      textQuery
    );

    if (fetchError) {
      setError(fetchError);
      setIsLoading(false);
      return;
    }

    if (!response?.ok) {
      const errorData = response ? await response.json().catch(() => ({})) : {};
      setError(errorData.message || "Search failed");
      setIsLoading(false);
      return;
    }

    const data: SearchResponse = await response.json();
    setResults(data.results);
    setHasSearched(true);
    setIsLoading(false);
  };

  const canSearch =
    searchMode === "image" ? !!selectedFile : !!textQuery.trim();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/25 shadow-lg">
          <Search className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white text-xl">Search Products</h2>
          <p className="text-gray-400 text-sm">Find by image or text</p>
        </div>
      </div>

      {/* Search Mode Toggle */}
      <div className="flex rounded-2xl bg-gray-800 p-1.5">
        <button
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium text-sm transition-all ${
            searchMode === "image"
              ? "bg-gray-700 text-indigo-400 shadow-md"
              : "text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => handleModeChange("image")}
          type="button"
        >
          <ImageIcon className="h-4 w-4" />
          Image Search
        </button>
        <button
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium text-sm transition-all ${
            searchMode === "text"
              ? "bg-gray-700 text-indigo-400 shadow-md"
              : "text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => handleModeChange("text")}
          type="button"
        >
          <Type className="h-4 w-4" />
          Text Search
        </button>
      </div>

      {searchMode === "image" && (
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: This label wraps a file input and drag handlers provide enhanced UX for file drops
        <label
          className={getDropZoneClassName()}
          htmlFor="image-search-input"
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            accept="image/*"
            className="absolute inset-0 cursor-pointer opacity-0"
            id="image-search-input"
            onChange={handleFileChange}
            type="file"
          />
          {preview ? (
            <div className="flex flex-col items-center gap-3">
              <img
                alt="Query preview"
                className="h-40 w-40 rounded-xl object-cover shadow-md"
                height={128}
                src={preview}
                width={128}
              />
              <span className="text-gray-400 text-sm">
                Click or drag to change
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="rounded-full bg-indigo-900/30 p-4">
                <ImageIcon className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <p className="font-medium text-gray-300">
                  Upload a query image
                </p>
                <p className="text-gray-500 text-sm">or drag and drop here</p>
              </div>
            </div>
          )}
        </label>
      )}

      {searchMode === "text" && (
        <div className="flex flex-col gap-2">
          <label
            className="font-medium text-gray-300 text-sm"
            htmlFor="text-search-input"
          >
            Describe what you're looking for
          </label>
          <input
            className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 shadow-sm transition-all focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            id="text-search-input"
            onChange={(e) => {
              setTextQuery(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSearch && !isLoading) {
                handleSearch();
              }
            }}
            placeholder="e.g., red floral summer dress, blue denim jacket..."
            type="text"
            value={textQuery}
          />
        </div>
      )}

      {error !== null && (
        <div className="rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3.5 font-semibold text-white shadow-indigo-500/25 shadow-lg transition-all hover:from-indigo-400 hover:to-purple-500 hover:shadow-indigo-500/30 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        disabled={isLoading || !canSearch}
        onClick={handleSearch}
        type="button"
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Searching...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            <span>{searchMode === "image" ? "Find Similar" : "Search"}</span>
          </>
        )}
      </button>

      {hasSearched === true && <SearchResults results={results} />}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
