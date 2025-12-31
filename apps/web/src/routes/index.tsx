import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import logoImage from "@/assets/favicon.png";
import { UserMenu } from "@/components/auth/user-menu";
import { SearchDemo } from "@/components/visual-search/search-demo";
import { VendorUpload } from "@/components/visual-search/vendor-upload";
import { getSession } from "@/lib/auth-client";
import { API_ENDPOINTS } from "@/lib/visual-search-config";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Redirect to login if not authenticated
    const session = await getSession();
    if (!session.data?.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: VisualSearchPage,
});

type HealthStatus = {
  status: string;
  services: {
    embeddings: string;
  };
  productCount: number;
};

function VisualSearchPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.health);
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
        setIsConnected(true);
        return true;
      }
      setIsConnected(false);
      setHealth(null);
      return false;
    } catch {
      setIsConnected(false);
      setHealth(null);
      return false;
    }
  }, []);

  // Only check health once on page load
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-gray-800/50 border-b bg-gray-900/80 backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                alt="Nymo Logo"
                className="h-14 w-14 object-contain"
                height={56}
                src={logoImage}
                width={56}
              />
              <div>
                <h1 className="font-bold text-2xl text-white tracking-tight">
                  Nymo Search Demo
                </h1>
                <p className="text-gray-400">
                  AI-powered image & text product search
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 font-medium text-sm transition-all hover:opacity-80 ${
                  isConnected
                    ? "bg-emerald-900/30 text-emerald-400"
                    : "bg-red-900/30 text-red-400"
                }`}
                onClick={checkHealth}
                title="Click to refresh status"
                type="button"
              >
                {isConnected ? (
                  <>
                    <span>Connected</span>
                    {health !== null ? (
                      <span className="ml-1 opacity-70">
                        • {health.productCount} products
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span>Disconnected - Click to retry</span>
                )}
              </button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <VendorUpload onProductAdded={checkHealth} />
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <SearchDemo />
          </div>
        </div>

        <footer className="mt-12 text-center">
          <p className="text-gray-600 text-sm">
            Powered by{" "}
            <span className="font-medium text-indigo-500">Jina CLIP v2</span>{" "}
            multimodal embeddings
          </p>
        </footer>
      </main>
    </div>
  );
}
