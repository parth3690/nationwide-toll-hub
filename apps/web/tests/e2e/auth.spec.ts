import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.getByPlaceholder('Enter your email').fill('invalid-email');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByPlaceholder('Enter your password').fill('123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Enter your password');
    const toggleButton = page.getByRole('button', { name: /show password|hide password/i });
    
    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/register');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL('/forgot-password');
  });

  test('should handle successful login', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      });
    });

    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle login error', async ({ page }) => {
    // Mock login error response
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invalid email or password',
        }),
      });
    });

    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByPlaceholder('Enter your password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText('Invalid email or password. Please try again.')).toBeVisible();
  });
});
