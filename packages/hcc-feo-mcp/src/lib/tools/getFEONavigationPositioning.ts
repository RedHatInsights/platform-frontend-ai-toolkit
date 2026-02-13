import { z } from 'zod';
import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { McpTool } from '../types.js';
import { getNavigationPositioningGuidance } from '../utils/contentProviders.js';

export function getFEONavigationPositioningTool(): McpTool {
  async function tool(args: any): Promise<CallToolResult> {
    try {
      const bundle = args?.bundle;
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
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error getting navigation positioning: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return [
    'getFEONavigationPositioning',
    {
      description: 'Get guidance on navigation positioning and bundle segment organization',
      inputSchema: {
        bundle: z.string().optional().describe('Bundle to get positioning guidance for (optional)'),
      },
    },
    tool
  ];
}
