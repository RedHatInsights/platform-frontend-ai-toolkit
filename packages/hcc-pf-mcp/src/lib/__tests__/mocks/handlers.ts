import { http, HttpResponse } from 'msw';

// Common mock responses
export const MOCK_RESPONSES = {
  PATTERNFLY_DOCS: `# PatternFly DataView

This is a mock documentation for PatternFly DataView component.

## Basic Usage

\`\`\`tsx
import { DataView } from '@patternfly/react-data-view';

export function MyTable() {
  return (
    <DataView data={data}>
      {/* Your table content */}
    </DataView>
  );
}
\`\`\`

## Features

- Advanced sorting and filtering
- Pagination support
- Responsive design
- Accessibility compliant`,

  SIMPLE_TEXT: 'Mock response text',
  JSON_DATA: { message: 'Hello, world!' },
  CACHED_TEXT: 'Cached response'
};

// URLs for consistent reference across tests
export const TEST_URLS = {
  PATTERNFLY_DOCS: 'https://raw.githubusercontent.com/patternfly/react-data-view/refs/heads/main/packages/module/patternfly-docs/content/extensions/data-view/examples/DataView/DataView.md',
  EXAMPLE_DATA: 'https://example.com/data',
  EXAMPLE_JSON: 'https://example.com/json',
  EXAMPLE_CACHED: 'https://example.com/cached',
  NOT_FOUND: 'https://example.com/not-found',
  NETWORK_ERROR: 'https://example.com/network-error'
} as const;

export const handlers = [
  // Mock PatternFly DataView documentation
  http.get(TEST_URLS.PATTERNFLY_DOCS, () => {
    return HttpResponse.text(MOCK_RESPONSES.PATTERNFLY_DOCS);
  }),

  // Mock successful text response
  http.get(TEST_URLS.EXAMPLE_DATA, () => {
    return HttpResponse.text(MOCK_RESPONSES.SIMPLE_TEXT);
  }),

  // Mock JSON response
  http.get(TEST_URLS.EXAMPLE_JSON, () => {
    return HttpResponse.json(MOCK_RESPONSES.JSON_DATA);
  }),

  // Mock cached response
  http.get(TEST_URLS.EXAMPLE_CACHED, () => {
    return HttpResponse.text(MOCK_RESPONSES.CACHED_TEXT);
  }),

  // Mock 404 error
  http.get(TEST_URLS.NOT_FOUND, () => {
    return new HttpResponse(null, { status: 404, statusText: 'Not Found' });
  }),

  // Mock network error
  http.get(TEST_URLS.NETWORK_ERROR, () => {
    return HttpResponse.error();
  }),
];

// Helper function to create custom HTTP responses for testing
export const createMockResponse = {
  text: (content: string, options?: ResponseInit) => HttpResponse.text(content, options),
  json: (data: any, options?: ResponseInit) => HttpResponse.json(data, options),
  error: (status: number, statusText: string) => new HttpResponse(null, { status, statusText }),
  networkError: () => HttpResponse.error()
};