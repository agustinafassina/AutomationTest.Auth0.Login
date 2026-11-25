const TIMEOUTS = {
  NAVIGATION: 10000,
  ELEMENT_VISIBLE: 10000,
  REDIRECTION: 30000,
  ERROR_MESSAGE: 5000,
  QUICK_CHECK: 1000,
};

const SELECTORS = {
  EMAIL: 'input[name="email"], input[type="email"], input[id*="email"], input[id*="username"]',
  PASSWORD: 'input[name="password"], input[type="password"]',
  SUBMIT: 'button[type="submit"], button:has-text("Continue"), button:has-text("Log in"), button:has-text("Sign in"), button:has-text("Continuar"), button:has-text("Iniciar sesión")',
  ERROR: '#error-element-password, #error-element-username, #error-element-email, [data-error-code], .ulp-input-error-message',
  CLICKABLE_ELEMENTS: 'button, a[role="button"], a[href*="login"], a[href*="auth"], [onclick], [class*="button"], [class*="btn"]',
  COMMON_LOGIN_BUTTONS: [
    'button:has-text("Log in")',
    'button:has-text("Login")',
    'button:has-text("Sign in")',
    'button:has-text("Iniciar sesión")',
    'a:has-text("Log in")',
    'a:has-text("Login")',
    '[data-testid*="login"]',
    '[id*="login"]',
    '.login-button',
    '#login-button',
    '[class*="header"] button:last-child',
    '[class*="nav"] button:last-child',
  ],
};

const POSITION_THRESHOLDS = {
  RIGHT_EDGE: 0.75,
  TOP_EDGE: 0.25,
  MIN_RIGHT_POSITION: 0.6,
};

function validateEnvVars() {
  const required = ['AUTH0_EMAIL', 'AUTH0_PASSWORD'];
  const missing = required.filter(key => !process.env[key] || process.env[key].includes('example') || process.env[key].includes('your-'));
  
  if (missing.length > 0) {
    throw new Error(
      `Missing or unconfigured environment variables: ${missing.join(', ')}. ` +
      'Please configure these variables in your .env file'
    );
  }
}

async function findLoginButtonByPosition(page) {
  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error('Could not get viewport size');
  }

  const clickableElements = await page.locator(SELECTORS.CLICKABLE_ELEMENTS).all();
  let bestMatch = null;
  let bestScore = 0;

  for (const element of clickableElements) {
    try {
      const box = await element.boundingBox();
      if (!box) continue;

      const rightScore = box.x + box.width > viewport.width * POSITION_THRESHOLDS.RIGHT_EDGE ? 1 : 0;
      const topScore = box.y < viewport.height * POSITION_THRESHOLDS.TOP_EDGE ? 1 : 0;
      const distanceFromRight = viewport.width - (box.x + box.width);
      const distanceFromTop = box.y;
      const score = (rightScore * 2 + topScore * 2) - (distanceFromRight / 100) - (distanceFromTop / 100);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = element;
      }
    } catch (e) {
      continue;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

async function findLoginButtonBySelectors(page) {
  const viewport = page.viewportSize();
  if (!viewport) return null;

  for (const selector of SELECTORS.COMMON_LOGIN_BUTTONS) {
    try {
      const btn = page.locator(selector).first();
      const isVisible = await btn.isVisible({ timeout: TIMEOUTS.QUICK_CHECK }).catch(() => false);
      
      if (isVisible) {
        const box = await btn.boundingBox();
        if (box && box.x > viewport.width * POSITION_THRESHOLDS.MIN_RIGHT_POSITION) {
          return btn;
        }
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

async function clickLoginButton(page) {
  console.log('Searching for login button in the top right corner...');

  let button = await findLoginButtonByPosition(page);
  
  if (button) {
    console.log('Button found in the top right corner');
    await button.click();
    return;
  }

  console.log('Trying with common selectors...');
  button = await findLoginButtonBySelectors(page);

  if (button) {
    const selector = await button.evaluate(el => {
      const id = el.id ? `#${el.id}` : '';
      const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
      return id || classes || el.tagName;
    }).catch(() => 'selector');
    console.log(`Button found with selector: ${selector}`);
    await button.click();
    return;
  }

  throw new Error(
    'Login button not found in the top right corner. ' +
    'Please verify that the button is visible on the page.'
  );
}

async function fillAuth0LoginForm(page, email, password) {
  console.log('Filling Auth0 login form...');

  const emailInput = page.locator(SELECTORS.EMAIL).first();
  await emailInput.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
  await emailInput.fill(email);

  const passwordInput = page.locator(SELECTORS.PASSWORD).first();
  await passwordInput.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
  await passwordInput.fill(password);
}

async function submitAuth0LoginForm(page) {
  const submitButton = page.locator(SELECTORS.SUBMIT).first();
  await submitButton.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_VISIBLE });
  console.log('Submitting login form...');
  await submitButton.click();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Regex that matches the Auth0 login page URL.
 * Uses AUTH0_DOMAIN when set (required for custom domains), otherwise any *.auth0.com host.
 */
function getAuth0UrlPattern() {
  const domain = process.env.AUTH0_DOMAIN;
  if (domain) {
    const host = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return new RegExp(`^https?://${escapeRegExp(host)}/`);
  }
  return /^https?:\/\/[^/]*\.auth0\.com\//;
}

async function waitForAuth0Redirect(page, auth0Url = getAuth0UrlPattern()) {
  console.log('Waiting for redirect to Auth0...');
  await page.waitForURL(auth0Url, { timeout: TIMEOUTS.NAVIGATION });
}

async function waitForAppRedirect(page, appUrl) {
  console.log('Waiting for redirect after login...');
  await page.waitForURL(new RegExp(`^${escapeRegExp(appUrl)}`), { timeout: TIMEOUTS.REDIRECTION });
  await page.waitForLoadState('networkidle');
}

async function performAuth0Login(page, email, password, appUrl, auth0Url) {
  await waitForAuth0Redirect(page, auth0Url);
  await fillAuth0LoginForm(page, email, password);
  await submitAuth0LoginForm(page);
  await waitForAppRedirect(page, appUrl);
}

function getConfig() {
  validateEnvVars();

  return {
    appUrl: process.env.APP_URL || process.env.BASE_URL || 'http://localhost:3000',
    email: process.env.AUTH0_EMAIL,
    password: process.env.AUTH0_PASSWORD,
    buttonSelector: process.env.BUTTON_SELECTOR || 'button[type="submit"]',
    successSelector: process.env.SUCCESS_SELECTOR || null,
    auth0Url: getAuth0UrlPattern(),
  };
}

module.exports = {
  TIMEOUTS,
  SELECTORS,
  validateEnvVars,
  getAuth0UrlPattern,
  findLoginButtonByPosition,
  findLoginButtonBySelectors,
  clickLoginButton,
  fillAuth0LoginForm,
  submitAuth0LoginForm,
  waitForAuth0Redirect,
  waitForAppRedirect,
  performAuth0Login,
  getConfig,
};
