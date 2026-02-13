import yaml from 'yaml';
import Ajv from 'ajv';
import { z } from 'zod';
import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { McpTool } from '../types.js';
import { ensureSchemaLoaded, cachedSchema } from '../utils/schemaCache.js';
import { performAdditionalChecks } from '../utils/contentProviders.js';

export function validateFEOConfigTool(): McpTool {
  async function tool(args: any): Promise<CallToolResult> {
    try {
      const { yamlContent, skipSchemaFetch = false } = args;

      if (!yamlContent) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Missing required parameter: yamlContent'
        );
      }

      // Parse YAML
      let parsed;
      try {
        parsed = yaml.parse(yamlContent);
      } catch (parseError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `YAML Parse Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        );
      }

      // Get schema for validation
      if (!skipSchemaFetch) {
        await ensureSchemaLoaded();
      }

      if (!cachedSchema) {
        return {
          content: [
            {
              type: 'text',
              text: 'Warning: Schema validation skipped (schema not available)',
            },
          ],
        };
      }

      // Validate against schema
      const ajv = new Ajv({ allErrors: true, strict: false });
      const validate = ajv.compile(cachedSchema);
      const isValid = validate(parsed);

      let result = `# FEO Configuration Validation

## YAML Parse: ✅ Valid YAML structure

## Schema Validation: ${isValid ? '✅ Valid' : '❌ Invalid'}
`;

      if (!isValid && validate.errors) {
        result += `
## Validation Errors:
${validate.errors.map(error =>
  `- **${error.instancePath || 'root'}**: ${error.message}`
).join('\n')}
`;
      }

      // Additional checks
      const additionalChecks = performAdditionalChecks(parsed);
      if (additionalChecks.length > 0) {
        result += `
## Additional Recommendations:
${additionalChecks.map(check => `- ${check}`).join('\n')}
`;
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Error validating FEO config: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return [
    'validateFEOConfig',
    {
      description: 'Validate frontend.yaml configuration against FEO schema',
      inputSchema: {
        yamlContent: z.string().describe('YAML content to validate'),
        skipSchemaFetch: z.boolean().optional().describe('Skip fetching latest schema and use cached version (default: false)'),
      },
    },
    tool
  ];
}
