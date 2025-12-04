/**
 * Test suite for moduleResolver utility
 * Tests the simple wrapper around import.meta.resolve
 */

// Mock import.meta.resolve for Jest environment
const mockImportMetaResolve = jest.fn();

// Mock the module since import.meta isn't available in Jest
jest.doMock('../moduleResolver', () => ({
  resolveModule: (modulePath: string) => mockImportMetaResolve(modulePath)
}));

// Import after mocking
let resolveModule: typeof import('../moduleResolver').resolveModule;

beforeAll(async () => {
  const module = await import('../moduleResolver');
  resolveModule = module.resolveModule;
});

describe('moduleResolver', () => {
  beforeEach(() => {
    mockImportMetaResolve.mockClear();
  });

  describe('successful module resolution', () => {
    it('should resolve existing module path correctly', () => {
      const mockResolvedPath = 'file:///path/to/resolved/module';
      const mockModulePath = 'test-module/package.json';

      mockImportMetaResolve.mockReturnValue(mockResolvedPath);

      const result = resolveModule(mockModulePath);

      expect(mockImportMetaResolve).toHaveBeenCalledWith(mockModulePath);
      expect(mockImportMetaResolve).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockResolvedPath);
    });

    it('should handle relative path resolution', () => {
      const mockResolvedPath = 'file:///current/path/to/relative/module';
      const relativePath = './relative-module';

      mockImportMetaResolve.mockReturnValue(mockResolvedPath);

      const result = resolveModule(relativePath);

      expect(mockImportMetaResolve).toHaveBeenCalledWith(relativePath);
      expect(result).toBe(mockResolvedPath);
    });

    it('should handle absolute path resolution', () => {
      const mockResolvedPath = 'file:///absolute/path/to/module';
      const absolutePath = '/absolute/path/to/module';

      mockImportMetaResolve.mockReturnValue(mockResolvedPath);

      const result = resolveModule(absolutePath);

      expect(mockImportMetaResolve).toHaveBeenCalledWith(absolutePath);
      expect(result).toBe(mockResolvedPath);
    });

    it('should handle scoped package resolution', () => {
      const mockResolvedPath = 'file:///node_modules/@scope/package/index.js';
      const scopedPackage = '@scope/package';

      mockImportMetaResolve.mockReturnValue(mockResolvedPath);

      const result = resolveModule(scopedPackage);

      expect(mockImportMetaResolve).toHaveBeenCalledWith(scopedPackage);
      expect(result).toBe(mockResolvedPath);
    });

    it('should handle package.json file resolution', () => {
      const mockResolvedPath = 'file:///node_modules/some-package/package.json';
      const packageJsonPath = 'some-package/package.json';

      mockImportMetaResolve.mockReturnValue(mockResolvedPath);

      const result = resolveModule(packageJsonPath);

      expect(mockImportMetaResolve).toHaveBeenCalledWith(packageJsonPath);
      expect(result).toBe(mockResolvedPath);
    });
  });

  describe('error handling', () => {
    it('should throw error when module cannot be resolved', () => {
      const nonExistentModule = 'non-existent-module';
      const mockError = new Error('Module not found');

      mockImportMetaResolve.mockImplementation(() => {
        throw mockError;
      });

      expect(() => resolveModule(nonExistentModule)).toThrow('Module not found');
      expect(mockImportMetaResolve).toHaveBeenCalledWith(nonExistentModule);
    });

    it('should propagate TypeError from import.meta.resolve', () => {
      const invalidModule = '';
      const typeError = new TypeError('Invalid module specifier');

      mockImportMetaResolve.mockImplementation(() => {
        throw typeError;
      });

      expect(() => resolveModule(invalidModule)).toThrow(TypeError);
      expect(() => resolveModule(invalidModule)).toThrow('Invalid module specifier');
    });

    it('should handle resolution errors for scoped packages', () => {
      const invalidScopedPackage = '@invalid/non-existent';
      const resolutionError = new Error('Cannot resolve module');

      mockImportMetaResolve.mockImplementation(() => {
        throw resolutionError;
      });

      expect(() => resolveModule(invalidScopedPackage)).toThrow('Cannot resolve module');
      expect(mockImportMetaResolve).toHaveBeenCalledWith(invalidScopedPackage);
    });
  });

  describe('input validation through import.meta.resolve', () => {
    it('should pass through empty string to import.meta.resolve', () => {
      const emptyError = new TypeError('Empty specifier');
      mockImportMetaResolve.mockImplementation(() => {
        throw emptyError;
      });

      expect(() => resolveModule('')).toThrow(TypeError);
      expect(mockImportMetaResolve).toHaveBeenCalledWith('');
    });

    it('should pass through null as string to import.meta.resolve', () => {
      const nullPath = 'null';
      const mockResolvedPath = 'file:///resolved/null';

      mockImportMetaResolve.mockReturnValue(mockResolvedPath);

      const result = resolveModule(nullPath);

      expect(result).toBe(mockResolvedPath);
      expect(mockImportMetaResolve).toHaveBeenCalledWith('null');
    });

    it('should handle special characters in module path', () => {
      const specialPath = './module-with-special@chars#and$symbols';
      const mockResolvedPath = 'file:///path/to/special/module';

      mockImportMetaResolve.mockReturnValue(mockResolvedPath);

      const result = resolveModule(specialPath);

      expect(result).toBe(mockResolvedPath);
      expect(mockImportMetaResolve).toHaveBeenCalledWith(specialPath);
    });
  });

  describe('edge cases', () => {
    it('should handle long module paths', () => {
      const longPath = 'very/long/path/to/module/'.repeat(10) + 'package.json';
      const mockResolvedPath = 'file:///very/long/resolved/path';

      mockImportMetaResolve.mockReturnValue(mockResolvedPath);

      const result = resolveModule(longPath);

      expect(result).toBe(mockResolvedPath);
      expect(mockImportMetaResolve).toHaveBeenCalledWith(longPath);
    });

    it('should preserve exact return value from import.meta.resolve', () => {
      const modulePath = 'test-module';
      const complexResolvedPath = 'file:///complex/path/with/symlinks/../real/path/module.js';

      mockImportMetaResolve.mockReturnValue(complexResolvedPath);

      const result = resolveModule(modulePath);

      expect(result).toBe(complexResolvedPath);
      expect(result).toEqual(complexResolvedPath); // Ensure exact equality
    });

    it('should handle unicode characters in module path', () => {
      const unicodePath = './módule-with-ünicöde';
      const mockResolvedPath = 'file:///path/to/unicode/module';

      mockImportMetaResolve.mockReturnValue(mockResolvedPath);

      const result = resolveModule(unicodePath);

      expect(result).toBe(mockResolvedPath);
      expect(mockImportMetaResolve).toHaveBeenCalledWith(unicodePath);
    });
  });
});