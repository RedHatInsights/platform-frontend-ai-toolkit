import { z } from 'zod';
import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { McpTool } from '../types.js';
import { ensureSchemaLoaded } from '../utils/schemaCache.js';
import { generateSmartTemplate } from '../utils/templateGenerators.js';
import { getRecommendedPosition, getRecommendedServiceSection, getRecommendedIcon, getProductName } from '../utils/recommendations.js';
import { getMigrationSteps } from '../utils/contentProviders.js';

export function getFEOMigrationTemplateTool(): McpTool {
  async function tool(args: any): Promise<CallToolResult> {
    try {
      const { appName, bundle, migrationType, displayTitle } = args;

      if (!appName || !bundle || !migrationType) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Missing required parameters: appName, bundle, and migrationType are required'
        );
      }

      const title = displayTitle || appName.split('-').map((word: string) =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      // Ensure schema is loaded for smart generation
      await ensureSchemaLoaded();

      let template = '';

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
          throw new McpError(
            ErrorCode.InvalidParams,
            `Unknown migration type: ${migrationType}. Valid types are: module, navigation, service-tiles, search, full`
          );
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
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Error generating migration template: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return [
    'getFEOMigrationTemplate',
    {
      description: 'Generate customized migration template for converting existing app to FEO',
      inputSchema: {
        appName: z.string().describe('Application name in kebab-case (e.g., "learning-resources")'),
        bundle: z.string().describe('Target bundle (insights, openshift, ansible, settings, etc.)'),
        migrationType: z.enum(['navigation', 'service-tiles', 'search', 'module', 'full']).describe('Type of migration to generate template for'),
        displayTitle: z.string().optional().describe('Human-readable application title (optional)'),
      },
    },
    tool
  ];
}
