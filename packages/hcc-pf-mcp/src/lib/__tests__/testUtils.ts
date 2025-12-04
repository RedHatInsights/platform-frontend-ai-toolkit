import { McpError, ErrorCode, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Test utilities for MCP package testing
 */

// Common test data patterns
export const TEST_DATA = {
  // Common markdown content patterns
  MARKDOWN: {
    SIMPLE: '# Test Document\n\nThis is a test document.',
    WITH_CODE: '# Example\n\n```typescript\nconst x = 1;\n```',
    WITH_EMOJI: '# Test 🚀\n\nUnicode content: éñïcödé, 中文, 🎯',
    LARGE: '# Large Content\n\n' + 'A'.repeat(10000) + '\n\n## End',
    EMPTY: '',
    SPECIAL_CHARS: '# Test\n\nContent with special chars: @#$%^&*()'
  },

  // Common JSON response patterns
  JSON: {
    SIMPLE: { message: 'test' },
    COMPLEX: {
      data: {
        items: [{ id: 1, name: 'Test' }, { id: 2, name: 'Another' }],
        metadata: { total: 2, page: 1 }
      }
    },
    EMPTY: {},
    ARRAY: [1, 2, 3, 4, 5]
  },

  // Common error messages
  ERRORS: {
    NETWORK: 'Network error',
    TIMEOUT: 'Request timeout',
    NOT_FOUND: 'Network response was not ok: 404 Not Found',
    SERVER_ERROR: 'Network response was not ok: 500 Internal Server Error',
    PERMISSION: 'EACCES: permission denied',
    FILE_NOT_FOUND: 'ENOENT: no such file or directory'
  }
} as const;

// Valid example names for implementationExample tool
export const VALID_EXAMPLES = [
  'minimalSetup',
  'commonUsage',
  'toolbarExample',
  'filters',
  'table',
  'resizeableColumns',
  'treeTable',
  'loadingState',
  'tableStates'
] as const;

/**
 * Assertion helpers for testing MCP tools
 */
export const expectMcpTool = {
  /**
   * Assert that a tool returns the expected configuration structure
   */
  toHaveValidConfiguration: (tool: [string, any, Function], expectedName: string) => {
    const [toolName, config, toolFunction] = tool;

    expect(toolName).toBe(expectedName);
    expect(config).toHaveProperty('description');
    expect(typeof config.description).toBe('string');
    expect(config.description.length).toBeGreaterThan(0);
    expect(config).toHaveProperty('inputSchema');
    expect(typeof toolFunction).toBe('function');
  },

  /**
   * Assert that a tool result has the correct MCP response format
   */
  toHaveValidResponse: (result: any) => {
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);

    result.content.forEach((item: any) => {
      expect(item).toHaveProperty('type');
      expect(item.type).toBe('text');
      expect(item).toHaveProperty('text');
      expect(typeof item.text).toBe('string');
    });

    // Ensure no extra properties
    const expectedKeys = ['content'];
    expect(Object.keys(result)).toEqual(expectedKeys);
  },

  /**
   * Assert that an error is a proper McpError with expected properties
   */
  toBeValidMcpError: (error: any, expectedCode: ErrorCode, messagePattern?: string | RegExp) => {
    expect(error).toBeInstanceOf(McpError);
    expect(error.code).toBe(expectedCode);

    if (messagePattern) {
      if (typeof messagePattern === 'string') {
        expect(error.message).toContain(messagePattern);
      } else {
        expect(error.message).toMatch(messagePattern);
      }
    }
  },

  /**
   * Get the text content from the first content item, with proper type checking.
   * Should be called after toHaveValidResponse to ensure type safety.
   */
  getTextContent: (result: CallToolResult): string => {
    // toHaveValidResponse already validates that all content items have type 'text'
    // So we can safely cast the first item to text content type
    const firstItem = result.content[0];
    if (firstItem.type === 'text') {
      return firstItem.text;
    }
    throw new Error('Content item is not of type "text"');
  }
};

/**
 * Mock helpers for common testing scenarios
 */
