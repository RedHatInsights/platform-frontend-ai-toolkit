import fetch from 'node-fetch';

export const FEO_SCHEMA_URL = 'https://raw.githubusercontent.com/RedHatInsights/frontend-components/refs/heads/master/packages/config-utils/src/feo/spec/frontend-crd.schema.json';

// Schema cache with 1-hour expiration
export interface SchemaCache {
  schema: any;
  timestamp: number;
}

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
export let schemaCache: SchemaCache | null = null;

// Legacy support for backwards compatibility
export let cachedSchema: any = null;

// Helper function to get cached schema
export async function ensureSchemaLoaded(): Promise<void> {
  const now = Date.now();

  // Check if cache is valid
  if (!schemaCache || (now - schemaCache.timestamp) > CACHE_DURATION_MS) {
    const response = await fetch(FEO_SCHEMA_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.statusText}`);
    }
    const schema = await response.json();

    // Update cache with timestamp
    schemaCache = {
      schema,
      timestamp: now
    };

    // Update legacy cache for backwards compatibility
    cachedSchema = schema;
  }
}
