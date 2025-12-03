#!/usr/bin/env node

export function greet(name: string = 'World'): string {
  return `Hello, ${name} from hcc-pf-mcp!`;
}

// CLI entry point
if (require.main === module) {
  console.log('🚀 HCC PatternFly MCP CLI is running!');
  console.log(greet('CLI User'));
}