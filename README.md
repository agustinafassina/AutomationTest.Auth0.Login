# Automated Tests with Auth0
This repository contains automated tests that log in to auth0.

### This project contains automated tests that:
1. Navigate to the configured URL (index)
2. Find and click the login button in the top right corner
3. Log in to Auth0
4. Wait for redirection after login
5. Click a specified button
6. Include error validation and edge cases

## Prerequisites 📄
- Node.js (version 16 or higher)
- npm or yarn

## Installation 🛠️
1. Install dependencies
```bash
npm install
```

2. Install the Playwright browsers
```bash
npx playwright install chromium
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure the `.env` file with your credentials:
```env
APP_URL=http://localhost:3000
AUTH0_EMAIL=your-email@example.com
AUTH0_PASSWORD=your-password
BUTTON_SELECTOR=button[type="submit"]
```

## Usage
### Run tests in headless mode (without seeing the browser):
```bash
npm test
```

### Run tests with browser visible (headed mode) 🚀
```bash
npm run test:headed
```
**Note:** In headed mode, after login the browser console (DevTools) will automatically open and the test will pause. Press `F8` or click "Resume" to continue.

### Run tests in debug mode 🚀
```bash
npm run test:debug
```
This opens Playwright Inspector for step-by-step debugging and automatically pauses after login.

### Run tests with interactive UI 🚀
```bash
npm run test:ui
```
Opens the Playwright UI to run and debug tests visually.

### Run only on Chrome 🚀
```bash
npm run test:chrome
```

### View HTML report 👀
```bash
npm run test:report
```
Shows the HTML report of the last executed tests.

## Configuration 🛠️
### Environment Variables

- `APP_URL`: URL of your application that redirects to Auth0
- `AUTH0_EMAIL`: Email for Auth0 login
- `AUTH0_PASSWORD`: Password for Auth0 login
- `BUTTON_SELECTOR`: CSS selector of the button you want to click after login

### Button Selectors

The `BUTTON_SELECTOR` can be:
- A CSS selector: `button[type="submit"]`, `.my-class`, `#my-id`
- A text selector: `text=Click here`
- An XPath selector: `xpath=//button[@class='my-button']`

## Project Structure 🗂️
```
.
├── tests/
│   ├── auth0-login.spec.js         # Auth0 login tests
│   └── helpers/
│       └── auth0-helpers.js         # Reusable helper functions
├── playwright.config.js            # Playwright configuration
├── package.json                    # Project dependencies
├── .env.example                    # Environment variables example
└── README.md                       # This file
```

## Test Flow 📋
The main test performs the following steps:
1. **Validates environment variables** - Verifies that credentials are configured
2. **Navigates to the application** - Goes to the URL specified in `APP_URL`
3. **Finds the login button** - Automatically finds the button in the top right corner using position analysis or common selectors
4. **Clicks the button** - Activates the found button to start login
5. **Waits for Auth0 redirect** - Waits for the page to redirect to Auth0
6. **Fills the login form** - Fills email and password with credentials from `.env`
7. **Submits the form** - Clicks the Auth0 submit button
8. **Waits for redirect back** - Waits for Auth0 to redirect back to your application
9. **Clicks the target button** - Clicks the button specified in `BUTTON_SELECTOR`

**Note:** The browser console only opens automatically when running with `DEBUG=true` (debug mode).

## Included Tests 🗃️
1. **Successful login** - Main test that performs the complete login flow
2. **Error handling** - Verifies that error messages are shown with incorrect credentials
3. **Field validation** - Verifies that required fields work correctly

## Customization⏳
### Adjust the login flow
For a different application with a different login flow, you can edit:

1. **`tests/helpers/auth0-helpers.js`** - Modify the helper functions to adjust:
   - Email and password field selectors
   - Redirect wait logic
   - Login button search logic
   - Timeouts and constants

2. **`tests/auth0-login.spec.js`** - Adjust tests according to your needs

3. **`playwright.config.js`** - Modify global timeouts and configuration

### Add more tests
You can add more test files in the `tests/` folder with the `.spec.js` extension.

## Troubleshooting❗❗
### Test cannot find Auth0 fields❗
Auth0 may use different selectors. Check the browser console in debug mode (`npm run test:debug`) to see what selectors are available.

### Test fails due to timeout❗
Increase the timeout in `playwright.config.js` or adjust wait times in the test.

### Top right button not found❗
The test automatically searches for the button in the top right corner. If it's not found:
- Verify that the button is visible when the page loads
- Ensure the button is in the last 25% of the width and first 25% of the height
- You can adjust the thresholds in `tests/helpers/auth0-helpers.js` (constant `POSITION_THRESHOLDS`)

### Environment variables not configured❗
The test automatically validates that required environment variables are configured. If you see an error:
- Make sure you have a `.env` file with the correct credentials
- Verify that you're not using example values (the test detects them and fails)

### Target button not found❗
Verify that the `BUTTON_SELECTOR` in your `.env` is correct. Use debug mode or the automatically opened console to inspect the page after login.

## Reports 📊
After running the tests, you can view an HTML report by running:
```bash
npm run test:report
```

Or directly:
```bash
npx playwright show-report
```

## License
By Agustina Fassina
