import { cachedSchema } from './schemaCache.js';

export function getSchemaPropertyDefaults(schemaPath: string[]): Record<string, any> {
  if (!cachedSchema) return {};

  let current = cachedSchema;
  for (const path of schemaPath) {
    if (current.$defs?.[path]) {
      current = current.$defs[path];
    } else if (current.properties?.[path]) {
      current = current.properties[path];
    } else {
      return {};
    }
  }

  const defaults: Record<string, any> = {};
  if (current.properties) {
    for (const [key, prop] of Object.entries(current.properties as Record<string, any>)) {
      if (prop.default !== undefined) {
        defaults[key] = prop.default;
      }
    }
  }

  return defaults;
}

export function getSchemaRequiredFields(schemaPath: string[]): string[] {
  if (!cachedSchema) return [];

  let current = cachedSchema;
  for (const path of schemaPath) {
    if (current.$defs?.[path]) {
      current = current.$defs[path];
    } else if (current.properties?.[path]) {
      current = current.properties[path];
    } else {
      return [];
    }
  }

  return current.required || [];
}

export function getSchemaExamples(schemaPath: string[]): any[] {
  if (!cachedSchema) return [];

  let current = cachedSchema;
  for (const path of schemaPath) {
    if (current.$defs?.[path]) {
      current = current.$defs[path];
    } else if (current.properties?.[path]) {
      current = current.properties[path];
    } else {
      return [];
    }
  }

  return current.examples || [];
}
