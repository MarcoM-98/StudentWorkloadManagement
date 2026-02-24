import express from "express";
import bodyParser from "body-parser";
import puppeteer from "puppeteer";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the login page (GUI)
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Canvas Login</title>
        <style>
          body {
            font-family: Arial;
            background: #f4f6f8;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          form {
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            width: 300px;
          }
          input, button {
            width: 100%;
            margin-top: 10px;
            padding: 8px;
          }
          button {
            background: #5a7cff;
            color: white;
            border: none;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <form method="POST" action="/login">
          <h2>Canvas Login</h2>
          <input name="username" placeholder="NetID" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
      </body>
    </html>
  `);
});

// Handle form submission
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  res.send("Logging in… Please complete Duo authentication if prompted. You may close this tab.");

  try {
    const browser = await puppeteer.launch({
      headless: false,          // must be visible for Duo
      defaultViewport: false,
      userDataDir: "./tmp"
    });

    const page = await browser.newPage();

    // Navigate to Canvas login
    await page.goto('https://discovery.canvas.txst.edu/', { waitUntil: 'networkidle2' });

    // Click TXST login button
    await page.waitForSelector('#txst-login', { visible: true });
    await page.click('#txst-login');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Enter credentials
    await page.type('#username', username);
    await page.type('input[name="j_password"]', password);

    // Give input a moment
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

    // Click the login button
    await page.evaluate(() => {
      document.querySelector('button.form-element.form-button[name="_eventId_proceed"]').click();
    });

    console.log("Waiting for Duo authentication…");

    // Give user time for Duo
    await page.waitForTimeout(60000);

    // Optional: take screenshot for verification
    await page.screenshot({ path: 'duo-prompt-screenshot.png' });

    await browser.close();
    console.log("Login script finished.");

  } catch (err) {
    console.error("Error during Puppeteer login:", err);
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});