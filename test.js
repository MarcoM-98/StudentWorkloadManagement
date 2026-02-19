import puppeteer from 'puppeteer';

async function run() {
  // Launch the browser in non-headless mode
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp" });

  const page = await browser.newPage();
  
  // Navigate to the initial URL and wait for it to load
  await page.goto('https://discovery.canvas.txst.edu/', { waitUntil: 'networkidle2' });

  // Wait for the TXST login button to appear and click it
  await page.waitForSelector('#txst-login', { visible: true });
  await page.click('#txst-login');

  // Wait for the navigation to the login page
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Input the username and password
  await page.type('#username', 'isc33');  //enter your netID for 
  await page.type('input[name="j_password"]', 'HERSHEYjellybean123!');  //Enter your pass in the last prompt

  // Use a timeout to ensure fields are populated
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

  // Click the login button
  await page.evaluate(() => {
    document.querySelector('button.form-element.form-button[name="_eventId_proceed"]').click();
  });

  // Wait for the Duo Security prompt
  await page.waitForSelector('img[src*="duosecurity.com"]', { visible: true }); // Adjust selector as needed for your scenario

  // Keep the browser open for manual 2FA verification
  console.log("Please complete the 2FA verification manually.");

  // Optionally, take a screenshot to confirm login success
  await page.screenshot({ path: 'duo-prompt-screenshot.png' });

  // Keep the browser open for further inspection
  await page.waitForSelector()
}

run().catch(console.error);
