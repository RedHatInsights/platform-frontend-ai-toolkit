import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { McpTool } from '../types.js';
import { ensureSchemaLoaded, schemaCache, FEO_SCHEMA_URL } from '../utils/schemaCache.js';

export function getFEOSchemaTool(): McpTool {
  async function tool(args: any): Promise<CallToolResult> {
    try {
      const now = Date.now();
      await ensureSchemaLoaded();

      const schema = schemaCache!.schema;
      const cacheAge = Math.floor((now - schemaCache!.timestamp) / 1000 / 60); // minutes

      return {
        content: [
          {
            type: 'text',
            text: `# Frontend Operator CRD Schema

Latest schema from: ${FEO_SCHEMA_URL}
Cache age: ${cacheAge} minutes (refreshes hourly)

## Schema Structure
- **Version**: ${schema.$schema || 'JSON Schema Draft 2020-12'}
- **Title**: ${schema.title}
- **Root Type**: ${schema.type}

## Key Definitions
${Object.keys(schema.$defs || {}).map((key: string) => `- **${key}**: ${schema.$defs[key].description || 'No description'}`).join('\n')}

## Full Schema
\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\``,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error fetching FEO schema: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return [
    'getFEOSchema',
    {
      description: 'Get the latest Frontend Operator CRD schema for validation and reference',
      inputSchema: {},
    },
    tool
  ];
}
