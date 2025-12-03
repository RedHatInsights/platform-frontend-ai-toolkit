# @redhat-cloud-services/hcc-pf-mcp

HCC PatternFly MCP package for Model Context Protocol integration.

## Installation

```bash
npm install @redhat-cloud-services/hcc-pf-mcp
```

## Usage

### As MCP Server

Start the MCP server using npx:

```bash
npx @redhat-cloud-services/hcc-pf-mcp
```

### MCP Configuration

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "hcc-pf-mcp": {
      "command": "npx",
      "args": ["@redhat-cloud-services/hcc-pf-mcp"]
    }
  }
}
```

Or using local installation:

```json
{
  "mcpServers": {
    "hcc-pf-mcp": {
      "command": "node",
      "args": ["./node_modules/@redhat-cloud-services/hcc-pf-mcp/dist/index.js"]
    }
  }
}
```

### As Library

You can also import functions from this package:

```typescript
import { greet } from '@redhat-cloud-services/hcc-pf-mcp';

console.log(greet('Developer')); // "Hello, Developer from hcc-pf-mcp!"
```

## Features

- Model Context Protocol (MCP) server implementation
- PatternFly component assistance
- TypeScript support
- CLI and library usage

## License

Licensed under the Apache License 2.0. See LICENSE file for details.