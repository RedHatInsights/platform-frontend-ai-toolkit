import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export type McpTool = [string, { description: string; inputSchema: any }, (args: any) => Promise<CallToolResult>];
