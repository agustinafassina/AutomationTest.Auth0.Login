# Automated Tests with Auth0 🔐

End-to-end tests built with [Playwright](https://playwright.dev/) that log in to an application through **Auth0 Universal Login**.

The tests:
1. Open the application (`APP_URL`)
2. Find and click the login button in the top right corner
3. Log in on the Auth0 page
4. Wait for the redirect back to the application
5. Click a configurable button (`BUTTON_SELECTOR`) and optionally assert the result
6. Cover error cases (wrong credentials, empty fields)

## Prerequisites 📄
- Node.js **18 or higher**
- npm
- A running application that redirects to Auth0 (by default at `http://localhost:3000`)
- A **dedicated Auth0 test user**. Never use a real or production account.

### Application under test
These tests were written for the React app [Auth0.React.Ui](https://github.com/agustinafassina/Auth0.React.Ui), but they work with any app that uses Auth0 Universal Login. Clone and start it separately. Its folder is ignored in this repo's `.gitignore`.

## Installation 🛠️
1. Install the dependencies:
   ```bash
   npm install
   ```
2. Install the Playwright browser:
   ```bash
   npx playwright install chromium
   ```
3. Create your `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Fill in your values:
   ```env
   APP_URL=http://localhost:3000
   AUTH0_EMAIL=test-user@yourdomain.com
   AUTH0_PASSWORD=your-password
   BUTTON_SELECTOR=button[type="submit"]
   ```

> ⚠️ `.env` is in `.gitignore`. Never commit it.

## Usage 🚀

| Command | Description |
|---|---|
| `npm test` | Runs the tests in headless mode |
| `npm run test:headed` | Runs the tests with the browser visible |
| `npm run test:debug` | Opens the Playwright Inspector and **pauses after login** (sets `DEBUG=true`, works on Windows, macOS and Linux) |
| `npm run test:ui` | Opens Playwright's interactive UI |
| `npm run test:report` | Shows the HTML report from the last run |

In debug mode, press **Resume** (or `F8`) in the Inspector to continue after the pause.

## Configuration ⚙️

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `APP_URL` | No (default `http://localhost:3000`) | URL of the application that redirects to Auth0 |
| `BASE_URL` | No | Fallback when `APP_URL` is not set |
| `AUTH0_EMAIL` | **Yes** | Email of the test user |
| `AUTH0_PASSWORD` | **Yes** | Password of the test user |
| `BUTTON_SELECTOR` | No (default `button[type="submit"]`) | Button to click after login |
| `SUCCESS_SELECTOR` | No | Element that must be visible after clicking `BUTTON_SELECTOR`. If set, the test fails when it does not appear. |
| `AUTH0_DOMAIN` | No | Your Auth0 domain. **Required if you use a custom domain**. Without it, any `*.auth0.com` URL counts as the Auth0 page. |

If `AUTH0_EMAIL` or `AUTH0_PASSWORD` is missing or still has the example value, the tests fail with a clear message.

### Selector formats
`BUTTON_SELECTOR` and `SUCCESS_SELECTOR` accept any Playwright selector:
- CSS: `button[type="submit"]`, `.my-class`, `#my-id`
- Text: `text=Click here`
- XPath: `xpath=//button[@class='my-button']`

## Included tests 🗃️

| Test | What it checks |
|---|---|
| **Successful login** | Full flow: login, return to the app (no longer on Auth0), click `BUTTON_SELECTOR` and, if set, check that `SUCCESS_SELECTOR` is visible |
| **Wrong credentials** | Auth0 shows an error message and the user stays on the login page |
| **Required fields** | Submitting the empty form is blocked, by HTML5 validation or by an Auth0 error, and the user stays on the login page |

> ℹ️ The wrong-credentials test makes a failed login attempt on every run. If you run it many times in a row, Auth0's *Brute Force Protection* may block the IP or the user.

## Project structure 🗂️
```
.
├── tests/
│   ├── auth0-login.spec.js      # Auth0 login tests
│   └── helpers/
│       └── auth0-helpers.js     # Reusable helpers, selectors and timeouts
├── playwright.config.js         # Playwright configuration
├── package.json
├── .env.example                 # Example environment variables
└── README.md
```

## Customization ✏️
- **`tests/helpers/auth0-helpers.js`**: form selectors (`SELECTORS`), timeouts (`TIMEOUTS`), and the login button search logic (`POSITION_THRESHOLDS`).
- **`tests/auth0-login.spec.js`**: the tests themselves.
- **`playwright.config.js`**: global timeouts, reporters, browsers.

To add more tests, create new `*.spec.js` files in `tests/`.

## Troubleshooting ❗

**The Auth0 fields are not found.** Run `npm run test:debug` and inspect the login page to adjust `SELECTORS` in the helpers.

**The test times out waiting for the redirect to Auth0.** If you use a custom domain, set `AUTH0_DOMAIN` in your `.env`.

**The top-right login button is not found.** The test looks for a button in the last 25% of the width and the first 25% of the height. Make sure it is visible when the page loads, or adjust `POSITION_THRESHOLDS` in the helpers.

**The target button is not found.** Check `BUTTON_SELECTOR` with `npm run test:debug`, which pauses right after login so you can inspect the page.

**Other timeouts.** Increase them in `playwright.config.js` or in `TIMEOUTS` in the helpers.

## Reports 📊
After each run, an HTML report with screenshots and videos of failures is saved to `playwright-report/`. Open it with `npm run test:report`.

## Author
Agustina Fassina. License: ISC.
