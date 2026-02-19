const puppeteer = require('puppeteer');
//DO NOT RUN!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!///
(async () => {
   const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: false,
      userDataDir: "./tmp"
   });
   const page = await browser.newPage();
   await page.goto('https://canvas.txstate.edu/calendar#view_name=month&view_start=2024-11-17');

   await page.waitForSelector('#calendar-app > div.calendar.fc.fc-unthemed.fc-ltr');

   const calendarEntries = await page.$$('#calendar-app > div.calendar.fc.fc-unthemed.fc-ltr > div > div');

   for(const entry of calendarEntries){

      const outerHTML = await page.evaluate(e1 => e1.outterHTML, entry);
      console.log('Entry HTML:', outerHTML);

      
      const title = await page.evaluate(e1 =>{
          const cell = e1.querySelector('table > tbody > tr:nth-child(1) > td:nth-child(2)');
         return cell ? cell.textContent.trim() : 'No title found';
      }, entry);
      console.log('Calendar Entry:', title);
   }

})(); //scraping of the calander page on canvas