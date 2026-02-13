export function getMigrationSteps(migrationType: string): string {
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

export function getExamplesByType(type: string, bundle?: string): string {
  const exampleMap: Record<string, string> = {
    'navigation': 'basicNavigation.md',
    'service-tiles': 'serviceTiles.md',
    'search': 'searchEntries.md',
    'module-config': 'moduleConfiguration.md',
    'multi-bundle': 'fullApplication.md',
    'nested-navigation': 'basicNavigation.md',
    'full': 'fullApplication.md',
    'migration': 'migrationExample.md'
  };

  const exampleFile = exampleMap[type];

  if (!exampleFile) {
    return `# Unknown Example Type: ${type}

Available example types:
- **navigation**: Basic navigation configuration
- **service-tiles**: Service tiles in the Services dropdown
- **search**: Search entries for global search
- **module-config**: Module and route configuration
- **multi-bundle**: Complete application spanning multiple bundles
- **full**: Full application with all FEO features
- **migration**: Migrating from chrome-service-backend to FEO

${bundle ? `\nNote: Requested bundle context: ${bundle}` : ''}`;
  }

  // Note: In a real implementation, we would read these files from disk
  // For now, we return a helpful message pointing to the example
  return `# FEO Configuration Example: ${type}

${bundle ? `Bundle context: ${bundle}\n\n` : ''}

Example file: \`src/lib/examples/${exampleFile}\`

For detailed examples, please refer to the example files in the hcc-feo-mcp package, or use the specific FEO tools:
- \`getFEOMigrationTemplate\` - Generate migration templates
- \`getFEOYamlSetupTemplate\` - Generate full frontend.yaml templates
- \`getFEOSchema\` - View the complete schema
- \`getFEOFieldRecommendations\` - Get field-specific guidance

**Quick Reference:**

For **${type}** configuration, the key sections you need are:

${getQuickReference(type)}`;
}

function getQuickReference(type: string): string {
  const references: Record<string, string> = {
    'navigation': `\`\`\`yaml
bundleSegments:
  - segmentId: my-app-insights
    bundleId: insights
    position: 800
    navItems:
      - id: my-app
        title: "My Application"
        href: /insights/my-app
        product: "Red Hat Insights"
\`\`\``,
    'service-tiles': `\`\`\`yaml
serviceTiles:
  - id: my-app
    section: insights
    group: platform
    title: "My Application"
    href: /insights/my-app
    description: "Application description"
    icon: "Application"
\`\`\``,
    'search': `\`\`\`yaml
searchEntries:
  - id: my-app
    title: "My Application"
    href: /insights/my-app
    description: "Detailed description for search results"
    alt_title:
      - "my app"
      - "alternative keywords"
\`\`\``,
    'module-config': `\`\`\`yaml
module:
  manifestLocation: "/apps/my-app/fed-mods.json"
  defaultDocumentTitle: "My App | Red Hat Console"
  modules:
    - id: my-app
      module: "./RootApp"
      routes:
        - pathname: /insights/my-app
          props:
            bundle: insights
  analytics:
    APIKey: "PROD-KEY"
    APIKeyDev: "DEV-KEY"
\`\`\``
  };

  return references[type] || `See the complete example file for detailed configuration options.`;
}

export function performAdditionalChecks(config: any): string[] {
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

export function getBestPracticesByCategory(category: string): string {
  // Implementation would return specific best practices based on category
  return `Best practices for ${category} would be provided here.`;
}

export function getNavigationPositioningGuidance(bundle?: string): string {
  return `Navigation positioning guidance${bundle ? ` for ${bundle}` : ''} would be provided here.`;
}

export function getServiceTilesSections(): string {
  return `Service tiles sections and groups information would be provided here.`;
}
