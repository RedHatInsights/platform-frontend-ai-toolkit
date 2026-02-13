import { z } from 'zod';
import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { McpTool } from '../types.js';
import { getExamplesByType } from '../utils/contentProviders.js';

export function getFEOExamplesTool(): McpTool {
  async function tool(args: any): Promise<CallToolResult> {
    try {
      const { type, bundle } = args;

      if (!type) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Missing required parameter: type'
        );
      }

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
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Error getting FEO examples: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return [
    'getFEOExamples',
    {
      description: 'Get specific FEO configuration examples and patterns',
      inputSchema: {
        type: z.enum(['navigation', 'service-tiles', 'search', 'module-config', 'multi-bundle', 'nested-navigation']).describe('Type of example to retrieve'),
        bundle: z.string().optional().describe('Specific bundle for examples (optional)'),
      },
    },
    tool
  ];
}
