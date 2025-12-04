import { getDescriptionTool } from '../description';
import { cachedFetch } from '../../cachedFetch';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import {
  TEST_DATA,
  expectMcpTool,
  createMockError,
  validateUrl,
  validateContent,
  errorTypeGuards
} from '../../__tests__/testUtils';

// Mock the cachedFetch function
jest.mock('../../cachedFetch', () => ({
  cachedFetch: jest.fn()
}));

const mockedCachedFetch = cachedFetch as jest.MockedFunction<typeof cachedFetch>;

describe('getDescriptionTool', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('tool configuration', () => {
    it('should return tool configuration with correct name and description', () => {
      const tool = getDescriptionTool();
      expectMcpTool.toHaveValidConfiguration(tool, 'getPatternFlyDataViewDescription');

      const [, config] = tool;
      expect(config.description).toBe('Get a description of the @patternfly/react-data-view package and its capabilities for building advanced data tables with PatternFly.');
      expect(config.inputSchema).toEqual({});
    });

    it('should return consistent tool configuration across multiple calls', () => {
      const tool1 = getDescriptionTool();
      const tool2 = getDescriptionTool();

      expectMcpTool.toHaveValidConfiguration(tool1, 'getPatternFlyDataViewDescription');
      expectMcpTool.toHaveValidConfiguration(tool2, 'getPatternFlyDataViewDescription');

      const [toolName1, config1] = tool1;
      const [toolName2, config2] = tool2;

      expect(toolName1).toBe(toolName2);
      expect(config1).toEqual(config2);
    });
  });

  describe('successful operations', () => {
    it('should successfully fetch and return description with markdown content', async () => {
      const mockDescription = TEST_DATA.MARKDOWN.WITH_CODE;
      mockedCachedFetch.mockResolvedValue(mockDescription);

      const [, , toolFunction] = getDescriptionTool();
      const result = await toolFunction({});

      const expectedUrl = 'https://raw.githubusercontent.com/patternfly/react-data-view/refs/heads/main/packages/module/patternfly-docs/content/extensions/data-view/examples/DataView/DataView.md';
      expect(mockedCachedFetch).toHaveBeenCalledWith(expectedUrl);
      expect(validateUrl.isPatternFlyDocsUrl(expectedUrl)).toBe(true);

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(mockDescription);
      expect(validateContent.isValidMarkdown(mockDescription)).toBe(true);
    });

    it('should handle empty documentation content', async () => {
      const emptyDescription = TEST_DATA.MARKDOWN.EMPTY;
      mockedCachedFetch.mockResolvedValue(emptyDescription);

      const [, , toolFunction] = getDescriptionTool();
      const result = await toolFunction({});

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(emptyDescription);
    });

    it('should handle very large documentation content', async () => {
      const largeDescription = TEST_DATA.MARKDOWN.LARGE;
      mockedCachedFetch.mockResolvedValue(largeDescription);

      const [, , toolFunction] = getDescriptionTool();
      const result = await toolFunction({});

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toHaveLength(largeDescription.length);
      expect(validateContent.isPreserved(largeDescription, expectMcpTool.getTextContent(result))).toBe(true);
      expect(validateContent.isValidMarkdown(largeDescription)).toBe(true);
    });

    it('should handle documentation with special characters and encoding', async () => {
      const specialDescription = TEST_DATA.MARKDOWN.WITH_EMOJI;
      mockedCachedFetch.mockResolvedValue(specialDescription);

      const [, , toolFunction] = getDescriptionTool();
      const result = await toolFunction({});

      expectMcpTool.toHaveValidResponse(result);
      expect(expectMcpTool.getTextContent(result)).toBe(specialDescription);
      expect(validateContent.hasSpecialCharacters(expectMcpTool.getTextContent(result))).toBe(true);
      expect(validateContent.isPreserved(specialDescription, expectMcpTool.getTextContent(result))).toBe(true);
    });

    it('should call cachedFetch only once per execution', async () => {
      const mockDescription = '# Mock Description';
      mockedCachedFetch.mockResolvedValue(mockDescription);

      const [, , toolFunction] = getDescriptionTool();
      await toolFunction({});

      expect(mockedCachedFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should throw McpError when fetch fails with network error', async () => {
      const mockError = createMockError.standard(TEST_DATA.ERRORS.NETWORK);
      mockedCachedFetch.mockRejectedValue(mockError);

      const [, , toolFunction] = getDescriptionTool();

      await expect(toolFunction({})).rejects.toThrow(`Failed to fetch data view description: ${TEST_DATA.ERRORS.NETWORK}`);
    });

    it('should throw McpError when fetch fails with timeout', async () => {
      const timeoutError = createMockError.standard(TEST_DATA.ERRORS.TIMEOUT);
      mockedCachedFetch.mockRejectedValue(timeoutError);

      const [, , toolFunction] = getDescriptionTool();

      await expect(toolFunction({})).rejects.toThrow(`Failed to fetch data view description: ${TEST_DATA.ERRORS.TIMEOUT}`);
    });

    it('should throw McpError when fetch fails with 404 error', async () => {
      const notFoundError = createMockError.standard(TEST_DATA.ERRORS.NOT_FOUND);
      mockedCachedFetch.mockRejectedValue(notFoundError);

      const [, , toolFunction] = getDescriptionTool();

      await expect(toolFunction({})).rejects.toThrow(`Failed to fetch data view description: ${TEST_DATA.ERRORS.NOT_FOUND}`);
    });

    it('should throw McpError when fetch fails with 500 error', async () => {
      const serverError = createMockError.standard(TEST_DATA.ERRORS.SERVER_ERROR);
      mockedCachedFetch.mockRejectedValue(serverError);

      const [, , toolFunction] = getDescriptionTool();

      await expect(toolFunction({})).rejects.toThrow(`Failed to fetch data view description: ${TEST_DATA.ERRORS.SERVER_ERROR}`);
    });

    it('should preserve original error message in McpError', async () => {
      const customMessage = 'Custom error message with details';
      const originalError = createMockError.standard(customMessage);
      mockedCachedFetch.mockRejectedValue(originalError);

      const [, , toolFunction] = getDescriptionTool();

      try {
        await toolFunction({});
        fail('Expected function to throw McpError');
      } catch (error) {
        expectMcpTool.toBeValidMcpError(error, ErrorCode.InternalError);
        if (errorTypeGuards.isMcpError(error)) {
          expect(error.message).toContain(`Failed to fetch data view description: ${customMessage}`);
        } else {
          fail('Expected error to be McpError');
        }
      }
    });

    it('should handle non-Error objects being thrown', async () => {
      const nonErrorObject = createMockError.nonError('String error');
      mockedCachedFetch.mockRejectedValue(nonErrorObject);

      const [, , toolFunction] = getDescriptionTool();

      await expect(toolFunction({})).rejects.toThrow('Failed to fetch data view description:');
    });

    it('should handle undefined error objects', async () => {
      mockedCachedFetch.mockRejectedValue(undefined);

      const [, , toolFunction] = getDescriptionTool();

      await expect(toolFunction({})).rejects.toThrow('Failed to fetch data view description: undefined');
    });
  });

  describe('input parameter handling', () => {
    it('should accept empty object as input', async () => {
      const mockDescription = '# Test Description';
      mockedCachedFetch.mockResolvedValue(mockDescription);

      const [, , toolFunction] = getDescriptionTool();
      const result = await toolFunction({});

      expect(expectMcpTool.getTextContent(result)).toBe(mockDescription);
    });

    it('should ignore additional input parameters', async () => {
      const mockDescription = '# Test Description';
      mockedCachedFetch.mockResolvedValue(mockDescription);

      const [, , toolFunction] = getDescriptionTool();
      const result = await toolFunction({
        unexpectedParam: 'value',
        anotherParam: 123
      });

      expect(expectMcpTool.getTextContent(result)).toBe(mockDescription);
      expect(mockedCachedFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle null input gracefully', async () => {
      const mockDescription = '# Test Description';
      mockedCachedFetch.mockResolvedValue(mockDescription);

      const [, , toolFunction] = getDescriptionTool();
      const result = await toolFunction(null);

      expect(expectMcpTool.getTextContent(result)).toBe(mockDescription);
    });

    it('should handle undefined input gracefully', async () => {
      const mockDescription = '# Test Description';
      mockedCachedFetch.mockResolvedValue(mockDescription);

      const [, , toolFunction] = getDescriptionTool();
      const result = await toolFunction(undefined);

      expect(expectMcpTool.getTextContent(result)).toBe(mockDescription);
    });
  });

  describe('URL and endpoint validation', () => {
    it('should call the correct GitHub raw content URL', async () => {
      const mockDescription = '# Test Description';
      mockedCachedFetch.mockResolvedValue(mockDescription);

      const [, , toolFunction] = getDescriptionTool();
      await toolFunction({});

      const expectedUrl = 'https://raw.githubusercontent.com/patternfly/react-data-view/refs/heads/main/packages/module/patternfly-docs/content/extensions/data-view/examples/DataView/DataView.md';
      expect(mockedCachedFetch).toHaveBeenCalledWith(expectedUrl);
    });

    it('should not modify the URL or add parameters', async () => {
      const mockDescription = '# Test Description';
      mockedCachedFetch.mockResolvedValue(mockDescription);

      const [, , toolFunction] = getDescriptionTool();
      await toolFunction({});

      expect(mockedCachedFetch).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/raw\.githubusercontent\.com\/patternfly\/react-data-view\/refs\/heads\/main\/packages\/module\/patternfly-docs\/content\/extensions\/data-view\/examples\/DataView\/DataView\.md$/)
      );
    });
  });

  describe('response format validation', () => {
    it('should always return content array with text type', async () => {
      const mockDescription = TEST_DATA.MARKDOWN.SIMPLE;
      mockedCachedFetch.mockResolvedValue(mockDescription);

      const [, , toolFunction] = getDescriptionTool();
      const result = await toolFunction({});

      expectMcpTool.toHaveValidResponse(result);
    });

    it('should not include any additional properties in response', async () => {
      const mockDescription = TEST_DATA.MARKDOWN.SIMPLE;
      mockedCachedFetch.mockResolvedValue(mockDescription);

      const [, , toolFunction] = getDescriptionTool();
      const result = await toolFunction({});

      expectMcpTool.toHaveValidResponse(result);
      const expectedKeys = ['content'];
      expect(Object.keys(result)).toEqual(expectedKeys);
    });

    it('should not modify the fetched content', async () => {
      const originalDescription = TEST_DATA.MARKDOWN.SPECIAL_CHARS;
      mockedCachedFetch.mockResolvedValue(originalDescription);

      const [, , toolFunction] = getDescriptionTool();
      const result = await toolFunction({});

      expectMcpTool.toHaveValidResponse(result);
      expect(validateContent.isPreserved(originalDescription, expectMcpTool.getTextContent(result))).toBe(true);
    });
  });
});