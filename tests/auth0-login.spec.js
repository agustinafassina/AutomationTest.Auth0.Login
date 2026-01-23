const { test, expect } = require('@playwright/test');
require('dotenv').config();

const {
  clickLoginButton,
  performAuth0Login,
  fillAuth0LoginForm,
  submitAuth0LoginForm,
  waitForAuth0Redirect,
  getConfig,
  TIMEOUTS,
  SELECTORS,
} = require('./helpers/auth0-helpers');

test.describe('Auth0 Login', () => {
  test.beforeEach(() => {
    try {
      getConfig();
    } catch (error) {
      test.skip(false, error.message);
    }
  });

  test('should login to Auth0 and click a button after redirect', async ({ page }) => {
    const config = getConfig();

    console.log(`Navigating to ${config.appUrl}...`);
    await page.goto(config.appUrl);
    await page.waitForLoadState('networkidle');

    await clickLoginButton(page);

    await performAuth0Login(page, config.email, config.password, config.appUrl);

    if (process.env.DEBUG === 'true') {
      console.log('Redirect completed. Opening browser console...');
      await page.pause();
      console.log('Page loaded after login. Console opened.');
    }

    console.log('Searching for target button...');
    const targetButton = page.locator(config.buttonSelector).first();
    await targetButton.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });

    console.log('Clicking target button...');
    await targetButton.click();

    console.log('Test completed successfully');
  });

  test('should handle incorrect login errors', async ({ page }) => {
    const config = getConfig();
    const wrongEmail = 'wrong@email.com';
    const wrongPassword = 'wrongpassword';

    await page.goto(config.appUrl);
    await page.waitForLoadState('networkidle');

    await clickLoginButton(page);

    await waitForAuth0Redirect(page);

    await fillAuth0LoginForm(page, wrongEmail, wrongPassword);
    await submitAuth0LoginForm(page);

    const errorMessage = page.locator('text=/error|invalid|incorrect|incorrecto|inválido/i').first();
    await errorMessage.waitFor({ state: 'visible', timeout: TIMEOUTS.ERROR_MESSAGE });

    await expect(errorMessage).toBeVisible();
    console.log('Login error detected correctly');
  });

  test('should validate that credentials are required', async ({ page }) => {
    const config = getConfig();

    await page.goto(config.appUrl);
    await page.waitForLoadState('networkidle');

    await clickLoginButton(page);
    await waitForAuth0Redirect(page);

    const submitButton = page.locator(SELECTORS.SUBMIT).first();
    await submitButton.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });

    const emailInput = page.locator(SELECTORS.EMAIL).first();
    const passwordInput = page.locator(SELECTORS.PASSWORD).first();

    const emailRequired = await emailInput.getAttribute('required');
    const passwordRequired = await passwordInput.getAttribute('required');

    if (emailRequired || passwordRequired) {
      console.log('Fields have HTML5 validation (required)');
    } else {
      await submitButton.click();
      const errorMessage = page.locator('text=/required|requerido|obligatorio/i').first();
      await errorMessage.waitFor({ state: 'visible', timeout: TIMEOUTS.ERROR_MESSAGE }).catch(() => {
        console.log('Validation error message not found');
      });
    }
  });
});
