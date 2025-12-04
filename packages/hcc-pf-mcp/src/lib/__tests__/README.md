# Test Documentation

This directory contains comprehensive unit tests for the HCC PatternFly MCP package. The tests are designed to ensure reliability, error handling, and edge case coverage for all MCP tools.

## Test Structure

### Core Test Files

- **`cachedFetch.test.ts`** - Tests for HTTP caching utility
- **`description.test.ts`** - Tests for PatternFly documentation fetching tool
- **`implementationExample.test.ts`** - Tests for local example file reading tool

### Supporting Files

- **`mocks/handlers.ts`** - MSW mock handlers for HTTP requests
- **`testUtils.ts`** - Shared test utilities and helpers
- **`README.md`** - This documentation file

## Test Coverage Areas

### 1. cachedFetch.test.ts

**Functionality Tested:**
- ✅ Successful HTTP requests (text and JSON)
- ✅ Caching behavior and cache key generation
- ✅ Error handling (404, 500, network errors)
- ✅ Content-type detection and parsing
- ✅ Request options handling (headers, etc.)
- ✅ Large payload handling
- ✅ Special character and Unicode support
- ✅ Type safety validation

**Edge Cases Covered:**
- Empty responses
- Malformed JSON
- Missing content-type headers
- Different request options creating separate cache entries
- Non-Error objects being thrown

### 2. description.test.ts

**Functionality Tested:**
- ✅ Tool configuration validation
- ✅ Successful documentation fetching
- ✅ Error handling with proper McpError wrapping
- ✅ Input parameter validation
- ✅ Response format compliance
- ✅ URL endpoint validation

**Edge Cases Covered:**
- Empty documentation content
- Large documentation files
- Special characters and encoding
- Various error types (network, timeout, HTTP errors)
- Invalid input parameters (null, undefined, extra properties)
- Non-Error objects in error handling

### 3. implementationExample.test.ts

**Functionality Tested:**
- ✅ Tool configuration and schema validation
- ✅ File system operations (reading with utf-8 encoding)
- ✅ Input validation against allowed example names
- ✅ Path construction and resolution
- ✅ Error handling with proper McpError codes
- ✅ Response format compliance

**Edge Cases Covered:**
- Invalid example names (case sensitivity, special characters, numbers)
- File system errors (ENOENT, EACCES, generic errors)
- Empty files and large files
- Special character content
- Non-Error objects in error handling
- All valid example names individually tested

## Test Quality Standards

### Error Handling
- All error scenarios properly wrapped in McpError with appropriate error codes
- Non-Error objects handled gracefully
- Original error messages preserved and contextual information added

### Input Validation
- Comprehensive validation of all input parameters
- Edge cases for null, undefined, empty, and invalid values
- Type safety and boundary condition testing

### Response Format
- Strict validation of MCP response format compliance
- Content preservation without modification
- Proper content type handling

### Performance Considerations
- Large payload handling tested
- Caching behavior verified
- File system operation efficiency

## Mock Strategy

### HTTP Mocking (MSW)
- Realistic HTTP response mocking
- Consistent URL and response patterns
- Error condition simulation
- Content-type header testing

### File System Mocking
- Complete Node.js fs module mocking
- Path resolution mocking
- Promisified function behavior
- Error condition simulation

### Shared Mock Data
- Centralized test data in `testUtils.ts`
- Consistent error messages and patterns
- Reusable mock creators

## Running Tests

```bash
# Run all tests
npm run test:mcp

# Run specific test file
npm run test:mcp -- --testPathPattern=cachedFetch

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Test Maintenance Guidelines

### When Adding New Tests
1. Use shared utilities from `testUtils.ts` when possible
2. Follow existing naming conventions and structure
3. Include both positive and negative test cases
4. Test edge cases and boundary conditions
5. Ensure proper error handling coverage

### When Modifying Existing Tests
1. Maintain backward compatibility with existing assertions
2. Update documentation if test behavior changes
3. Ensure all related tests still pass
4. Consider impact on shared utilities

### Best Practices
- One assertion per test when possible
- Descriptive test names that explain the scenario
- Group related tests with `describe` blocks
- Use `beforeEach`/`afterEach` for proper test isolation
- Mock at the appropriate level (avoid over-mocking)

## Coverage Goals

The test suite aims for:
- **Function Coverage**: 100% of exported functions tested
- **Branch Coverage**: All conditional logic paths tested
- **Error Coverage**: All error conditions and edge cases tested
- **Integration Coverage**: Tool integration patterns tested

## Future Improvements

Areas for potential test expansion:
- Performance benchmarking tests
- Stress testing with very large payloads
- Concurrent request handling
- Cache invalidation strategies
- Security testing for input sanitization