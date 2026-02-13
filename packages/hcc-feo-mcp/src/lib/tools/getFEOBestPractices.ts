import { z } from 'zod';
import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { McpTool } from '../types.js';
import { getBestPracticesByCategory } from '../utils/contentProviders.js';

export function getFEOBestPracticesTool(): McpTool {
  async function tool(args: any): Promise<CallToolResult> {
    try {
      const category = args?.category || 'all';
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
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error getting best practices: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return [
    'getFEOBestPractices',
    {
      description: 'Get current FEO best practices and common patterns',
      inputSchema: {
        category: z.enum(['positioning', 'naming', 'validation', 'migration', 'troubleshooting', 'all']).optional().describe('Specific category of best practices (default: all)'),
      },
    },
    tool
  ];
}
