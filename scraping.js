 import puppeteer from "puppeteer";
 //using api instead of grabbing html buttons and whatnot 

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    userDataDir: "./tmp"
  });

  const page = await browser.newPage();

  let apiAssignments = [];

  //Canvas API scraping :3
  page.on("response", async (response) => {
    try {
      const url = response.url();

      if (url.includes("/api/v1/calendar_events")) {
        const data = await response.json();
        console.log("API SCRAPPING");

        apiAssignments = data.filter(e => e.type === "assignment");
      }
    } catch {}
  });

  try {
    // Go to discovery page
    await page.goto("https://discovery.canvas.txst.edu/", {
      waitUntil: "networkidle2"
    });

    console.log("URL:", page.url());
    await page.screenshot({ path: "step1_discovery.png" });

    //Click TXST login
    const loginBtn = await page.$("#txst-login");

    if (loginBtn) {
      await loginBtn.click();
      await new Promise(r => setTimeout(r, 5000));
    }

    console.log("After click URL:", page.url());
    await page.screenshot({ path: "step2_after_click.png" });

    //Try to find login form dynamically without grabbing actual buttons
    const usernameInput = await page.$("input[type='text']");
    const passwordInput = await page.$("input[type='password']");

    if (usernameInput && passwordInput) {
      console.log("Login detected");

      await page.type("input[type='text']", "YOUR_NETID");
      await page.type("input[type='password']", "YOUR_PASSWORD");

      await page.screenshot({ path: "step3_filled_form.png" }); //sreenshot for verification 

      await page.click("button[type='submit']");

      console.log("⏳ Waiting for Duo...");
      await new Promise(r => setTimeout(r, 60000)); //wat is new promise?

    } else {
      console.log("No login form prob already logged in");
    }

    console.log("After login URL:", page.url());
    await page.screenshot({ path: "step4_after_login.png" }); //ss for the url after log in

    // Go to calendar
    await page.goto("https://canvas.txstate.edu/calendar", {
      waitUntil: "networkidle2"
    });

    console.log("Calendar loaded");
    await page.screenshot({ path: "step5_calendar.png" }); //ss of calander for verification

    // waiting for api 
    await new Promise(r => setTimeout(r, 8000));

    console.log("📥 Assignments:", apiAssignments);

    // Groupinf the assignments and everything given by ai
    const assignmentsByDay = {};

    apiAssignments.forEach(a => {
      const date = a.start_at ? a.start_at.split("T")[0] : "Unknown";

      if (!assignmentsByDay[date]) {
        assignmentsByDay[date] = [];
      }

      assignmentsByDay[date].push({
        title: a.title,
        time: a.start_at
          ? new Date(a.start_at).toLocaleTimeString()
          : "No time"
      });
    });

    console.log("Grouped:", assignmentsByDay);

    await browser.close();
    console.log("DONE");

  } catch (err) {
    console.error("ERROR:", err);
    await browser.close();
  }
})(); 