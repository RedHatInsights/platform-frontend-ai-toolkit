// Mock the utility dependencies
const mockGetLocalModulesMap = jest.fn();

jest.mock('../../utils/getLocalModulesMap', () => ({
  getLocalModulesMap: mockGetLocalModulesMap
}));

import { getAvailableModulesTool } from '../getAvailableModules';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import {
  TEST_DATA,
  expectMcpTool,
  createMockError,
  errorTypeGuards
} from '../../__tests__/testUtils';

describe('getAvailableModulesTool', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('tool configuration', () => {
    it('should return tool configuration with correct name and schema', () => {
      const tool = getAvailableModulesTool();
      expectMcpTool.toHaveValidConfiguration(tool, 'getAvailableModules');

      const [, config] = tool;
      expect(config.description).toContain('Retrieves a list of available Patternfly react-core modules');
      expect(config.inputSchema.packageName).toBeDefined();
      expect(config.inputSchema.nodeModulesRootPath).toBeDefined();
    });

    it('should have proper package name enum values', () => {
      const [, config] = getAvailableModulesTool();
      const packageSchema = config.inputSchema.packageName;

      // Check that the schema accepts valid enum values
      expect(() => packageSchema.parse('@patternfly/react-core')).not.toThrow();
      expect(() => packageSchema.parse('@patternfly/react-icons')).not.toThrow();
      expect(() => packageSchema.parse('@patternfly/react-table')).not.toThrow();
      expect(() => packageSchema.parse('@patternfly/react-data-view')).not.toThrow();
      expect(() => packageSchema.parse('@patternfly/react-component-groups')).not.toThrow();

      // Check that invalid values are rejected
      expect(() => packageSchema.parse('invalid-package')).toThrow();
    });

    it('should have default package name of @patternfly/react-core', () => {
      const [, config] = getAvailableModulesTool();
      const packageSchema = config.inputSchema.packageName;

      // Test that when no value is provided, it defaults to @patternfly/react-core
      const defaultValue = packageSchema.parse(undefined);
      expect(defaultValue).toBe('@patternfly/react-core');
    });

    it('should have optional nodeModulesRootPath parameter', () => {
      const [, config] = getAvailableModulesTool();
      const nodeModulesSchema = config.inputSchema.nodeModulesRootPath;

      // Test that undefined is accepted (optional)
      expect(() => nodeModulesSchema.parse(undefined)).not.toThrow();
      // Test that valid string is accepted
      expect(() => nodeModulesSchema.parse('/valid/path')).not.toThrow();
    });

    it('should have consistent configuration across multiple calls', () => {
      const [toolName1, config1, toolFunction1] = getAvailableModulesTool();
      const [toolName2, config2, toolFunction2] = getAvailableModulesTool();

      expect(toolName1).toBe(toolName2);
      expect(config1.description).toBe(config2.description);
      expect(typeof toolFunction1).toBe(typeof toolFunction2);
    });
  });

  describe('successful module retrieval', () => {
    it('should successfully retrieve and return module names as semicolon-separated string', async () => {
      const mockModulesMap = {
        'Button': 'lib/Button/index.js',
        'Card': 'lib/Card/index.js',
        'Modal': 'lib/Modal/index.js',
        'Table': 'lib/Table/index.js'
      };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-core' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe('Button;Card;Modal;Table');

      expect(mockGetLocalModulesMap).toHaveBeenCalledWith('@patternfly/react-core', undefined);
    });

    it('should handle empty modules map', async () => {
      mockGetLocalModulesMap.mockResolvedValue({});

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-core' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe('');
    });

    it('should handle single module', async () => {
      const mockModulesMap = {
        'Button': 'lib/Button/index.js'
      };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-core' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe('Button');
    });

    it('should pass nodeModulesRootPath to getLocalModulesMap when provided', async () => {
      const mockModulesMap = { 'Button': 'lib/Button/index.js' };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);
      const customPath = '/custom/node_modules';

      const [, , toolFunction] = getAvailableModulesTool();
      await toolFunction({
        packageName: '@patternfly/react-core',
        nodeModulesRootPath: customPath
      });

      expect(mockGetLocalModulesMap).toHaveBeenCalledWith('@patternfly/react-core', customPath);
    });

    it('should work with different package names', async () => {
      const mockModulesMap = {
        'AccessibilityIcon': 'lib/icons/AccessibilityIcon/index.js',
        'AddCircleOIcon': 'lib/icons/AddCircleOIcon/index.js'
      };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-icons' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe('AccessibilityIcon;AddCircleOIcon');

      expect(mockGetLocalModulesMap).toHaveBeenCalledWith('@patternfly/react-icons', undefined);
    });

    it('should preserve module name order from getLocalModulesMap', async () => {
      const mockModulesMap = {
        'Zebra': 'lib/Zebra/index.js',
        'Alpha': 'lib/Alpha/index.js',
        'Beta': 'lib/Beta/index.js'
      };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-core' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe('Zebra;Alpha;Beta');
    });

    it('should handle modules with special characters in names', async () => {
      const mockModulesMap = {
        'Button-special': 'lib/Button-special/index.js',
        'Card_variant': 'lib/Card_variant/index.js',
        'Modal@deprecated': 'lib/Modal@deprecated/index.js'
      };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-core' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe('Button-special;Card_variant;Modal@deprecated');
    });
  });

  describe('input validation', () => {
    it('should throw McpError for missing packageName', async () => {
      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({});
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Missing required parameter: packageName');
      }
    });

    it('should throw McpError for null packageName', async () => {
      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({ packageName: null });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Missing required parameter: packageName');
      }
    });

    it('should throw McpError for undefined packageName', async () => {
      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({ packageName: undefined });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Missing required parameter: packageName');
      }
    });

    it('should throw McpError for non-string packageName', async () => {
      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({ packageName: 123 });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams, 'Missing required parameter: packageName');
      }
    });

    it('should throw McpError for empty string packageName', async () => {
      // Empty string is a valid string type, so it would pass validation and then fail in getLocalModulesMap
      const mockError = createMockError.standard('Invalid package name: empty string');
      mockGetLocalModulesMap.mockRejectedValue(mockError);

      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({ packageName: '' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InternalError, 'Failed to retrieve available modules');
      }
    });

    it('should handle valid nodeModulesRootPath when provided', async () => {
      const mockModulesMap = { 'Button': 'lib/Button/index.js' };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({
        packageName: '@patternfly/react-core',
        nodeModulesRootPath: '/valid/path'
      });

      expectMcpTool.toHaveValidResponse(result);
      expect(mockGetLocalModulesMap).toHaveBeenCalledWith('@patternfly/react-core', '/valid/path');
    });
  });

  describe('error handling', () => {
    it('should handle getLocalModulesMap errors and throw McpError with InternalError', async () => {
      const mockError = createMockError.standard('Package not found');
      mockGetLocalModulesMap.mockRejectedValue(mockError);

      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({ packageName: '@patternfly/react-core' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InternalError);
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain('Failed to retrieve available modules');
          expect(error.message).toContain('Package not found');
        } else {
          fail('Expected error to be McpError');
        }
      }
    });

    it('should handle file system errors from getLocalModulesMap', async () => {
      const fsError = createMockError.fileSystem('ENOENT', 'no such file or directory');
      mockGetLocalModulesMap.mockRejectedValue(fsError);

      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({ packageName: '@patternfly/react-core' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InternalError);
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain('Failed to retrieve available modules');
        } else {
          fail('Expected error to be McpError');
        }
      }
    });

    it('should handle permission errors from getLocalModulesMap', async () => {
      const permissionError = createMockError.fileSystem('EACCES', 'permission denied');
      mockGetLocalModulesMap.mockRejectedValue(permissionError);

      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({ packageName: '@patternfly/react-core' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InternalError);
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain('Failed to retrieve available modules');
          expect(error.message).toContain('EACCES: permission denied');
        } else {
          fail('Expected error to be McpError');
        }
      }
    });

    it('should handle non-Error objects thrown by getLocalModulesMap', async () => {
      const stringError = createMockError.nonError('String error from modules map');
      mockGetLocalModulesMap.mockRejectedValue(stringError);

      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({ packageName: '@patternfly/react-core' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InternalError);
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain('Failed to retrieve available modules');
          expect(error.message).toContain('String error from modules map');
        } else {
          fail('Expected error to be McpError');
        }
      }
    });

    it('should handle undefined error from getLocalModulesMap', async () => {
      mockGetLocalModulesMap.mockRejectedValue(undefined);

      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({ packageName: '@patternfly/react-core' });
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InternalError);
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain('Failed to retrieve available modules');
          expect(error.message).toContain('undefined');
        } else {
          fail('Expected error to be McpError');
        }
      }
    });
  });

  describe('valid package names', () => {
    const validPackages = [
      '@patternfly/react-core',
      '@patternfly/react-icons',
      '@patternfly/react-table',
      '@patternfly/react-data-view',
      '@patternfly/react-component-groups'
    ];

    validPackages.forEach(packageName => {
      it(`should accept ${packageName} as valid package name`, async () => {
        const mockModulesMap = { 'TestComponent': 'lib/TestComponent/index.js' };
        mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

        const [, , toolFunction] = getAvailableModulesTool();
        const result = await toolFunction({ packageName });

        expectMcpTool.toHaveValidResponse(result);
        expect(expectMcpTool.getTextContent(result)).toBe('TestComponent');
        expect(mockGetLocalModulesMap).toHaveBeenCalledWith(packageName, undefined);
      });
    });
  });

  describe('response format validation', () => {
    it('should always return content array with text type', async () => {
      const mockModulesMap = { 'Button': 'lib/Button/index.js' };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-core' });

      expectMcpTool.toHaveValidResponse(result);
    });

    it('should not include additional properties in response', async () => {
      const mockModulesMap = { 'Button': 'lib/Button/index.js' };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-core' });

      expectMcpTool.toHaveValidResponse(result);
      const expectedKeys = ['content'];
      expect(Object.keys(result)).toEqual(expectedKeys);
    });

    it('should return semicolon-separated string for multiple modules', async () => {
      const mockModulesMap = {
        'Button': 'lib/Button/index.js',
        'Card': 'lib/Card/index.js',
        'Modal': 'lib/Modal/index.js'
      };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-core' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toMatch(/^[^;]+(;[^;]+)*$/); // Validates semicolon-separated format
      expect(expectMcpTool.getTextContent(result).split(';')).toHaveLength(3);
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle very large modules map', async () => {
      const largeModulesMap: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeModulesMap[`Module${i}`] = `lib/Module${i}/index.js`;
      }
      mockGetLocalModulesMap.mockResolvedValue(largeModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-core' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result).split(';')).toHaveLength(1000);
    });

    it('should handle modules map with undefined values', async () => {
      const mockModulesMap: Record<string, any> = {
        'Button': 'lib/Button/index.js',
        'Card': undefined,
        'Modal': 'lib/Modal/index.js'
      };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-core' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe('Button;Card;Modal'); // Should still include keys even with undefined values
    });

    it('should handle modules map with null values', async () => {
      const mockModulesMap: Record<string, any> = {
        'Button': 'lib/Button/index.js',
        'Card': null,
        'Modal': 'lib/Modal/index.js'
      };
      mockGetLocalModulesMap.mockResolvedValue(mockModulesMap);

      const [, , toolFunction] = getAvailableModulesTool();
      const result = await toolFunction({ packageName: '@patternfly/react-core' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe('Button;Card;Modal'); // Should still include keys even with null values
    });

    it('should handle empty arguments object', async () => {
      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({});
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams);
      }
    });

    it('should handle missing arguments', async () => {
      const [, , toolFunction] = getAvailableModulesTool();

      try {
        await toolFunction({});
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InvalidParams);
      }
    });
  });
});