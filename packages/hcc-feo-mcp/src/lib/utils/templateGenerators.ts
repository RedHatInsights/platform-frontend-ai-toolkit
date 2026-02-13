import { cachedSchema, FEO_SCHEMA_URL } from './schemaCache.js';
import { getSchemaPropertyDefaults, getSchemaRequiredFields, getSchemaExamples } from './schemaHelpers.js';

export function generateSchemaBasedTemplate(frontendSpec: any, data: any): string {
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

export function generateSectionTemplate(frontendSpec: any, sectionType: string, data: any): string {
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

export function generateDynamicTemplate(type: string, data: any): string {
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

export function generateSmartTemplate(templateType: string, data: any): string {
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
