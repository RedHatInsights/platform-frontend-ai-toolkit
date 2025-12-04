import { getLocalModulesMap } from '../getLocalModulesMap';
import { createMockError } from '../../__tests__/testUtils';

/**
 * Test suite for getLocalModulesMap utility
 * Tests complex caching functionality and package resolution
 */

// Mock dependencies
const mockReadJsonFile = jest.fn();
const mockVerifyLocalPackage = jest.fn();

jest.mock('../readFile', () => ({
  readJsonFile: mockReadJsonFile
}));

jest.mock('../verifyLocalPackage', () => ({
  verifyLocalPackage: mockVerifyLocalPackage
}));

// Import after mocking
let getLocalModulesMapModule: typeof import('../getLocalModulesMap');

beforeAll(async () => {
  getLocalModulesMapModule = await import('../getLocalModulesMap');
});

describe('getLocalModulesMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the internal module cache by calling the module cache clear method indirectly
    try {
      const modulesCache = (getLocalModulesMapModule as any).modulesCache;
      if (modulesCache && typeof modulesCache.clear === 'function') {
        modulesCache.clear();
      }
    } catch {
      // Ignore if we can't access internal cache
    }
    // Reset Date.now for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(1000000); // Fixed timestamp
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('successful module resolution with caching', () => {
    it('should resolve modules map and cache result', async () => {
      const packageName = 'test-package';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/test-package'
      };
      const mockModulesMap = {
        'Component1': 'dist/Component1.js',
        'Component2': 'dist/Component2.js',
        'utils': 'dist/utils/index.js'
      };

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockResolvedValue(mockModulesMap);

      const result = await getLocalModulesMapModule.getLocalModulesMap(packageName);

      expect(mockVerifyLocalPackage).toHaveBeenCalledWith(packageName, undefined);
      expect(mockReadJsonFile).toHaveBeenCalledWith('/path/to/test-package/dist/dynamic-modules.json');
      expect(result).toEqual(mockModulesMap);
    });

    it('should use cached result on subsequent calls', async () => {
      const packageName = 'cached-package';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/cached-package'
      };
      const mockModulesMap = {
        'CachedComponent': 'dist/CachedComponent.js'
      };

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockResolvedValue(mockModulesMap);

      // First call - should read from file system
      const result1 = await getLocalModulesMapModule.getLocalModulesMap(packageName);

      // Clear mocks to verify cache usage
      jest.clearAllMocks();

      // Second call - should use cache
      const result2 = await getLocalModulesMapModule.getLocalModulesMap(packageName);

      expect(mockVerifyLocalPackage).toHaveBeenCalledTimes(1); // Only called once due to cache
      expect(mockReadJsonFile).not.toHaveBeenCalled(); // Not called on cached result
      expect(result1).toEqual(mockModulesMap);
      expect(result2).toEqual(mockModulesMap);
      expect(result1).toEqual(result2);
    });

    it('should handle scoped package names with caching', async () => {
      const packageName = '@scope/scoped-package';
      const mockStatus = {
        exists: true,
        version: '2.0.0-beta.1',
        packageRoot: '/path/to/node_modules/@scope/scoped-package'
      };
      const mockModulesMap = {
        'ScopedComponent': 'dist/ScopedComponent.js'
      };

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockResolvedValue(mockModulesMap);

      const result = await getLocalModulesMapModule.getLocalModulesMap(packageName);

      expect(result).toEqual(mockModulesMap);
      expect(mockReadJsonFile).toHaveBeenCalledWith('/path/to/node_modules/@scope/scoped-package/dist/dynamic-modules.json');
    });

    it('should use provided nodeModulesRootPath', async () => {
      const packageName = 'custom-path-package';
      const customPath = '/custom/node_modules';
      const mockStatus = {
        exists: true,
        version: '3.0.0',
        packageRoot: '/custom/node_modules/custom-path-package'
      };
      const mockModulesMap = {
        'CustomComponent': 'dist/CustomComponent.js'
      };

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockResolvedValue(mockModulesMap);

      const result = await getLocalModulesMapModule.getLocalModulesMap(packageName, customPath);

      expect(mockVerifyLocalPackage).toHaveBeenCalledWith(packageName, customPath);
      expect(result).toEqual(mockModulesMap);
    });
  });

  describe('error handling', () => {
    it('should throw error when package does not exist', async () => {
      const packageName = 'non-existent-package';
      const mockStatus = {
        exists: false,
        version: '',
        packageRoot: '',
        error: new Error('Package not found')
      };

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);

      await expect(getLocalModulesMapModule.getLocalModulesMap(packageName))
        .rejects
        .toThrow('Package "non-existent-package" not found locally. Package not found');

      expect(mockReadJsonFile).not.toHaveBeenCalled();
    });

    it('should throw error when package verification fails', async () => {
      const packageName = 'verification-fail-package';
      const mockStatus = {
        exists: false,
        version: '',
        packageRoot: '',
        error: new Error('Resolution failed')
      };

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);

      await expect(getLocalModulesMapModule.getLocalModulesMap(packageName))
        .rejects
        .toThrow('Package "verification-fail-package" not found locally. Resolution failed');
    });

    it('should throw error when modules map file cannot be read', async () => {
      const packageName = 'read-error-package';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/read-error-package'
      };
      const fileError = createMockError.fileSystem('ENOENT', 'no such file or directory');

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockRejectedValue(fileError);

      await expect(getLocalModulesMapModule.getLocalModulesMap(packageName))
        .rejects
        .toThrow('Failed to import modules map from package "read-error-package": Error: ENOENT: no such file or directory. Does the modules map exist?');
    });

    it('should throw error when JSON parsing fails', async () => {
      const packageName = 'json-error-package';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/json-error-package'
      };
      const jsonError = new SyntaxError('Unexpected token in JSON');

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockRejectedValue(jsonError);

      await expect(getLocalModulesMapModule.getLocalModulesMap(packageName))
        .rejects
        .toThrow('Failed to import modules map from package "json-error-package": SyntaxError: Unexpected token in JSON. Does the modules map exist?');
    });

    it('should handle permission errors gracefully', async () => {
      const packageName = 'permission-error-package';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/restricted/permission-error-package'
      };
      const permissionError = createMockError.fileSystem('EACCES', 'permission denied');

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockRejectedValue(permissionError);

      await expect(getLocalModulesMapModule.getLocalModulesMap(packageName))
        .rejects
        .toThrow('Failed to import modules map from package "permission-error-package": Error: EACCES: permission denied. Does the modules map exist?');
    });
  });

  describe('caching functionality', () => {
    it('should cache results and not refetch for subsequent calls', async () => {
      const packageName = 'cache-test-package';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/cache-test-package'
      };
      const mockModulesMap = {
        'CachedComponent': 'dist/CachedComponent.js'
      };

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockResolvedValue(mockModulesMap);

      // First call
      const result1 = await getLocalModulesMapModule.getLocalModulesMap(packageName);
      expect(result1).toEqual(mockModulesMap);
      expect(mockVerifyLocalPackage).toHaveBeenCalledTimes(1);
      expect(mockReadJsonFile).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await getLocalModulesMapModule.getLocalModulesMap(packageName);
      expect(result2).toEqual(mockModulesMap);
      expect(mockVerifyLocalPackage).toHaveBeenCalledTimes(2); // verifyLocalPackage called again
      expect(mockReadJsonFile).toHaveBeenCalledTimes(1); // readJsonFile not called again (cached)
    });

    it('should maintain separate cache entries for different packages', async () => {
      const packageName1 = 'cache-package-1';
      const packageName2 = 'cache-package-2';

      const mockStatus1 = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/cache-package-1'
      };
      const mockStatus2 = {
        exists: true,
        version: '2.0.0',
        packageRoot: '/path/to/cache-package-2'
      };

      const mockModulesMap1 = { 'Component1': 'dist/Component1.js' };
      const mockModulesMap2 = { 'Component2': 'dist/Component2.js' };

      // Setup mocks to return different values for different packages
      mockVerifyLocalPackage.mockImplementation((packageName) => {
        if (packageName === packageName1) return Promise.resolve(mockStatus1);
        if (packageName === packageName2) return Promise.resolve(mockStatus2);
        return Promise.resolve({ exists: false, version: '', packageRoot: '' });
      });

      mockReadJsonFile.mockImplementation((filePath) => {
        if (filePath.includes('cache-package-1')) return Promise.resolve(mockModulesMap1);
        if (filePath.includes('cache-package-2')) return Promise.resolve(mockModulesMap2);
        return Promise.resolve({});
      });

      // Call both packages
      const result1 = await getLocalModulesMapModule.getLocalModulesMap(packageName1);
      const result2 = await getLocalModulesMapModule.getLocalModulesMap(packageName2);

      expect(result1).toEqual(mockModulesMap1);
      expect(result2).toEqual(mockModulesMap2);
      expect(result1).not.toEqual(result2);

      // Call again - should use cache for both
      const cachedResult1 = await getLocalModulesMapModule.getLocalModulesMap(packageName1);
      const cachedResult2 = await getLocalModulesMapModule.getLocalModulesMap(packageName2);

      expect(cachedResult1).toEqual(mockModulesMap1);
      expect(cachedResult2).toEqual(mockModulesMap2);

      // Verify that readJsonFile was only called once per package (due to cache)
      expect(mockReadJsonFile).toHaveBeenCalledTimes(2); // Once for each package
    });

    it('should handle cache expiration and re-fetch after TTL', async () => {
      const packageName = 'expiry-test-package';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/expiry-test-package'
      };
      const mockModulesMap = {
        'ExpiryComponent': 'dist/ExpiryComponent.js'
      };

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockResolvedValue(mockModulesMap);

      // First call at time 1000000
      jest.spyOn(Date, 'now').mockReturnValue(1000000);
      await getLocalModulesMapModule.getLocalModulesMap(packageName);
      expect(mockReadJsonFile).toHaveBeenCalledTimes(1);

      // Second call still within TTL (5 minutes = 300000ms)
      jest.spyOn(Date, 'now').mockReturnValue(1000000 + 200000); // 200 seconds later
      await getLocalModulesMapModule.getLocalModulesMap(packageName);
      expect(mockReadJsonFile).toHaveBeenCalledTimes(1); // Still using cache

      // Third call after TTL expiry
      jest.spyOn(Date, 'now').mockReturnValue(1000000 + 400000); // 400 seconds later (> 5 minutes)
      await getLocalModulesMapModule.getLocalModulesMap(packageName);
      expect(mockReadJsonFile).toHaveBeenCalledTimes(2); // Cache expired, re-fetch
    });
  });

  describe('edge cases', () => {
    it('should handle empty modules map', async () => {
      const packageName = 'empty-map-package';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/empty-map-package'
      };
      const emptyModulesMap = {};

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockResolvedValue(emptyModulesMap);

      const result = await getLocalModulesMapModule.getLocalModulesMap(packageName);

      expect(result).toEqual(emptyModulesMap);
    });

    it('should handle very large modules map', async () => {
      const packageName = 'large-map-package';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/large-map-package'
      };

      // Create large modules map
      const largeModulesMap: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeModulesMap[`Component${i}`] = `dist/Component${i}.js`;
      }

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockResolvedValue(largeModulesMap);

      const result = await getLocalModulesMapModule.getLocalModulesMap(packageName);

      expect(result).toEqual(largeModulesMap);
      expect(Object.keys(result)).toHaveLength(1000);
    });

    it('should handle complex module paths with special characters', async () => {
      const packageName = 'special-paths-package';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/special-paths-package'
      };
      const specialModulesMap = {
        '@scoped/component': 'dist/@scoped/component.js',
        'component-with-dashes': 'dist/component-with-dashes.js',
        'component_with_underscores': 'dist/component_with_underscores.js',
        'component.with.dots': 'dist/component.with.dots.js',
        'nested/deeply/component': 'dist/nested/deeply/component.js'
      };

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockResolvedValue(specialModulesMap);

      const result = await getLocalModulesMapModule.getLocalModulesMap(packageName);

      expect(result).toEqual(specialModulesMap);
    });

    it('should handle concurrent calls to same package', async () => {
      const packageName = 'concurrent-package';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/concurrent-package'
      };
      const mockModulesMap = {
        'ConcurrentComponent': 'dist/ConcurrentComponent.js'
      };

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockResolvedValue(mockModulesMap);

      // Make concurrent calls
      const promises = [
        getLocalModulesMapModule.getLocalModulesMap(packageName),
        getLocalModulesMapModule.getLocalModulesMap(packageName),
        getLocalModulesMapModule.getLocalModulesMap(packageName)
      ];

      const results = await Promise.all(promises);

      // All should return the same result
      expect(results[0]).toEqual(mockModulesMap);
      expect(results[1]).toEqual(mockModulesMap);
      expect(results[2]).toEqual(mockModulesMap);
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });

    it('should handle package names with unicode characters', async () => {
      const unicodePackageName = '@ünicøde/pæckage-test';
      const mockStatus = {
        exists: true,
        version: '1.0.0',
        packageRoot: '/path/to/@ünicøde/pæckage-test'
      };
      const mockModulesMap = {
        'ÜnicodeComponent': 'dist/ÜnicodeComponent.js'
      };

      mockVerifyLocalPackage.mockResolvedValue(mockStatus);
      mockReadJsonFile.mockResolvedValue(mockModulesMap);

      const result = await getLocalModulesMapModule.getLocalModulesMap(unicodePackageName);

      expect(result).toEqual(mockModulesMap);
    });
  });
});