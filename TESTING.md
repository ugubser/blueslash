# Testing Guide

## Overview

BlueSlash uses **Vitest** for unit and integration testing, along with **React Testing Library** for component testing. This provides fast, modern testing with excellent developer experience.

## Running Tests

```bash
# Run tests in watch mode (for development)
npm test

# Run all tests once
npm run test:run

# Run tests with UI (visual test runner)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are located next to the files they test, using the `.test.ts` or `.test.tsx` extension:

```
src/
├── components/
│   ├── ErrorBoundary.tsx
│   └── ErrorBoundary.test.tsx
├── utils/
│   ├── formatting.ts
│   └── formatting.test.ts
```

## Current Test Coverage

✅ **Utilities** (22 tests)
- `formatting.ts` - Date, number, and gem formatting
- `household.ts` - User role calculations

✅ **Components** (15 tests)
- `ToggleControl` - Desktop and mobile toggle modes
- `ErrorBoundary` - Error catching and recovery

## Writing Tests

### Testing Utilities (Pure Functions)

```typescript
import { describe, it, expect } from 'vitest';
import { formatNumber } from './formatting';

describe('formatNumber', () => {
  it('should format numbers with thousands separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });
});
```

### Testing Components

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<MyComponent onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalled();
  });
});
```

### Testing with Firebase

For components that use Firebase, mock the Firebase calls:

```typescript
import { vi } from 'vitest';

// Mock Firebase module
vi.mock('../services/firebase', () => ({
  db: {},
  auth: {},
}));
```

## Best Practices

### 1. Test User Behavior, Not Implementation

✅ **Good:**
```typescript
const button = screen.getByRole('button', { name: /submit/i });
await user.click(button);
expect(screen.getByText('Success')).toBeInTheDocument();
```

❌ **Bad:**
```typescript
const button = wrapper.find('.submit-button');
wrapper.instance().handleSubmit();
```

### 2. Use Accessible Queries

Prefer queries in this order:
1. `getByRole` - Most accessible
2. `getByLabelText` - For form fields
3. `getByText` - For non-interactive elements
4. `getByTestId` - Last resort

### 3. Avoid Testing Implementation Details

✅ Test what the user sees and does
❌ Don't test internal state, private methods, or component structure

### 4. Mock External Dependencies

Mock:
- Firebase/Firestore calls
- API requests
- Browser APIs (localStorage, window.location)
- Third-party libraries

### 5. Keep Tests Fast

- Avoid unnecessary waits
- Mock heavy operations
- Use `vi.fn()` for callbacks
- Don't test third-party libraries

## Common Matchers

```typescript
// Basic matchers
expect(value).toBe(5);
expect(value).toEqual({ name: 'test' });
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// DOM matchers (from @testing-library/jest-dom)
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toHaveTextContent('text');
expect(element).toHaveClass('className');

// Function matchers
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(3);
```

## Continuous Integration

Tests run automatically on:
- Every commit (via git hooks - if configured)
- Pull requests (via GitHub Actions - if configured)
- Before deployment

To set up pre-commit hooks:

```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test:run"
```

## Coverage Goals

Target coverage thresholds:
- **Utilities**: 90%+ (easy to achieve with pure functions)
- **Components**: 70%+ (UI components)
- **Services**: 60%+ (Firebase integration complexity)
- **Overall**: 70%+

Check coverage:
```bash
npm run test:coverage
```

## Next Steps

Priority areas for test coverage:
1. ✅ Formatting utilities
2. ✅ Household utilities
3. ✅ ToggleControl component
4. ✅ ErrorBoundary component
5. ⏳ Toast notifications (useToast hook)
6. ⏳ Service layer (mock Firebase)
7. ⏳ Complex components (TaskCard, CreateTaskForm)
8. ⏳ Integration tests for key user flows

## Troubleshooting

### Tests fail with Firebase errors
Mock Firebase in your test setup:
```typescript
vi.mock('../services/firebase');
```

### Tests timeout
Increase timeout in test or vitest.config.ts:
```typescript
it('slow test', async () => {
  // test code
}, { timeout: 10000 });
```

### Component not rendering
Check that setup.ts is imported and jsdom is configured in vitest.config.ts

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
