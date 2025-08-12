# Test Coverage

Generate comprehensive test coverage for the codebase.

## Process

1. **Analyze Current Coverage**
   - Run `npm test -- --coverage` to see current test coverage
   - Identify files with low or missing coverage

2. **Generate Missing Tests**
   - Use the test-writer agent to create tests for uncovered files
   - Focus on critical components and utilities first
   - Ensure tests cover happy paths, edge cases, and error conditions

3. **Verify Quality**
   - Run tests to ensure they pass
   - Check that coverage improves meaningfully
   - Validate tests actually test behavior, not just implementation

## Usage

```bash
# Run with coverage reporting
/test-coverage

# Or target specific areas
/test-coverage src/components/ChatInterface
```

## Coverage Goals

- **Components**: 90%+ coverage for UI components
- **Utilities**: 95%+ coverage for pure functions
- **API Routes**: 85%+ coverage for endpoints
- **Hooks**: 90%+ coverage for custom hooks

## Testing Strategy

- Use Vitest with React Testing Library
- Place tests in `__tests__` directories
- Mock external dependencies appropriately
- Test user interactions and state changes
- Include accessibility and error boundary tests