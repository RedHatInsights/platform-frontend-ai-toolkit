import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpTool } from './types.js';
import { getFEOSchemaTool } from './tools/getFEOSchema.js';
import { getFEOMigrationTemplateTool } from './tools/getFEOMigrationTemplate.js';
import { getFEOYamlSetupTemplateTool } from './tools/getFEOYamlSetupTemplate.js';
import { getFEOExamplesTool } from './tools/getFEOExamples.js';
import { validateFEOConfigTool } from './tools/validateFEOConfig.js';
import { getFEOBestPracticesTool } from './tools/getFEOBestPractices.js';
import { getFEONavigationPositioningTool } from './tools/getFEONavigationPositioning.js';
import { getFEOFieldRecommendationsTool } from './tools/getFEOFieldRecommendations.js';
import { getFEOServiceTilesSectionsTool } from './tools/getFEOServiceTilesSections.js';

export async function run() {
  const tools: McpTool[] = [
    getFEOSchemaTool(),
    getFEOMigrationTemplateTool(),
    getFEOYamlSetupTemplateTool(),
    getFEOExamplesTool(),
    validateFEOConfigTool(),
    getFEOBestPracticesTool(),
    getFEONavigationPositioningTool(),
    getFEOFieldRecommendationsTool(),
    getFEOServiceTilesSectionsTool(),
  ];

  let server: McpServer | undefined = undefined;

  async function stopServer() {
    if (server) {
      await server.close();
      return process.exit(0);
    }

    throw new Error('HCC FEO MCP server is not running');
  }

  try {
    server = new McpServer({
      name: 'hcc-feo-mcp',
      version: '1.0.0',
    }, {
      instructions: 'You are a Model Context Protocol (MCP) server for the Frontend Operator (FEO) configuration system. You provide comprehensive assistance with FEO development, including schema validation, migration templates, YAML setup templates, configuration examples, best practices, navigation positioning guidance, field recommendations, and service tiles sections information.',
      capabilities: {
        tools: {},
      }
    });

    tools.forEach(([name, config, func]) => {
      server?.registerTool(name, config, func);
    });

    process.on('SIGINT', async () => stopServer());

    const transport = new StdioServerTransport();

    await server.connect(transport);

  } catch (error) {
    throw new Error(`Failed to start HCC FEO MCP server: ${(error as Error).message}`);
  }
}
