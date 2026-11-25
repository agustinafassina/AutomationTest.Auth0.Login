const { test, expect } = require('@playwright/test');
require('dotenv').config({ quiet: true });

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
  test('should login to Auth0 and click a button after redirect', async ({ page }) => {
    const config = getConfig();

    console.log(`Navigating to ${config.appUrl}...`);
    await page.goto(config.appUrl);
    await page.waitForLoadState('networkidle');

    await clickLoginButton(page);

    await performAuth0Login(page, config.email, config.password, config.appUrl, config.auth0Url);

    // After login we must be back on the app, not on the Auth0 login page
    await expect(page).not.toHaveURL(config.auth0Url);

    if (process.env.DEBUG === 'true') {
      console.log('Redirect completed. Pausing for inspection...');
      await page.pause();
    }

    console.log('Searching for target button...');
    const targetButton = page.locator(config.buttonSelector).first();
    await expect(targetButton).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

    console.log('Clicking target button...');
    await targetButton.click();

    if (config.successSelector) {
      await expect(page.locator(config.successSelector).first()).toBeVisible({
        timeout: TIMEOUTS.ELEMENT_VISIBLE,
      });
    }

    console.log('Test completed successfully');
  });

  test('should handle incorrect login errors', async ({ page }) => {
    const config = getConfig();
    const wrongEmail = 'wrong@email.com';
    const wrongPassword = 'wrongpassword';

    await page.goto(config.appUrl);
    await page.waitForLoadState('networkidle');

    await clickLoginButton(page);

    await waitForAuth0Redirect(page, config.auth0Url);

    await fillAuth0LoginForm(page, wrongEmail, wrongPassword);
    await submitAuth0LoginForm(page);

    // Prefer Auth0 Universal Login error elements; fall back to error text
    const errorMessage = page
      .locator(SELECTORS.ERROR)
      .or(page.getByText(/wrong email or password|invalid|incorrect|incorrecto|inválido/i))
      .first();

    await expect(errorMessage).toBeVisible({ timeout: TIMEOUTS.ERROR_MESSAGE });
    await expect(page).toHaveURL(config.auth0Url);
    console.log('Login error detected correctly');
  });

  test('should validate that credentials are required', async ({ page }) => {
    const config = getConfig();

    await page.goto(config.appUrl);
    await page.waitForLoadState('networkidle');

    await clickLoginButton(page);
    await waitForAuth0Redirect(page, config.auth0Url);

    const submitButton = page.locator(SELECTORS.SUBMIT).first();
    await expect(submitButton).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

    const emailInput = page.locator(SELECTORS.EMAIL).first();
    const passwordInput = page.locator(SELECTORS.PASSWORD).first();

    // getAttribute returns "" for a bare `required` attribute, so compare against null
    const emailRequired = (await emailInput.getAttribute('required')) !== null;
    const passwordRequired = (await passwordInput.getAttribute('required')) !== null;

    await submitButton.click();

    if (emailRequired || passwordRequired) {
      console.log('Fields have HTML5 validation (required)');
      const firstRequired = emailRequired ? emailInput : passwordInput;
      const isInvalid = await firstRequired.evaluate((el) => !el.checkValidity());
      expect(isInvalid).toBe(true);
    } else {
      const errorMessage = page
        .locator(SELECTORS.ERROR)
        .or(page.getByText(/required|enter your|requerido|obligatorio/i))
        .first();
      await expect(errorMessage).toBeVisible({ timeout: TIMEOUTS.ERROR_MESSAGE });
    }

    // Submitting an empty form must never leave the Auth0 login page
    await expect(page).toHaveURL(config.auth0Url);
  });
});