export const createMockError = {
  /**
   * Create a standard Error object
   */
  standard: (message: string) => new Error(message),

  /**
   * Create a file system error
   */
  fileSystem: (code: string, message: string) => {
    const error = new Error(`${code}: ${message}`);
    (error as any).code = code;
    return error;
  },

  /**
   * Create a network error
   */
  network: (status: number, statusText: string) =>
    new Error(`Network response was not ok: ${status} ${statusText}`),

  /**
   * Create a non-Error object (for testing error handling edge cases)
   */
  nonError: (value: any) => value
};

/**
 * Test helper for validating example names against known valid list
 */
export const validateExampleName = {
  isValid: (name: string): name is typeof VALID_EXAMPLES[number] => {
    return VALID_EXAMPLES.includes(name as any);
  },

  getInvalidExamples: () => [
    'invalidExample',
    'MINIMALSETUP',
    'MinimalSetup',
    'test@#$%',
    '',
    null,
    undefined,
    123
  ],

  getValidExamples: () => [...VALID_EXAMPLES]
};

/**
 * URL validation helpers
 */
export const validateUrl = {
  /**
   * Check if URL matches expected PatternFly documentation URL pattern
   */
  isPatternFlyDocsUrl: (url: string) => {
    const pattern = /^https:\/\/raw\.githubusercontent\.com\/patternfly\/react-data-view\/refs\/heads\/main\/packages\/module\/patternfly-docs\/content\/extensions\/data-view\/examples\/DataView\/DataView\.md$/;
    return pattern.test(url);
  },

  /**
   * Check if URL is in the expected test domain
   */
  isTestUrl: (url: string) => {
    return url.startsWith('https://example.com/');
  }
};

/**
 * Content validation helpers
 */
export const validateContent = {
  /**
   * Check if content appears to be valid markdown
   */
  isValidMarkdown: (content: string) => {
    // Basic checks for markdown patterns
    const hasHeaders = /^#{1,6}\s/.test(content);
    const hasCodeBlocks = /```[\s\S]*?```/.test(content);
    const hasLists = /^[\s]*[-*+]\s/.test(content);

    return content.length > 0 && (hasHeaders || hasCodeBlocks || hasLists || content.includes('\n'));
  },

  /**
   * Check if content contains special characters or Unicode
   */
  hasSpecialCharacters: (content: string) => {
    // Check for non-ASCII characters
    return /[^\x00-\x7F]/.test(content);
  },

  /**
   * Validate that content is preserved exactly (no unwanted transformations)
   */
  isPreserved: (original: string, result: string) => {
    return original === result;
  }
};

/**
 * Performance testing helpers
 */
export const performanceHelpers = {
  /**
   * Create large test content for performance testing
   */
  createLargeContent: (sizeInChars: number) => {
    const pattern = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';
    const repeatCount = Math.ceil(sizeInChars / pattern.length);
    return pattern.repeat(repeatCount).substring(0, sizeInChars);
  },

  /**
   * Measure execution time of an async function
   */
  measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, timeMs: end - start };
  }
};

/**
 * Type guard utilities for safe error handling in tests
 * These help eliminate 'unknown' error types in catch blocks
 */
export const errorTypeGuards = {
  /**
   * Type guard to check if an unknown value is an Error instance
   */
  isError: (error: unknown): error is Error => {
    return error instanceof Error;
  },

  /**
   * Type guard to check if an unknown value is an McpError instance
   */
  isMcpError: (error: unknown): error is McpError => {
    return error instanceof McpError;
  },

  /**
   * Type guard to check if an unknown value is a filesystem error with a code property
   */
  isFileSystemError: (error: unknown): error is Error & { code: string } => {
    return error instanceof Error && 'code' in error && typeof (error as any).code === 'string';
  },

  /**
   * Safely get error message from unknown error type
   */
  getErrorMessage: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    return String(error);
  },

  /**
   * Safely check if error is an McpError with specific code
   */
  isMcpErrorWithCode: (error: unknown, code: ErrorCode): error is McpError => {
    return error instanceof McpError && error.code === code;
  }
};