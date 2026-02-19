const puppeteer = require('puppeteer');

(async() => {
const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp"
});
const page = await browser.newPage();
    await page.goto('https://canvas.txstate.edu/login');

    
//await page.screenshot({path : 'example.png'}); screenshot of loading for confirmation

//await browser.close(); closes browser
})();