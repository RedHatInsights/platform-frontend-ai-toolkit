import { z } from 'zod';
import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { McpTool } from '../types.js';
import { ensureSchemaLoaded } from '../utils/schemaCache.js';
import { generateSmartTemplate } from '../utils/templateGenerators.js';
import { getRecommendedPosition, getRecommendedServiceSection, getRecommendedIcon, getProductName } from '../utils/recommendations.js';

export function getFEOYamlSetupTemplateTool(): McpTool {
  async function tool(args: any): Promise<CallToolResult> {
    try {
      const {
        appName,
        displayTitle,
        bundle,
        description,
        includeNavigation = true,
        includeServiceTiles = true,
        includeSearch = true
      } = args;

      if (!appName || !displayTitle || !bundle) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Missing required parameters: appName, displayTitle, and bundle are required'
        );
      }

      const finalDescription = description || `[Brief description of what ${displayTitle} does]`;

      // Ensure schema is loaded
      await ensureSchemaLoaded();

      const serviceSection = getRecommendedServiceSection(bundle);
      const template = generateSmartTemplate('full', {
        appName,
        bundle,
        title: displayTitle,
        position: getRecommendedPosition(bundle),
        section: serviceSection.section,
        group: serviceSection.group,
        icon: getRecommendedIcon(bundle),
        productName: getProductName(bundle),
        manifestLocation: `/apps/${appName}/fed-mods.json`,
        documentTitle: `${displayTitle} | Red Hat Hybrid Cloud Console`,
        routes: [{ pathname: `/${bundle}/${appName}`, props: { bundle } }],
        includeNavigation,
        includeServiceTiles,
        includeSearch,
        description: finalDescription
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
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Error generating YAML setup template: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return [
    'getFEOYamlSetupTemplate',
    {
      description: 'Generate complete frontend.yaml template for new applications',
      inputSchema: {
        appName: z.string().describe('Application name in kebab-case (e.g., "my-new-app")'),
        displayTitle: z.string().describe('Human-readable application title'),
        bundle: z.string().describe('Target bundle (insights, openshift, ansible, settings, etc.)'),
        description: z.string().optional().describe('Brief description of what the application does'),
        includeNavigation: z.boolean().optional().describe('Include navigation bundle segment (default: true)'),
        includeServiceTiles: z.boolean().optional().describe('Include service tiles configuration (default: true)'),
        includeSearch: z.boolean().optional().describe('Include search entries (default: true)'),
      },
    },
    tool
  ];
}
