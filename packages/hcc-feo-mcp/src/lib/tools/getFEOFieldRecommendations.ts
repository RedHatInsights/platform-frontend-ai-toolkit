import { z } from 'zod';
import yaml from 'yaml';
import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { McpTool } from '../types.js';
import { ensureSchemaLoaded } from '../utils/schemaCache.js';
import { getSchemaPropertyDefaults, getSchemaRequiredFields, getSchemaExamples } from '../utils/schemaHelpers.js';
import { getRecommendedPosition, getRecommendedServiceSection, getRecommendedIcon, getProductName } from '../utils/recommendations.js';

export function getFEOFieldRecommendationsTool(): McpTool {
  async function tool(args: any): Promise<CallToolResult> {
    try {
      const { fieldPath, bundle } = args;

      if (!fieldPath) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Missing required parameter: fieldPath'
        );
      }

      // Ensure schema is loaded
      await ensureSchemaLoaded();

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
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Error getting field recommendations: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return [
    'getFEOFieldRecommendations',
    {
      description: 'Get schema-based field recommendations for specific FEO configuration paths',
      inputSchema: {
        fieldPath: z.string().describe('Dot-notation path to field (e.g., "module", "bundleSegments", "serviceTiles")'),
        bundle: z.string().optional().describe('Bundle context for bundle-specific recommendations (optional)'),
      },
    },
    tool
  ];
}
