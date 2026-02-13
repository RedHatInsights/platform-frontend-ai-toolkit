# HCC Frontend Operator MCP Server

A Model Context Protocol (MCP) server providing dynamic, schema-driven tools for Frontend Operator (FEO) configuration management. This server fetches the latest schema and generates templates dynamically, ensuring configurations stay up-to-date with the official specification.

## Features

- **Dynamic Schema-Driven Generation**: Templates generated from live FEO schema, not hardcoded
- **Live Schema Management**: Always fetches the latest FEO schema from the official repository
- **Intelligent Template Generation**: Schema-aware templates with bundle-specific recommendations
- **Real-Time Validation**: Validate configurations against the current schema
- **Field Recommendations**: Smart suggestions based on schema structure and bundle context
- **Best Practices**: Current FEO best practices and patterns
- **Zero Maintenance**: No need to update templates when the schema evolves

## Schema-Driven Approach

Unlike hardcoded templates, this MCP server:

- **Fetches the live schema** from the official FEO repository
- **Generates templates dynamically** based on current schema structure  
- **Provides intelligent recommendations** using schema defaults and required fields
- **Eliminates maintenance overhead** - templates stay current automatically

## Available Tools

### `getFEOSchema`
Get the latest Frontend Operator CRD schema for validation and reference.

### `getFEOMigrationTemplate`
Generate customized migration templates using dynamic schema-based generation:
- Module configuration migration
- Navigation bundle segments
- Service tiles conversion
- Search entries setup
- Full migration templates

### `getFEOYamlSetupTemplate`
Generate complete frontend.yaml templates for new applications with:
- Proper FEO configuration
- Module routing setup
- Navigation bundle segments
- Service tiles configuration
- Search entries

### `getFEOFieldRecommendations`
Get schema-based field recommendations for specific configuration paths:
- Required fields based on schema
- Default values from schema definitions
- Bundle-specific recommendations (positioning, icons, product names)
- Schema examples for reference

### `getFEOExamples`
Get specific FEO configuration examples:
- Navigation patterns
- Service tiles examples
- Multi-bundle configurations
- Nested navigation structures

### `validateFEOConfig`
Validate frontend.yaml configuration against the FEO schema with detailed error reporting.

### `getFEOBestPractices`
Access current FEO best practices for positioning, naming, validation, and troubleshooting.

### `getFEONavigationPositioning`
Get guidance on navigation positioning and bundle segment organization.

### `getFEOServiceTilesSections`
Get available service tiles sections and groups for proper categorization.

## Installation

```bash
npm install
npm run build
```

## Usage with Claude

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "hcc-feo-mcp": {
      "command": "node",
      "args": ["/path/to/hcc-feo-mcp/dist/index.js"]
    }
  }
}
```

## Development

```bash
npm run dev  # Development mode with tsx
npm run build  # Production build
```

## Related Resources

- [FEO Migration Guide](https://github.com/RedHatInsights/chrome-service-backend/blob/main/docs/feo-migration-guide.md)
- [Frontend Operator Docs](https://github.com/RedHatInsights/frontend-starter-app/blob/master/docs/frontend-operator/index.md)
- [Frontend CRD Schema](https://raw.githubusercontent.com/RedHatInsights/frontend-components/refs/heads/master/packages/config-utils/src/feo/spec/frontend-crd.schema.json)