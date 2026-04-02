import express from "express";
import bodyParser from "body-parser";
import puppeteer from "puppeteer";
import path from "path";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("."));

let assignmentsData = { finished: false, assignmentsByDay: {} };

app.get("/", (req, res) => res.sendFile(path.resolve("./index.html")));
app.get("/loading", (req, res) => res.sendFile(path.resolve("./loading.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.resolve("./dashboard.html")));
app.get("/status", (req, res) => res.json(assignmentsData));

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  assignmentsData = { finished: false, assignmentsByDay: {} };
  res.redirect("/loading");

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      userDataDir: "./tmp"
    });

    const page = await browser.newPage();

    //go to discovery
    await page.goto("https://discovery.canvas.txst.edu/", {
      waitUntil: "networkidle2"
    });

    //TXST login
    await page.waitForSelector("#txst-login", { visible: true });
    await page.click("#txst-login");

    await new Promise(r => setTimeout(r, 3000));

    // Get current active page after redirect
    const pages = await browser.pages();
    const loginPage = pages[pages.length - 1];

    console.log("URL after click:", loginPage.url());

    let apiAssignments = [];

    // Listen for Canvas calendar API responses on the real page
    loginPage.on("response", async (response) => {
      try {
        const url = response.url();

        if (url.includes("/api/v1/calendar_events")) {
          const data = await response.json();
          console.log("RAW API RESPONSE:", data);  //terminal

          apiAssignments = Array.isArray(data)
            ? data.filter(e => e.type === "assignment" || e.assignment)
            : [];

          console.log("FILTERED ASSIGNMENTS:", apiAssignments);
        }
      } catch (err) {
        console.error("Response listener error:", err);
      }
    });

    // Step 3: only log in if not already logged in
    if (
      loginPage.url().includes("login_success") ||
      loginPage.url().includes("canvas.txstate.edu")
    ) {
      console.log("Already logged in, skipping login form");
    } else {
      console.log("Not logged in, filling form...");

      await loginPage.waitForSelector(
        "#username, input[name='username'], input[type='text']",
        { visible: true, timeout: 30000 }
      );

      await loginPage.type(
        "#username, input[name='username'], input[type='text']",
        username
      );

      await loginPage.type('input[name="j_password"]', password);

      await loginPage.click('button[name="_eventId_proceed"], button[type="submit"]');

      console.log("Waiting for Duo...");
      await new Promise(r => setTimeout(r, 60000));
    }

    // Step 4: open calendar so Canvas triggers its own API request
    await loginPage.goto("https://canvas.txstate.edu/calendar", {
      waitUntil: "networkidle2"
    });

    console.log("Calendar page loaded");

    // Wait for the API response listener to capture the assignments
    await new Promise(r => setTimeout(r, 8000));

    // Group assignments by day
    const assignmentsByDay = {};

    apiAssignments.forEach(a => {
      const date = a.start_at ? a.start_at.split("T")[0] : "Unknown";

      if (!assignmentsByDay[date]) {
        assignmentsByDay[date] = [];
      }

      assignmentsByDay[date].push({
        title: a.title || "Untitled Assignment",
        time: a.start_at
          ? new Date(a.start_at).toLocaleTimeString()
          : "No time"
      });
    });

    console.log("GROUPED ASSIGNMENTS:", assignmentsByDay);

    assignmentsData = {
      finished: true,
      assignmentsByDay
    };

    console.log("Assignments ready");

    await browser.close();
  } catch (err) {
    console.error("ERROR:", err);

    assignmentsData = {
      finished: true,
      assignmentsByDay: {}
    };

    if (browser) {
      await browser.close();
    }
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});