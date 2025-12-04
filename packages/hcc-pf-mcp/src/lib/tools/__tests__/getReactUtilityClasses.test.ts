// Mock the utility dependencies
const mockVerifyLocalPackage = jest.fn();
const mockReadFileAsync = jest.fn();

jest.mock('../../utils/verifyLocalPackage', () => ({
  verifyLocalPackage: mockVerifyLocalPackage
}));

jest.mock('../../utils/readFile', () => ({
  readFileAsync: mockReadFileAsync
}));

import { getReactUtilityClasses } from '../getReactUtilityClasses';
import {
  TEST_DATA,
  expectMcpTool,
  createMockError,
  errorTypeGuards
} from '../../__tests__/testUtils';

describe('getReactUtilityClasses', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // Set up default successful mock
    mockVerifyLocalPackage.mockResolvedValue({
      exists: true,
      packageRoot: '/node_modules/@patternfly/react-styles'
    });
  });

  describe('tool configuration', () => {
    it('should return tool configuration with correct name and schema', () => {
      const tool = getReactUtilityClasses();
      expectMcpTool.toHaveValidConfiguration(tool, 'getReactUtilityClasses');

      const [, config] = tool;
      expect(config.description).toContain('Retrieves a list of available Patternfly react-styles utility classes');
      expect(config.inputSchema.utilityName).toBeDefined();
      expect(config.inputSchema.nodeModulesRootPath).toBeDefined();
    });

    it('should have proper utility name enum values', () => {
      const [, config] = getReactUtilityClasses();
      const utilitySchema = config.inputSchema.utilityName;

      // Check that the schema accepts valid utility names
      expect(() => utilitySchema.parse('Accessibility')).not.toThrow();
      expect(() => utilitySchema.parse('Alignment')).not.toThrow();
      expect(() => utilitySchema.parse('BackgroundColor')).not.toThrow();
      expect(() => utilitySchema.parse('BoxShadow')).not.toThrow();
      expect(() => utilitySchema.parse('Display')).not.toThrow();
      expect(() => utilitySchema.parse('Flex')).not.toThrow();
      expect(() => utilitySchema.parse('Float')).not.toThrow();
      expect(() => utilitySchema.parse('Sizing')).not.toThrow();
      expect(() => utilitySchema.parse('Spacing')).not.toThrow();
      expect(() => utilitySchema.parse('Text')).not.toThrow();

      // Check that invalid values are rejected
      expect(() => utilitySchema.parse('InvalidUtility')).toThrow();
    });

    it('should have required utilityName parameter', () => {
      const [, config] = getReactUtilityClasses();
      const utilitySchema = config.inputSchema.utilityName;

      expect(() => utilitySchema.parse('Accessibility')).not.toThrow();
      expect(() => utilitySchema.parse(undefined)).toThrow();
    });

    it('should have optional nodeModulesRootPath parameter', () => {
      const [, config] = getReactUtilityClasses();
      const nodeModulesSchema = config.inputSchema.nodeModulesRootPath;

      expect(() => nodeModulesSchema.parse(undefined)).not.toThrow();
      expect(() => nodeModulesSchema.parse('/valid/path')).not.toThrow();
    });

    it('should have consistent configuration across multiple calls', () => {
      const [toolName1, config1, toolFunction1] = getReactUtilityClasses();
      const [toolName2, config2, toolFunction2] = getReactUtilityClasses();

      expect(toolName1).toBe(toolName2);
      expect(config1.description).toBe(config2.description);
      expect(typeof toolFunction1).toBe(typeof toolFunction2);
    });
  });

  describe('successful utility class retrieval', () => {
    it('should successfully retrieve and return accessibility utility classes', async () => {
      const cssContent = `.pf-u-screen-reader { position: absolute !important; }\n.pf-u-visible-on-sm { display: block !important; }`;
      mockReadFileAsync.mockResolvedValue(cssContent);

      const [, , toolFunction] = getReactUtilityClasses();
      const result = await toolFunction({ utilityName: 'Accessibility' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(cssContent);

      expect(mockVerifyLocalPackage).toHaveBeenCalledWith('@patternfly/react-styles', undefined);
      expect(mockReadFileAsync).toHaveBeenCalledWith(
        '/node_modules/@patternfly/react-styles/css/utilities/Accessibility/accessibility.css',
        'utf-8'
      );
    });

    it('should successfully retrieve alignment utility classes', async () => {
      const cssContent = `.pf-u-text-align-left { text-align: left !important; }\n.pf-u-text-align-center { text-align: center !important; }`;
      mockReadFileAsync.mockResolvedValue(cssContent);

      const [, , toolFunction] = getReactUtilityClasses();
      const result = await toolFunction({ utilityName: 'Alignment' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(cssContent);

      expect(mockReadFileAsync).toHaveBeenCalledWith(
        '/node_modules/@patternfly/react-styles/css/utilities/Alignment/alignment.css',
        'utf-8'
      );
    });

    it('should successfully retrieve background color utility classes', async () => {
      const cssContent = `.pf-u-background-color-100 { background-color: #fafafa !important; }`;
      mockReadFileAsync.mockResolvedValue(cssContent);

      const [, , toolFunction] = getReactUtilityClasses();
      const result = await toolFunction({ utilityName: 'BackgroundColor' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(cssContent);

      expect(mockReadFileAsync).toHaveBeenCalledWith(
        '/node_modules/@patternfly/react-styles/css/utilities/BackgroundColor/background-color.css',
        'utf-8'
      );
    });

    it('should handle different utility types with correct file paths', async () => {
      const cssContent = `.pf-u-shadow-sm { box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important; }`;
      mockReadFileAsync.mockResolvedValue(cssContent);

      const [, , toolFunction] = getReactUtilityClasses();
      await toolFunction({ utilityName: 'BoxShadow' });

      expect(mockReadFileAsync).toHaveBeenCalledWith(
        '/node_modules/@patternfly/react-styles/css/utilities/BoxShadow/box-shadow.css',
        'utf-8'
      );
    });

    it('should pass nodeModulesRootPath to verifyLocalPackage when provided', async () => {
      const customPath = '/custom/node_modules';
      const cssContent = `.pf-u-display-block { display: block !important; }`;

      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/custom/node_modules/@patternfly/react-styles'
      });
      mockReadFileAsync.mockResolvedValue(cssContent);

      const [, , toolFunction] = getReactUtilityClasses();
      await toolFunction({
        utilityName: 'Display',
        nodeModulesRootPath: customPath
      });

      expect(mockVerifyLocalPackage).toHaveBeenCalledWith('@patternfly/react-styles', customPath);
    });

    it('should use custom package root in file path when provided', async () => {
      const customPath = '/custom/node_modules';
      const cssContent = `.pf-u-flex { display: flex !important; }`;

      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/custom/node_modules/@patternfly/react-styles'
      });
      mockReadFileAsync.mockResolvedValue(cssContent);

      const [, , toolFunction] = getReactUtilityClasses();
      await toolFunction({
        utilityName: 'Flex',
        nodeModulesRootPath: customPath
      });

      expect(mockReadFileAsync).toHaveBeenCalledWith(
        '/custom/node_modules/@patternfly/react-styles/css/utilities/Flex/flex.css',
        'utf-8'
      );
    });

    it('should handle empty CSS file content', async () => {
      mockReadFileAsync.mockResolvedValue('');

      const [, , toolFunction] = getReactUtilityClasses();
      const result = await toolFunction({ utilityName: 'Float' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe('');
    });

    it('should handle large CSS file content', async () => {
      const largeCssContent = '/* Large CSS file */\n' + '.pf-u-class { property: value !important; }\n'.repeat(1000);
      mockReadFileAsync.mockResolvedValue(largeCssContent);

      const [, , toolFunction] = getReactUtilityClasses();
      const result = await toolFunction({ utilityName: 'Sizing' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(largeCssContent);
      expect(expectMcpTool.getTextContent(result).length).toBeGreaterThan(40000);
    });

    it('should handle CSS content with special characters', async () => {
      const specialCssContent = `/* CSS with special characters: éñïcödé, 中文, 🎯 */
.pf-u-special::before { content: "→"; }
.pf-u-unicode { font-family: "Noto Sans", sans-serif; }`;
      mockReadFileAsync.mockResolvedValue(specialCssContent);

      const [, , toolFunction] = getReactUtilityClasses();
      const result = await toolFunction({ utilityName: 'Spacing' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(specialCssContent);
    });
  });

  describe('input validation', () => {
    it('should throw Error for missing utilityName', async () => {
      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({});
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Invalid or missing parameter: utilityName');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should throw Error for null utilityName', async () => {
      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: null });
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Invalid or missing parameter: utilityName');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should throw Error for undefined utilityName', async () => {
      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: undefined });
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Invalid or missing parameter: utilityName');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should throw Error for non-string utilityName', async () => {
      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 123 });
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Invalid or missing parameter: utilityName');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should throw Error for empty string utilityName', async () => {
      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: '' });
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Invalid or missing parameter: utilityName');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should throw Error for invalid utilityName not in enum', async () => {
      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'InvalidUtility' });
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Invalid or missing parameter: utilityName');
          expect(error.message).toContain('must be one of');
          expect(error.message).toContain('Accessibility');
          expect(error.message).toContain('Text');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should include all valid utility names in error message for invalid input', async () => {
      const [, , toolFunction] = getReactUtilityClasses();

      const validUtilities = [
        'Accessibility', 'Alignment', 'BackgroundColor', 'BoxShadow',
        'Display', 'Flex', 'Float', 'Sizing', 'Spacing', 'Text'
      ];

      try {
        await toolFunction({ utilityName: 'WrongName' });
        fail('Expected function to throw Error');
      } catch (error) {
        if (errorTypeGuards.isError(error)) {
          const errorMessage = error.message;
          validUtilities.forEach(utility => {
            expect(errorMessage).toContain(utility);
          });
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should be case-sensitive for utility names', async () => {
      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'accessibility' }); // lowercase
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Invalid or missing parameter: utilityName');
        } else {
          fail('Expected error to be Error');
        }
      }

      try {
        await toolFunction({ utilityName: 'ACCESSIBILITY' }); // uppercase
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Invalid or missing parameter: utilityName');
        } else {
          fail('Expected error to be Error');
        }
      }
    });
  });

  describe('package verification', () => {
    it('should throw Error when @patternfly/react-styles package does not exist', async () => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: false,
        error: new Error('Package not found')
      });

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'Accessibility' });
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Package "@patternfly/react-styles" not found locally');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should include error message when package verification fails', async () => {
      const mockError = new Error('Permission denied accessing package');
      mockVerifyLocalPackage.mockResolvedValue({
        exists: false,
        error: mockError
      });

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'Alignment' });
        fail('Expected function to throw Error');
      } catch (error) {
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Package "@patternfly/react-styles" not found locally');
          expect(error.message).toContain('Permission denied accessing package');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should handle package verification with undefined error', async () => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: false,
        error: undefined
      });

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'BackgroundColor' });
        fail('Expected function to throw Error');
      } catch (error) {
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Package "@patternfly/react-styles" not found locally');
          // Should not include undefined in message
          expect(error.message).not.toContain('undefined');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should handle package verification with null error', async () => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: false,
        error: null
      });

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'BoxShadow' });
        fail('Expected function to throw Error');
      } catch (error) {
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Package "@patternfly/react-styles" not found locally');
          expect(error.message).not.toContain('null');
        } else {
          fail('Expected error to be Error');
        }
      }
    });
  });

  describe('CSS file reading', () => {
    beforeEach(() => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-styles'
      });
    });

    it('should throw Error when CSS file cannot be read', async () => {
      const fsError = createMockError.fileSystem('ENOENT', 'no such file or directory');
      mockReadFileAsync.mockRejectedValue(fsError);

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'Display' });
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Failed to read utility classes file for "Display"');
          expect(error.message).toContain('ENOENT: no such file or directory');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should throw Error when CSS file access is denied', async () => {
      const permissionError = createMockError.fileSystem('EACCES', 'permission denied');
      mockReadFileAsync.mockRejectedValue(permissionError);

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'Flex' });
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Failed to read utility classes file for "Flex"');
          expect(error.message).toContain('EACCES: permission denied');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should include full file path in error message when file read fails', async () => {
      const fsError = createMockError.standard('File read error');
      mockReadFileAsync.mockRejectedValue(fsError);

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'Float' });
        fail('Expected function to throw Error');
      } catch (error) {
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Failed to read utility classes file for "Float"');
          expect(error.message).toContain('/node_modules/@patternfly/react-styles/css/utilities/Float/float.css');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should handle non-Error objects thrown during file reading', async () => {
      const stringError = createMockError.nonError('String error from file system');
      mockReadFileAsync.mockRejectedValue(stringError);

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'Sizing' });
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Failed to read utility classes file for "Sizing"');
          // Non-Error objects won't have their message included in the error message
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should handle undefined error from file reading', async () => {
      mockReadFileAsync.mockRejectedValue(undefined);

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'Spacing' });
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Failed to read utility classes file for "Spacing"');
          expect(error.message).not.toContain('undefined');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should handle Error objects without message property', async () => {
      const errorWithoutMessage = Object.create(Error.prototype);
      mockReadFileAsync.mockRejectedValue(errorWithoutMessage);

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'Text' });
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Failed to read utility classes file for "Text"');
        } else {
          fail('Expected error to be Error');
        }
      }
    });
  });

  describe('all valid utility names', () => {
    const validUtilities = [
      'Accessibility',
      'Alignment',
      'BackgroundColor',
      'BoxShadow',
      'Display',
      'Flex',
      'Float',
      'Sizing',
      'Spacing',
      'Text'
    ];

    validUtilities.forEach(utilityName => {
      it(`should successfully process ${utilityName} utility`, async () => {
        const cssContent = `.pf-u-${utilityName.toLowerCase()} { property: value !important; }`;
        mockReadFileAsync.mockResolvedValue(cssContent);

        const [, , toolFunction] = getReactUtilityClasses();
        const result = await toolFunction({ utilityName });

        expectMcpTool.toHaveValidResponse(result);
        expect(expectMcpTool.getTextContent(result)).toBe(cssContent);
        expect(mockVerifyLocalPackage).toHaveBeenCalledWith('@patternfly/react-styles', undefined);
      });

      it(`should use correct file path for ${utilityName} utility`, async () => {
        mockReadFileAsync.mockResolvedValue('.test {}');

        const [, , toolFunction] = getReactUtilityClasses();
        await toolFunction({ utilityName });

        const expectedPaths = {
          'Accessibility': 'css/utilities/Accessibility/accessibility.css',
          'Alignment': 'css/utilities/Alignment/alignment.css',
          'BackgroundColor': 'css/utilities/BackgroundColor/background-color.css',
          'BoxShadow': 'css/utilities/BoxShadow/box-shadow.css',
          'Display': 'css/utilities/Display/display.css',
          'Flex': 'css/utilities/Flex/flex.css',
          'Float': 'css/utilities/Float/float.css',
          'Sizing': 'css/utilities/Sizing/sizing.css',
          'Spacing': 'css/utilities/Spacing/spacing.css',
          'Text': 'css/utilities/Text/text.css'
        };

        const expectedPath = `/node_modules/@patternfly/react-styles/${expectedPaths[utilityName]}`;
        expect(mockReadFileAsync).toHaveBeenCalledWith(expectedPath, 'utf-8');
      });
    });
  });

  describe('response format validation', () => {
    beforeEach(() => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: '/node_modules/@patternfly/react-styles'
      });
    });

    it('should always return content array with text type', async () => {
      const cssContent = `.pf-u-test { color: red !important; }`;
      mockReadFileAsync.mockResolvedValue(cssContent);

      const [, , toolFunction] = getReactUtilityClasses();
      const result = await toolFunction({ utilityName: 'Accessibility' });

      expectMcpTool.toHaveValidResponse(result);
    });

    it('should not include additional properties in response', async () => {
      const cssContent = `.pf-u-test { color: blue !important; }`;
      mockReadFileAsync.mockResolvedValue(cssContent);

      const [, , toolFunction] = getReactUtilityClasses();
      const result = await toolFunction({ utilityName: 'Alignment' });

      expectMcpTool.toHaveValidResponse(result);
      const expectedKeys = ['content'];
      expect(Object.keys(result)).toEqual(expectedKeys);
    });

    it('should preserve exact CSS content without modification', async () => {
      const complexCssContent = `/* Complex CSS with formatting */
.pf-u-complex {
  color: #ffffff !important;
  background: linear-gradient(45deg, #ff0000, #00ff00) !important;
}

@media (min-width: 768px) {
  .pf-u-responsive {
    display: flex !important;
  }
}`;
      mockReadFileAsync.mockResolvedValue(complexCssContent);

      const [, , toolFunction] = getReactUtilityClasses();
      const result = await toolFunction({ utilityName: 'BackgroundColor' });

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(complexCssContent);
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle missing arguments object', async () => {
      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({});
        fail('Expected function to throw Error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Invalid or missing parameter: utilityName');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should handle very long nodeModulesRootPath', async () => {
      const longPath = '/very/long/path/' + 'nested/'.repeat(100) + 'node_modules';

      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: longPath + '/@patternfly/react-styles'
      });
      mockReadFileAsync.mockResolvedValue('.test {}');

      const [, , toolFunction] = getReactUtilityClasses();
      const result = await toolFunction({
        utilityName: 'Display',
        nodeModulesRootPath: longPath
      });

      expectMcpTool.toHaveValidResponse(result);
      expect(mockVerifyLocalPackage).toHaveBeenCalledWith('@patternfly/react-styles', longPath);
    });

    it('should handle special characters in nodeModulesRootPath', async () => {
      const specialPath = '/path with spaces/special@chars#123/node_modules';

      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: specialPath + '/@patternfly/react-styles'
      });
      mockReadFileAsync.mockResolvedValue('.test {}');

      const [, , toolFunction] = getReactUtilityClasses();
      const result = await toolFunction({
        utilityName: 'Flex',
        nodeModulesRootPath: specialPath
      });

      expectMcpTool.toHaveValidResponse(result);
      expect(mockVerifyLocalPackage).toHaveBeenCalledWith('@patternfly/react-styles', specialPath);
    });

    it('should handle error propagation from verifyLocalPackage', async () => {
      const packageError = createMockError.standard('Network error during package verification');
      mockVerifyLocalPackage.mockRejectedValue(packageError);

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'Float' });
        fail('Expected function to throw error');
      } catch (error) {
        if (errorTypeGuards.isError(error)) {
          expect(error.message).toContain('Network error during package verification');
        } else {
          fail('Expected error to be Error');
        }
      }
    });

    it('should handle malformed package verification response', async () => {
      mockVerifyLocalPackage.mockResolvedValue({
        exists: true,
        packageRoot: undefined // Malformed response
      });

      const [, , toolFunction] = getReactUtilityClasses();

      try {
        await toolFunction({ utilityName: 'Sizing' });
        fail('Expected function to throw error');
      } catch (error) {
        // Should fail when trying to construct the file path
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});