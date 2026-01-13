import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabaseUrlFromDatabaseUrl(): string | null {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  // Match pattern: postgres.{projectRef}: in the DATABASE_URL
  const match = databaseUrl.match(/postgres\.([a-z0-9]+):/);
  if (match?.[1]) {
    return `https://${match[1]}.supabase.co`;
  }
  return null;
}

function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    // Try explicit SUPABASE_URL first, then derive from DATABASE_URL
    const supabaseUrl =
      process.env.SUPABASE_URL || getSupabaseUrlFromDatabaseUrl();

    // Support both new (SUPABASE_API_KEY) and old (SUPABASE_SERVICE_KEY) env var names
    const supabaseKey =
      process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl) {
      throw new Error(
        "Missing Supabase URL. Set SUPABASE_URL environment variable, or ensure DATABASE_URL contains the project reference."
      );
    }

    if (!supabaseKey) {
      throw new Error(
        "Missing Supabase API key. Set SUPABASE_API_KEY (or SUPABASE_SERVICE_KEY) environment variable."
      );
    }

    console.log(`[Storage] Connecting to Supabase at ${supabaseUrl}`);
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

const BUCKET_NAME = "product-images";

/**
 * Upload a base64-encoded image to Supabase Storage
 * @param base64Data - The base64 image data (without data URL prefix)
 * @param productId - Unique identifier for the product (used as filename)
 * @returns The public URL of the uploaded image
 */
export async function uploadProductImage(
  base64Data: string,
  productId: string
): Promise<string> {
  const supabase = getSupabaseClient();

  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

  // Convert base64 to Uint8Array
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Detect image type from base64 header or default to jpeg
  let contentType = "image/jpeg";
  let extension = "jpg";

  if (base64Data.startsWith("data:image/png")) {
    contentType = "image/png";
    extension = "png";
  } else if (base64Data.startsWith("data:image/webp")) {
    contentType = "image/webp";
    extension = "webp";
  } else if (base64Data.startsWith("data:image/gif")) {
    contentType = "image/gif";
    extension = "gif";
  }

  const filePath = `products/${productId}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, bytes, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("[Storage] Upload error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  console.log(`[Storage] Image uploaded: ${filePath}`);
  return publicUrl;
}

/**
 * Delete a product image from Supabase Storage
 * @param productId - The product ID whose image should be deleted
 */
export async function deleteProductImage(productId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // Try to delete all possible extensions
  const extensions = ["jpg", "png", "webp", "gif"];
  const paths = extensions.map((ext) => `products/${productId}.${ext}`);

  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);

  if (error) {
    console.error("[Storage] Delete error:", error);
    // Don't throw - deletion failure shouldn't block other operations
  } else {
    console.log(`[Storage] Image deleted for product: ${productId}`);
  }
}
