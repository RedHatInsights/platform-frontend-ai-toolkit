#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { 
  getFEOSchema, 
  getFEOMigrationTemplate, 
  getFEOYamlSetupTemplate,
  getFEOExamples, 
  validateFEOConfig,
  getFEOBestPractices,
  getFEONavigationPositioning,
  getFEOServiceTilesSections,
  getFEOFieldRecommendations
} from './tools.js';

const server = new Server(
  {
    name: 'hcc-feo-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'getFEOSchema',
        description: 'Get the latest Frontend Operator CRD schema for validation and reference',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      {
        name: 'getFEOMigrationTemplate',
        description: 'Generate customized migration template for converting existing app to FEO',
        inputSchema: {
          type: 'object',
          properties: {
            appName: {
              type: 'string',
              description: 'Application name in kebab-case (e.g., "learning-resources")',
            },
            bundle: {
              type: 'string',
              description: 'Target bundle (insights, openshift, ansible, settings, etc.)',
            },
            migrationType: {
              type: 'string',
              enum: ['navigation', 'service-tiles', 'search', 'module', 'full'],
              description: 'Type of migration to generate template for',
            },
            displayTitle: {
              type: 'string',
              description: 'Human-readable application title (optional)',
            },
          },
          required: ['appName', 'bundle', 'migrationType'],
        },
      },
      {
        name: 'getFEOYamlSetupTemplate',
        description: 'Generate complete frontend.yaml template for new applications',
        inputSchema: {
          type: 'object',
          properties: {
            appName: {
              type: 'string',
              description: 'Application name in kebab-case (e.g., "my-new-app")',
            },
            displayTitle: {
              type: 'string',
              description: 'Human-readable application title',
            },
            bundle: {
              type: 'string',
              description: 'Target bundle (insights, openshift, ansible, settings, etc.)',
            },
            description: {
              type: 'string',
              description: 'Brief description of what the application does',
            },
            includeNavigation: {
              type: 'boolean',
              description: 'Include navigation bundle segment (default: true)',
            },
            includeServiceTiles: {
              type: 'boolean',
              description: 'Include service tiles configuration (default: true)',
            },
            includeSearch: {
              type: 'boolean',
              description: 'Include search entries (default: true)',
            },
          },
          required: ['appName', 'displayTitle', 'bundle'],
        },
      },
      {
        name: 'getFEOExamples',
        description: 'Get specific FEO configuration examples and patterns',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['navigation', 'service-tiles', 'search', 'module-config', 'multi-bundle', 'nested-navigation'],
              description: 'Type of example to retrieve',
            },
            bundle: {
              type: 'string',
              description: 'Specific bundle for examples (optional)',
            },
          },
          required: ['type'],
        },
      },
      {
        name: 'validateFEOConfig',
        description: 'Validate frontend.yaml configuration against FEO schema',
        inputSchema: {
          type: 'object',
          properties: {
            yamlContent: {
              type: 'string',
              description: 'YAML content to validate',
            },
            skipSchemaFetch: {
              type: 'boolean',
              description: 'Skip fetching latest schema and use cached version (default: false)',
            },
          },
          required: ['yamlContent'],
        },
      },
      {
        name: 'getFEOBestPractices',
        description: 'Get current FEO best practices and common patterns',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['positioning', 'naming', 'validation', 'migration', 'troubleshooting', 'all'],
              description: 'Specific category of best practices (default: all)',
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: 'getFEONavigationPositioning',
        description: 'Get guidance on navigation positioning and bundle segment organization',
        inputSchema: {
          type: 'object',
          properties: {
            bundle: {
              type: 'string',
              description: 'Bundle to get positioning guidance for (optional)',
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: 'getFEOFieldRecommendations',
        description: 'Get schema-based field recommendations for specific FEO configuration paths',
        inputSchema: {
          type: 'object',
          properties: {
            fieldPath: {
              type: 'string',
              description: 'Dot-notation path to field (e.g., "module", "bundleSegments", "serviceTiles")',
            },
            bundle: {
              type: 'string',
              description: 'Bundle context for bundle-specific recommendations (optional)',
            },
          },
          required: ['fieldPath'],
          additionalProperties: false,
        },
      },
      {
        name: 'getFEOServiceTilesSections',
        description: 'Get available service tiles sections and groups',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'getFEOSchema':
        return await getFEOSchema();

      case 'getFEOMigrationTemplate':
        return await getFEOMigrationTemplate(
          args?.appName as string,
          args?.bundle as string,
          args?.migrationType as string,
          args?.displayTitle as string | undefined
        );

      case 'getFEOYamlSetupTemplate':
        return await getFEOYamlSetupTemplate({
          appName: args?.appName as string,
          displayTitle: args?.displayTitle as string,
          bundle: args?.bundle as string,
          description: args?.description as string | undefined,
          includeNavigation: (args?.includeNavigation as boolean) ?? true,
          includeServiceTiles: (args?.includeServiceTiles as boolean) ?? true,
          includeSearch: (args?.includeSearch as boolean) ?? true,
        });

      case 'getFEOExamples':
        return await getFEOExamples(args?.type as string, args?.bundle as string | undefined);

      case 'validateFEOConfig':
        return await validateFEOConfig(args?.yamlContent as string, args?.skipSchemaFetch as boolean | undefined);

      case 'getFEOBestPractices':
        return await getFEOBestPractices(args?.category as string | undefined);

      case 'getFEONavigationPositioning':
        return await getFEONavigationPositioning(args?.bundle as string | undefined);

      case 'getFEOServiceTilesSections':
        return await getFEOServiceTilesSections();

      case 'getFEOFieldRecommendations':
        return await getFEOFieldRecommendations(
          args?.fieldPath as string,
          args?.bundle as string | undefined
        );

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});