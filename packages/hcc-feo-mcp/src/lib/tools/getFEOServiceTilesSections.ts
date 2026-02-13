import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { McpTool } from '../types.js';
import { getServiceTilesSections } from '../utils/contentProviders.js';

export function getFEOServiceTilesSectionsTool(): McpTool {
  async function tool(args: any): Promise<CallToolResult> {
    try {
      const sections = getServiceTilesSections();

      return {
        content: [
          {
            type: 'text',
            text: `# Service Tiles Sections and Groups

${sections}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error getting service tiles sections: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return [
    'getFEOServiceTilesSections',
    {
      description: 'Get available service tiles sections and groups',
      inputSchema: {},
    },
    tool
  ];
}
