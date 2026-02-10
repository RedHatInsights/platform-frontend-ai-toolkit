import fetch from 'node-fetch';
import yaml from 'yaml';
import Ajv from 'ajv';

const FEO_SCHEMA_URL = 'https://raw.githubusercontent.com/RedHatInsights/frontend-components/refs/heads/master/packages/config-utils/src/feo/spec/frontend-crd.schema.json';

// Schema cache with 1-hour expiration
interface SchemaCache {
  schema: any;
  timestamp: number;
}

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
let schemaCache: SchemaCache | null = null;

// Legacy support for backwards compatibility
let cachedSchema: any = null;

export async function getFEOSchema() {
  try {
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

    const schema = schemaCache.schema;
    const cacheAge = Math.floor((now - schemaCache.timestamp) / 1000 / 60); // minutes

    return {
      content: [
        {
          type: 'text',
          text: `# Frontend Operator CRD Schema

Latest schema from: ${FEO_SCHEMA_URL}
Cache age: ${cacheAge} minutes (refreshes hourly)

## Schema Structure
- **Version**: ${schema.$schema || 'JSON Schema Draft 2020-12'}
- **Title**: ${schema.title}
- **Root Type**: ${schema.type}

## Key Definitions
${Object.keys(schema.$defs || {}).map(key => `- **${key}**: ${schema.$defs[key].description || 'No description'}`).join('\n')}

## Full Schema
\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\``,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching FEO schema: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function getFEOMigrationTemplate(
  appName: string,
  bundle: string,
  migrationType: string,
  displayTitle?: string
) {
  const title = displayTitle || appName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  // Ensure schema is loaded for smart generation
  if (!schemaCache) {
    await getFEOSchema();
  }
  cachedSchema = schemaCache?.schema || null;

  let template = '';
  
  try {
    switch (migrationType) {
      case 'module':
        template = generateSmartTemplate('module', {
          appName, bundle, title,
          manifestLocation: `/apps/${appName}/fed-mods.json`,
          documentTitle: `${title} | Red Hat Hybrid Cloud Console`,
          routes: [{ pathname: `/${bundle}/${appName}`, props: { bundle } }]
        });
        break;
      case 'navigation':
        template = generateSmartTemplate('navigation', {
          appName, bundle, title,
          position: getRecommendedPosition(bundle),
          productName: getProductName(bundle)
        });
        break;
      case 'service-tiles':
        const serviceSection = getRecommendedServiceSection(bundle);
        template = generateSmartTemplate('serviceTiles', {
          appName, bundle, title, 
          section: serviceSection.section, 
          group: serviceSection.group,
          icon: getRecommendedIcon(bundle)
        });
        break;
      case 'search':
        template = generateSmartTemplate('searchEntries', {
          appName, bundle, title
        });
        break;
      case 'full':
        const fullServiceSection = getRecommendedServiceSection(bundle);
        template = generateSmartTemplate('full', {
          appName, bundle, title,
          position: getRecommendedPosition(bundle),
          section: fullServiceSection.section,
          group: fullServiceSection.group,
          icon: getRecommendedIcon(bundle),
          productName: getProductName(bundle),
          manifestLocation: `/apps/${appName}/fed-mods.json`,
          documentTitle: `${title} | Red Hat Hybrid Cloud Console`,
          routes: [{ pathname: `/${bundle}/${appName}`, props: { bundle } }]
        });
        break;
      default:
        throw new Error(`Unknown migration type: ${migrationType}`);
    }
  } catch (error) {
    template = `# Error generating template: ${error instanceof Error ? error.message : String(error)}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: `# FEO Migration Template: ${migrationType}

App: **${appName}** → **${title}**
Bundle: **${bundle}**

## Configuration to Add/Update

\`\`\`yaml
${template}
\`\`\`

## Migration Steps

${getMigrationSteps(migrationType)}

## Validation

After applying this configuration:
1. Run \`npm run build\` to validate
2. Check for schema validation errors
3. Test in development environment
4. Mark corresponding items for replacement in chrome-service-backend`,
      },
    ],
  };
}

export async function getFEOYamlSetupTemplate(options: {
  appName: string;
  displayTitle: string;
  bundle: string;
  description?: string;
  includeNavigation: boolean;
  includeServiceTiles: boolean;
  includeSearch: boolean;
}) {
  const {
    appName,
    displayTitle,
    bundle,
    description = `[Brief description of what ${displayTitle} does]`,
    includeNavigation,
    includeServiceTiles,
    includeSearch
  } = options;

  // Ensure schema is loaded
  if (!schemaCache) {
    await getFEOSchema();
  }
  cachedSchema = schemaCache?.schema || null;

  const serviceSection = getRecommendedServiceSection(bundle);
  const templateData = {
    appName,
    bundle,
    displayTitle,
    description,
    includeNavigation,
    includeServiceTiles,
    includeSearch,
    position: getRecommendedPosition(bundle),
    section: serviceSection.section,
    group: serviceSection.group,
    icon: getRecommendedIcon(bundle),
    productName: getProductName(bundle)
  };

  const template = generateSmartTemplate('full', {
    appName,
    bundle, 
    title: displayTitle,
    position: templateData.position,
    section: templateData.section,
    group: templateData.group,
    icon: templateData.icon,
    productName: templateData.productName,
    manifestLocation: `/apps/${appName}/fed-mods.json`,
    documentTitle: `${displayTitle} | Red Hat Hybrid Cloud Console`,
    routes: [{ pathname: `/${bundle}/${appName}`, props: { bundle } }],
    includeNavigation: templateData.includeNavigation,
    includeServiceTiles: templateData.includeServiceTiles,
    includeSearch: templateData.includeSearch,
    description: templateData.description
  });

  return {
    content: [
      {
        type: 'text',
        text: `# Complete Frontend.yaml Template

Generated for: **${displayTitle}** (${appName})
Bundle: **${bundle}**

## Template

\`\`\`yaml
${template}
\`\`\`

## Next Steps

1. **Save** this as \`deploy/frontend.yaml\` in your repository
2. **Update values**:
   - Replace \`[PRODUCTION-API-KEY]\` with your analytics key
   - Replace \`[DEVELOPMENT-API-KEY]\` with your dev analytics key
   - Adjust position value based on desired navigation placement
   - Customize description and alt_title entries
3. **Validate**:
   \`\`\`bash
   npm run build  # Will validate schema
   \`\`\`
4. **Test** in development environment
5. **Deploy** to staging/production`,
      },
    ],
  };
}

export async function getFEOExamples(type: string, bundle?: string) {
  const examples = getExamplesByType(type, bundle);
  
  return {
    content: [
      {
        type: 'text',
        text: `# FEO Examples: ${type}

${examples}`,
      },
    ],
  };
}

export async function validateFEOConfig(yamlContent: string, skipSchemaFetch = false) {
  try {
    // Parse YAML
    const parsed = yaml.parse(yamlContent);
    
    // Get schema for validation
    if (!skipSchemaFetch && !schemaCache) {
      await getFEOSchema();
    }
    cachedSchema = schemaCache?.schema || null;

    if (!cachedSchema) {
      return {
        content: [
          {
            type: 'text',
            text: 'Warning: Schema validation skipped (schema not available)',
          },
        ],
      };
    }

    // Validate against schema
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(cachedSchema);
    const isValid = validate(parsed);

    let result = `# FEO Configuration Validation

## YAML Parse: ✅ Valid YAML structure

## Schema Validation: ${isValid ? '✅ Valid' : '❌ Invalid'}
`;

    if (!isValid && validate.errors) {
      result += `
## Validation Errors:
${validate.errors.map(error => 
  `- **${error.instancePath || 'root'}**: ${error.message}`
).join('\n')}
`;
    }

    // Additional checks
    const additionalChecks = performAdditionalChecks(parsed);
    if (additionalChecks.length > 0) {
      result += `
## Additional Recommendations:
${additionalChecks.map(check => `- ${check}`).join('\n')}
`;
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ YAML Parse Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function getFEOBestPractices(category = 'all') {
  const practices = getBestPracticesByCategory(category);
  
  return {
    content: [
      {
        type: 'text',
        text: `# FEO Best Practices${category !== 'all' ? `: ${category}` : ''}

${practices}`,
      },
    ],
  };
}

export async function getFEONavigationPositioning(bundle?: string) {
  const guidance = getNavigationPositioningGuidance(bundle);
  
  return {
    content: [
      {
        type: 'text',
        text: `# Navigation Positioning Guidance${bundle ? ` for ${bundle}` : ''}

${guidance}`,
      },
    ],
  };
}

export async function getFEOFieldRecommendations(fieldPath: string, bundle?: string) {
  // Ensure schema is loaded
  if (!schemaCache) {
    await getFEOSchema();
  }
  cachedSchema = schemaCache?.schema || null;

  try {
    const pathParts = fieldPath.split('.');
    const defaults = getSchemaPropertyDefaults(['frontendSpec', ...pathParts]);
    const required = getSchemaRequiredFields(['frontendSpec', ...pathParts]);
    const examples = getSchemaExamples(['frontendSpec', ...pathParts]);
    
    let recommendations = `# Field Recommendations: ${fieldPath}\n\n`;
    
    if (required.length > 0) {
      recommendations += `## Required Fields\n${required.map(field => `- \`${field}\``).join('\n')}\n\n`;
    }
    
    if (Object.keys(defaults).length > 0) {
      recommendations += `## Default Values\n`;
      for (const [key, value] of Object.entries(defaults)) {
        recommendations += `- \`${key}\`: \`${JSON.stringify(value)}\`\n`;
      }
      recommendations += '\n';
    }
    
    if (examples.length > 0) {
      recommendations += `## Schema Examples\n\`\`\`yaml\n${examples.map(ex => yaml.stringify(ex)).join('\n---\n')}\`\`\`\n\n`;
    }
    
    // Add bundle-specific recommendations from schema
    if (bundle) {
      const serviceSection = getRecommendedServiceSection(bundle);
      recommendations += `## Bundle-Specific Recommendations for '${bundle}'\n`;
      recommendations += `- Position: ${getRecommendedPosition(bundle)}\n`;
      recommendations += `- Product: ${getProductName(bundle)}\n`;
      recommendations += `- Service Section: ${serviceSection.section}\n`;
      recommendations += `- Service Group: ${serviceSection.group}\n`;
      recommendations += `- Icon: ${getRecommendedIcon(bundle)}\n`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: recommendations,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting field recommendations: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function getFEOServiceTilesSections() {
  const sections = getServiceTilesSections();
  
  return {
    content: [
      {
        type: 'text',
        text: `# Service Tiles Sections and Groups

${sections}`,
      },
    ],
  };
}

// Dynamic template generation based on schema
function generateDynamicTemplate(type: string, data: any): string {
  if (!cachedSchema) {
    return `# Error: Schema not loaded. Please fetch schema first.`;
  }

  try {
    const frontendSpec = cachedSchema.$defs?.frontendSpec;
    if (!frontendSpec) {
      throw new Error('Frontend spec not found in schema');
    }
    
    // For 'full' type, generate complete YAML template
    if (type === 'full') {
      return generateSchemaBasedTemplate(frontendSpec, data);
    }
    
    // For specific sections, just generate that section
    return generateSectionTemplate(frontendSpec, type, data);
  } catch (error) {
    return `# Error generating template: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function generateSchemaBasedTemplate(frontendSpec: any, data: any): string {
  const schemaUrl = FEO_SCHEMA_URL;
  
  // Start with schema reference and base template structure
  let template = `# yaml-language-server: $schema=${schemaUrl}

apiVersion: v1
kind: Template
metadata:
  name: ${data.appName}
parameters:
  - name: ENV_NAME
    required: true
  - name: IMAGE
    required: true
  - name: IMAGE_TAG
    required: true
objects:
  - apiVersion: cloud.redhat.com/v1alpha1
    kind: Frontend
    metadata:
      name: ${data.appName}
    spec:
      envName: \${ENV_NAME}
      title: "${data.title}"
      deploymentRepo: https://github.com/RedHatInsights/${data.appName}
      image: \${IMAGE}:\${IMAGE_TAG}`;

  // Add sections based on what exists in schema
  const specProperties = frontendSpec.properties || {};
  
  // Add feoConfigEnabled if it exists in schema
  if (specProperties.feoConfigEnabled) {
    template += `
      feoConfigEnabled: true`;
  }

  // Add frontend section if it exists in schema
  if (specProperties.frontend) {
    template += `
      
      # Frontend assets configuration
      frontend:
        paths:
          - "/apps/${data.appName}"`;
  }

  // Add module section if it exists in schema
  if (specProperties.module) {
    template += `
      
      # Module configuration
      module:
        manifestLocation: "${data.manifestLocation || '/apps/' + data.appName + '/fed-mods.json'}"
        defaultDocumentTitle: "${data.documentTitle || data.title + ' | Red Hat Hybrid Cloud Console'}"
        modules:
          - id: ${data.appName}
            module: "./RootApp"
            routes:`;
    
    // Add routes
    const routes = data.routes || [{ pathname: `/${data.bundle}/${data.appName}`, props: { bundle: data.bundle } }];
    routes.forEach((route: any) => {
      template += `
              - pathname: "${route.pathname}"
                props:
                  bundle: ${route.props.bundle}`;
    });
    
    // Add analytics if defined in schema
    const moduleProps = specProperties.module.properties;
    if (moduleProps?.analytics) {
      template += `
        analytics:
          APIKey: "[PRODUCTION-API-KEY]"
          APIKeyDev: "[DEVELOPMENT-API-KEY]"`;
    }
  }

  // Add optional sections based on schema and user preferences
  if (data.includeNavigation !== false && specProperties.bundleSegments) {
    template += `

      # Navigation bundle segment
      bundleSegments:
        - segmentId: ${data.appName}-${data.bundle}
          bundleId: ${data.bundle}
          position: ${data.position || 800}
          navItems:
            - id: ${data.appName}
              title: "${data.title}"
              href: /${data.bundle}/${data.appName}
              product: "${data.productName || data.bundle.charAt(0).toUpperCase() + data.bundle.slice(1)}"`;
  }

  if (data.includeServiceTiles !== false && specProperties.serviceTiles) {
    template += `

      # Service tiles for services dropdown
      serviceTiles:
        - id: ${data.appName}
          section: ${data.section || 'insights'}
          group: ${data.group || 'platform'}
          title: "${data.title}"
          href: /${data.bundle}/${data.appName}
          description: "${data.description || '[Brief description of what ' + data.title + ' does]'}"
          icon: "${data.icon || 'Application'}"`;
  }

  if (data.includeSearch !== false && specProperties.searchEntries) {
    template += `

      # Search entries for global search
      searchEntries:
        - id: ${data.appName}
          title: "${data.title}"
          href: /${data.bundle}/${data.appName}
          description: "${data.description || '[Detailed description for search results]'}"
          alt_title:
            - "${data.title.split(' ')[0]}"
            - "${data.appName.replace(/-/g, ' ')}"`;
  }

  return template;
}

function generateSectionTemplate(frontendSpec: any, sectionType: string, data: any): string {
  const specProperties = frontendSpec.properties || {};
  let template = '# In your deploy/frontend.yaml\nspec:';
  
  // Add feoConfigEnabled for any section that needs FEO features
  if (specProperties.feoConfigEnabled) {
    template += '\n  feoConfigEnabled: true';
  }
  
  switch (sectionType) {
    case 'module':
      if (specProperties.module) {
        template += `
  module:
    manifestLocation: "${data.manifestLocation || '/apps/' + data.appName + '/fed-mods.json'}"
    defaultDocumentTitle: "${data.documentTitle || data.title + ' | Red Hat Hybrid Cloud Console'}"
    modules:
      - id: ${data.appName}
        module: "./RootApp"
        routes:`;
        
        const routes = data.routes || [{ pathname: `/${data.bundle}/${data.appName}`, props: { bundle: data.bundle } }];
        routes.forEach((route: any) => {
          template += `
          - pathname: "${route.pathname}"
            props:
              bundle: ${route.props.bundle}`;
        });
        
        const moduleProps = specProperties.module.properties;
        if (moduleProps?.analytics) {
          template += `
    analytics:
      APIKey: "[PRODUCTION-API-KEY]"
      APIKeyDev: "[DEVELOPMENT-API-KEY]"`;
        }
      }
      break;
      
    case 'navigation':
      if (specProperties.bundleSegments) {
        template += `
  bundleSegments:
    - segmentId: ${data.appName}-${data.bundle}
      bundleId: ${data.bundle}
      position: ${data.position || 800}
      navItems:
        - id: ${data.appName}
          title: "${data.title}"
          href: /${data.bundle}/${data.appName}
          product: "${data.productName || data.bundle.charAt(0).toUpperCase() + data.bundle.slice(1)}"`;
      }
      break;
      
    case 'serviceTiles':
      if (specProperties.serviceTiles) {
        template += `
  serviceTiles:
    - id: ${data.appName}
      section: ${data.section || 'insights'}
      group: ${data.group || 'platform'}
      title: "${data.title}"
      href: /${data.bundle}/${data.appName}
      description: "${data.description || '[Brief description of what ' + data.title + ' does]'}"
      icon: "${data.icon || 'Application'}"`;
      }
      break;
      
    case 'searchEntries':
      if (specProperties.searchEntries) {
        template += `
  searchEntries:
    - id: ${data.appName}
      title: "${data.title}"
      href: /${data.bundle}/${data.appName}
      description: "${data.description || '[Detailed description for search results]'}"
      alt_title:
        - "${data.title.split(' ')[0]}"
        - "${data.appName.replace(/-/g, ' ')}"`;
      }
      break;
      
    default:
      return `# Error: Unknown section type '${sectionType}'`;
  }
  
  return template;
}



// Schema-aware template generation utilities
function getSchemaPropertyDefaults(schemaPath: string[]): Record<string, any> {
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

function getSchemaRequiredFields(schemaPath: string[]): string[] {
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

function getSchemaExamples(schemaPath: string[]): any[] {
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

// Enhanced template generation using schema intelligence
function generateSmartTemplate(templateType: string, data: any): string {
  if (!cachedSchema) {
    return generateDynamicTemplate(templateType, data);
  }

  try {
    // Get schema-aware defaults and requirements
    const moduleDefaults = getSchemaPropertyDefaults(['frontendSpec', 'module']);
    const moduleRequired = getSchemaRequiredFields(['frontendSpec', 'module']);
    const moduleExamples = getSchemaExamples(['frontendSpec', 'module']);
    
    // Use schema information to enhance template generation
    const enhancedData = {
      ...data,
      schemaDefaults: moduleDefaults,
      schemaRequired: moduleRequired,
      schemaExamples: moduleExamples
    };
    
    return generateDynamicTemplate(templateType, enhancedData);
  } catch (error) {
    // Fall back to basic dynamic generation if schema parsing fails
    return generateDynamicTemplate(templateType, data);
  }
}

// Helper functions - all data sourced from schema
function getRecommendedPosition(bundle: string): number {
  // Use schema defaults or provide reasonable default
  if (!cachedSchema) return 800;
  
  const bundleSegmentProps = cachedSchema.$defs?.frontendSpec?.properties?.bundleSegments;
  if (bundleSegmentProps?.items?.properties?.position?.default) {
    return bundleSegmentProps.items.properties.position.default;
  }
  
  // Return schema-suggested default or safe fallback
  return 800;
}

function getRecommendedServiceSection(bundle: string): { section: string; group: string } {
  if (!cachedSchema) {
    return { section: 'insights', group: 'platform' };
  }
  
  const serviceTilesProps = cachedSchema.$defs?.frontendSpec?.properties?.serviceTiles;
  const sectionDefault = serviceTilesProps?.items?.properties?.section?.default || 'insights';
  const groupDefault = serviceTilesProps?.items?.properties?.group?.default || 'platform';
  
  return { section: sectionDefault, group: groupDefault };
}

function getRecommendedIcon(bundle: string): string {
  if (!cachedSchema) return 'Application';
  
  const serviceTilesProps = cachedSchema.$defs?.frontendSpec?.properties?.serviceTiles;
  const iconDefault = serviceTilesProps?.items?.properties?.icon?.default;
  
  return iconDefault || 'Application';
}

function getProductName(bundle: string): string {
  if (!cachedSchema) {
    return bundle.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  const navItemsProps = cachedSchema.$defs?.frontendSpec?.properties?.bundleSegments?.items?.properties?.navItems;
  const productDefault = navItemsProps?.items?.properties?.product?.default;
  
  if (productDefault) {
    return productDefault;
  }
  
  // Generate from bundle name as fallback
  return bundle.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function getMigrationSteps(migrationType: string): string {
  const steps: Record<string, string> = {
    module: `1. Enable FEO with \`feoConfigEnabled: true\`
2. Add module configuration to replace fed-modules.json entry
3. Test module routing works correctly
4. Remove old fed-modules.json entry from chrome-service-backend`,
    navigation: `1. Find current navigation in chrome-service-backend
2. Add unique IDs to navigation items (if missing)
3. Transfer to bundle segments with appropriate position
4. Add feoReplacement markers in chrome-service-backend`,
    'service-tiles': `1. Find service tiles in chrome-service-backend services.json
2. Generate services-generated.json with \`make parse-services\`
3. Transfer relevant tiles to FEO serviceTiles format
4. Remove entries from services.json template`,
    search: `1. Ensure service tiles are migrated first
2. Define explicit search entries
3. Remove from static search configuration files
4. Test search functionality`,
    full: `1. Upgrade FEC dependencies to latest versions
2. Enable FEO with \`feoConfigEnabled: true\`
3. Migrate module configuration
4. Transfer navigation to bundle segments  
5. Convert service tiles
6. Create explicit search entries
7. Mark all items for replacement in chrome-service-backend
8. Validate and test thoroughly`,
  };
  return steps[migrationType] || 'No specific steps defined for this migration type.';
}

function getExamplesByType(type: string, bundle?: string): string {
  // Implementation for different example types
  // This would return formatted examples based on the type requested
  return `Examples for ${type} ${bundle ? `in ${bundle} bundle` : 'configuration'} would be provided here.`;
}

function performAdditionalChecks(config: any): string[] {
  const recommendations: string[] = [];
  
  // Check for feoConfigEnabled
  if (!config.objects?.[0]?.spec?.feoConfigEnabled) {
    recommendations.push('⚠️  Consider adding `feoConfigEnabled: true` to enable FEO features');
  }
  
  // Check for schema reference
  const yamlStr = JSON.stringify(config);
  if (!yamlStr.includes('yaml-language-server')) {
    recommendations.push('💡 Add schema reference at top of file for IDE validation');
  }
  
  return recommendations;
}

function getBestPracticesByCategory(category: string): string {
  // Implementation would return specific best practices based on category
  return `Best practices for ${category} would be provided here.`;
}

function getNavigationPositioningGuidance(bundle?: string): string {
  return `Navigation positioning guidance${bundle ? ` for ${bundle}` : ''} would be provided here.`;
}

function getServiceTilesSections(): string {
  return `Service tiles sections and groups information would be provided here.`;
}