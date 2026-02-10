# Testing HCC FEO MCP Server with Claude Desktop

## Setup Instructions

1. **Build the server:**
   ```bash
   cd /home/justinorringer/platform-frontend-ai-toolkit/packages/hcc-feo-mcp
   npm run build
   ```

2. **Configure Claude Desktop:**
   
   Create the configuration file:
   ```bash
   mkdir -p ~/.config/Claude
   ```
   
   Add this content to `~/.config/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "hcc-feo-mcp": {
         "command": "node",
         "args": ["/home/justinorringer/platform-frontend-ai-toolkit/packages/hcc-feo-mcp/dist/index.js"],
         "env": {}
       }
     }
   }
   ```

3. **Restart Claude Desktop** to load the new MCP server

4. **Test the connection** by asking Claude:
   - "What MCP servers are available?"
   - "Can you get the FEO schema?"
   - "Generate a migration template for my-app in the insights bundle"

## Test Commands

Once connected, you can test these capabilities:

### Schema Operations
- "Get the latest FEO schema"
- "What are the required fields for the module configuration?"
- "Show me field recommendations for bundleSegments"

### Template Generation
- "Generate a module migration template for learning-resources in insights bundle"
- "Create a complete frontend.yaml for a new app called 'test-app' in the openshift bundle"
- "Generate a full migration template for cost-management in the insights bundle"

### Validation
- "Validate this YAML configuration: [paste your YAML]"
- "What are the best practices for FEO navigation positioning?"

### Examples and Guidance
- "Show me examples of service tiles configuration"
- "Get navigation positioning guidance for the ansible bundle"
- "What are the available service tiles sections?"

## Troubleshooting

If the MCP server doesn't connect:
1. Check that the file path in the config is correct
2. Ensure the server builds without errors: `npm run build`
3. Test the server manually: `node dist/index.js` (should wait for input)
4. Check Claude's logs for connection errors
5. Restart Claude Desktop after config changes

## Development Workflow

For active development:
1. Make changes to `src/` files
2. Run `npm run build`
3. Restart Claude Desktop (if needed)
4. Test changes in Claude