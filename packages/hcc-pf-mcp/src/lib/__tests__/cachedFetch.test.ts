import { cachedFetch } from '../cachedFetch';
import { server } from '../../test-setup';
import { http, HttpResponse } from 'msw';
import {
  TEST_DATA,
  createMockError,
  validateUrl,
  validateContent,
  performanceHelpers
} from './testUtils';

describe('cachedFetch', () => {
  afterEach(() => {
    // Clear modules cache between tests to ensure fresh cache state
    jest.resetModules();
  });

  describe('successful responses', () => {
    it('should fetch and return text data successfully', async () => {
      const result = await cachedFetch<string>('https://example.com/data');
      expect(result).toBe('Mock response text');
      expect(typeof result).toBe('string');
      expect(validateUrl.isTestUrl('https://example.com/data')).toBe(true);
    });

    it('should handle JSON responses with correct content-type', async () => {
      const result = await cachedFetch('https://example.com/json');
      expect(result).toEqual({ message: 'Hello, world!' });
      expect(typeof result).toBe('object');
    });

    it('should handle empty string responses', async () => {
      server.use(
        http.get('https://example.com/empty', () => {
          return HttpResponse.text(TEST_DATA.MARKDOWN.EMPTY);
        })
      );

      const result = await cachedFetch<string>('https://example.com/empty');
      expect(result).toBe(TEST_DATA.MARKDOWN.EMPTY);
    });

    it('should handle large JSON payloads', async () => {
      const largeData = {
        ...TEST_DATA.JSON.COMPLEX,
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` })),
        metadata: { total: 1000, page: 1 }
      };

      server.use(
        http.get('https://example.com/large-json', () => {
          return HttpResponse.json(largeData);
        })
      );

      const result = await cachedFetch('https://example.com/large-json');
      expect(result).toEqual(largeData);
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items).toHaveLength(1000);
    });
  });

  describe('error handling', () => {
    it('should throw error when fetch fails (404)', async () => {
      await expect(cachedFetch('https://example.com/not-found'))
        .rejects
        .toThrow(TEST_DATA.ERRORS.NOT_FOUND);
    });

    it('should handle network errors gracefully', async () => {
      await expect(cachedFetch('https://example.com/network-error'))
        .rejects
        .toThrow('Fetch failed for https://example.com/network-error: Failed to fetch');
    });

    it('should handle 500 server errors', async () => {
      server.use(
        http.get('https://example.com/server-error', () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        })
      );

      await expect(cachedFetch('https://example.com/server-error'))
        .rejects
        .toThrow(TEST_DATA.ERRORS.SERVER_ERROR);
    });

    it('should handle 403 forbidden errors', async () => {
      const forbiddenError = createMockError.network(403, 'Forbidden');
      server.use(
        http.get('https://example.com/forbidden', () => {
          return new HttpResponse(null, { status: 403, statusText: 'Forbidden' });
        })
      );

      await expect(cachedFetch('https://example.com/forbidden'))
        .rejects
        .toThrow(forbiddenError.message);
    });

    it('should handle malformed JSON responses', async () => {
      server.use(
        http.get('https://example.com/malformed-json', () => {
          return new HttpResponse('{ "invalid": json }', {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      await expect(cachedFetch('https://example.com/malformed-json'))
        .rejects
        .toThrow(/Fetch failed for https:\/\/example\.com\/malformed-json:/);
    });
  });

  describe('content-type handling', () => {
    it('should detect JSON content-type with charset', async () => {
      const jsonWithCharset = { charset: 'test' };
      server.use(
        http.get('https://example.com/json-with-charset', () => {
          return new HttpResponse(JSON.stringify(jsonWithCharset), {
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          });
        })
      );

      const result = await cachedFetch('https://example.com/json-with-charset');
      expect(result).toEqual(jsonWithCharset);
    });

    it('should handle non-JSON content-type as text', async () => {
      server.use(
        http.get('https://example.com/xml-data', () => {
          return new HttpResponse('<xml><data>test</data></xml>', {
            headers: { 'Content-Type': 'application/xml' }
          });
        })
      );

      const result = await cachedFetch<string>('https://example.com/xml-data');
      expect(result).toBe('<xml><data>test</data></xml>');
      expect(typeof result).toBe('string');
    });

    it('should handle missing content-type header as text', async () => {
      server.use(
        http.get('https://example.com/no-content-type', () => {
          return new HttpResponse('Plain text response');
        })
      );

      const result = await cachedFetch<string>('https://example.com/no-content-type');
      expect(result).toBe('Plain text response');
    });
  });

  describe('caching behavior', () => {
    it('should cache responses correctly for identical requests', async () => {
      let fetchCount = 0;

      server.use(
        http.get('https://example.com/cache-test', () => {
          fetchCount++;
          return HttpResponse.text('Cached response');
        })
      );

      // Re-import to get fresh cache
      const { cachedFetch: freshCachedFetch } = await import('../cachedFetch');

      // First call
      const result1 = await freshCachedFetch<string>('https://example.com/cache-test');
      expect(result1).toBe('Cached response');
      expect(fetchCount).toBe(1);

      // Second call should use cache
      const result2 = await freshCachedFetch<string>('https://example.com/cache-test');
      expect(result2).toBe('Cached response');
      expect(fetchCount).toBe(1); // Should still be 1 due to caching

      // Third call should also use cache
      const result3 = await freshCachedFetch<string>('https://example.com/cache-test');
      expect(result3).toBe('Cached response');
      expect(fetchCount).toBe(1);
    });

    it('should create separate cache entries for different URLs', async () => {
      let fetchCount1 = 0;
      let fetchCount2 = 0;

      server.use(
        http.get('https://example.com/cache-test-1', () => {
          fetchCount1++;
          return HttpResponse.text('Response 1');
        }),
        http.get('https://example.com/cache-test-2', () => {
          fetchCount2++;
          return HttpResponse.text('Response 2');
        })
      );

      const { cachedFetch: freshCachedFetch } = await import('../cachedFetch');

      // Fetch from different URLs
      const result1 = await freshCachedFetch<string>('https://example.com/cache-test-1');
      const result2 = await freshCachedFetch<string>('https://example.com/cache-test-2');

      expect(result1).toBe('Response 1');
      expect(result2).toBe('Response 2');
      expect(fetchCount1).toBe(1);
      expect(fetchCount2).toBe(1);

      // Fetch again - should use cache
      await freshCachedFetch<string>('https://example.com/cache-test-1');
      await freshCachedFetch<string>('https://example.com/cache-test-2');

      expect(fetchCount1).toBe(1);
      expect(fetchCount2).toBe(1);
    });

    it('should cache different content types separately', async () => {
      let textFetchCount = 0;
      let jsonFetchCount = 0;

      server.use(
        http.get('https://example.com/mixed-content-text', () => {
          textFetchCount++;
          return HttpResponse.text('Text response');
        }),
        http.get('https://example.com/mixed-content-json', () => {
          jsonFetchCount++;
          return HttpResponse.json({ data: 'JSON response' });
        })
      );

      const { cachedFetch: freshCachedFetch } = await import('../cachedFetch');

      // Fetch text and JSON
      const textResult = await freshCachedFetch<string>('https://example.com/mixed-content-text');
      const jsonResult = await freshCachedFetch('https://example.com/mixed-content-json');

      expect(textResult).toBe('Text response');
      expect(jsonResult).toEqual({ data: 'JSON response' });
      expect(textFetchCount).toBe(1);
      expect(jsonFetchCount).toBe(1);

      // Fetch again - should use cache
      await freshCachedFetch<string>('https://example.com/mixed-content-text');
      await freshCachedFetch('https://example.com/mixed-content-json');

      expect(textFetchCount).toBe(1);
      expect(jsonFetchCount).toBe(1);
    });
  });

  describe('request options handling', () => {
    it('should handle requests with custom headers', async () => {
      server.use(
        http.get('https://example.com/with-headers', ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (authHeader === 'Bearer test-token') {
            return HttpResponse.text('Authorized response');
          }
          return new HttpResponse(null, { status: 401 });
        })
      );

      const result = await cachedFetch<string>('https://example.com/with-headers', {
        headers: { 'Authorization': 'Bearer test-token' }
      });

      expect(result).toBe('Authorized response');
    });

    it('should cache requests with different options separately', async () => {
      let noHeaderCount = 0;
      let withHeaderCount = 0;

      server.use(
        http.get('https://example.com/options-test', ({ request }) => {
          const hasAuth = request.headers.has('Authorization');
          if (hasAuth) {
            withHeaderCount++;
            return HttpResponse.text('With header');
          } else {
            noHeaderCount++;
            return HttpResponse.text('No header');
          }
        })
      );

      const { cachedFetch: freshCachedFetch } = await import('../cachedFetch');

      // Request without headers
      const result1 = await freshCachedFetch<string>('https://example.com/options-test');
      expect(result1).toBe('No header');
      expect(noHeaderCount).toBe(1);

      // Request with headers
      const result2 = await freshCachedFetch<string>('https://example.com/options-test', {
        headers: { 'Authorization': 'Bearer test' }
      });
      expect(result2).toBe('With header');
      expect(withHeaderCount).toBe(1);

      // Repeat requests - should use separate cache entries
      await freshCachedFetch<string>('https://example.com/options-test');
      await freshCachedFetch<string>('https://example.com/options-test', {
        headers: { 'Authorization': 'Bearer test' }
      });

      expect(noHeaderCount).toBe(1);
      expect(withHeaderCount).toBe(1);
    });
  });

  describe('type safety', () => {
    it('should maintain type safety for string responses', async () => {
      const result = await cachedFetch<string>('https://example.com/data');
      // TypeScript should infer this as string
      expect(typeof result).toBe('string');
      expect(result.charAt).toBeDefined(); // String method should be available
    });

    it('should maintain type safety for object responses', async () => {
      interface TestResponse {
        message: string;
      }

      const result = await cachedFetch<TestResponse>('https://example.com/json');
      // TypeScript should infer this as TestResponse
      expect(typeof result.message).toBe('string');
      expect(result.message).toBe('Hello, world!');
    });
  });
});