import express from "express";
import bodyParser from "body-parser";
import puppeteer from "puppeteer";
import path from "path";
import crypto from "crypto";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("."));

//login gets new session 
const sessions = new Map();

app.get("/", (req, res) => {
  res.sendFile(path.resolve("./index.html"));
});

app.get("/loading", (req, res) => {
  res.sendFile(path.resolve("./loading.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.resolve("./dashboard.html"));
});

app.get("/status", (req, res) => {
  const {sessionID} = req.query;

  if(!sessionID || !sessions.has(sessionID)){
    return res.json({
      finished: true,
      assignmentsByDay: {},
      error: "Invalid Session"
    });
  }

  res.json(sessions.get(sessionID));
});

//helps with getting raw html instead of api garbage
function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getCourseIdFromContextCode(contextCode = "") {
  const match = contextCode.match(/^course_(\d+)$/);
  return match ? match[1] : null;
}

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const sessionId = crypto.randomUUID();

  sessions.set(sessionId, {
    finsihed: false,
    assignmentsByDay: {},
    error:null
  });

  res.redirect(`/loading?sessionID=${sessionId}`);

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });

    const page = await browser.newPage();
    let apiAssignemnts =[];

    page.on("response", async (response) => {
      try {
        const url = response.url();

        if (url.includes("/api/v1/calendar_events")) {
          const data = await response.json();

          apiAssignments = Array.isArray(data)
            ? data.filter((e) => e.type === "assignment" || e.assignment)
            : [];

          console.log("FILTERED ASSIGNMENTS:", apiAssignments);
        }
      } catch (err) {
        console.error("Response listener error:", err.message);
      }
    });

    //go to discovery
    await page.goto("https://discovery.canvas.txst.edu/", {
      waitUntil: "networkidle2"
    });

    //TXST login
    await page.waitForSelector("#txst-login", { visible: true });
    await page.click("#txst-login");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Get current active page after redirect
    const pages = await browser.pages();
    const loginPage = pages[pages.length - 1];

    loginPage.on("response", async (response) => {
      try{
        const url = response.url();

        if(url.includes("/api/v1/calandar_events")){
          const data = await response.json();

          apiAssignemnts = Array.isArray(data)
          ? data.filter((e) => e.type === "assignement" || e.assignemnt)
          : [];
          console.log("Filtered assignments:", apiAssignemnts);
        }
      }catch(err){
        console.error("login page response listener error:", err.message);
      }
    });

    console.log("URL after click:", loginPage.url());

    if (
      loginPage.url().includes("login_success") ||
      loginPage.url().includes("canvas.txstate.edu")
    ) {
      console.log("Already logged in, skipping login form");
    } else {
      console.log("Not logged in, filling form...");

      await loginPage.waitForSelector(
        "#username, input[name='username'], input[type='text']",
        {
          visible: true,
          timeout: 30000
        }
      );

      await loginPage.type(
        "#username, input[name='username'], input[type='text']",
        username
      );

      await loginPage.type('input[name="j_password"]', password);

      await loginPage.click(
        'button[name="_eventId_proceed"], button[type="submit"]'
      );

      console.log("Waiting for Duo...");
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }

    await loginPage.goto("https://canvas.txstate.edu/calendar", {
      waitUntil: "networkidle2"
    });

    console.log("Calendar page loaded");

    await new Promise((resolve) => setTimeout(resolve, 8000));

    const enrichedAssignments = await Promise.all(
      apiAssignments.map(async (a) => {
        try {
          const assignmentId =
            a.assignment_id ||
            a.assignment?.id ||
            a.assignment?.assignment_id ||
            null;

          const courseId =
            a.course_id ||
            a.assignment?.course_id ||
            getCourseIdFromContextCode(a.context_code);

          const existingHtml =
            a.description ||
            a.assignment?.description ||
            "";

          if (!assignmentId || !courseId) {
            return {
              ...a,
              descriptionHtml: existingHtml,
              descriptionText: stripHtml(existingHtml) || "No description"
            };
          }

          const details = await loginPage.evaluate(
            async ({ courseId, assignmentId }) => {
              const res = await fetch(
                `/api/v1/courses/${courseId}/assignments/${assignmentId}`,
                {
                  credentials: "include",
                  headers: {
                    Accept: "application/json"
                  }
                }
              );

              if (!res.ok) {
                throw new Error(`Assignment fetch failed: ${res.status}`);
              }

              return await res.json();
            },
            { courseId, assignmentId }
          );

          const descriptionHtml = details?.description || existingHtml || "";

          return {
            ...a,
            fullDetails: details,
            descriptionHtml,
            descriptionText: stripHtml(descriptionHtml) || "No description"
          };
        } catch (err) {
          console.error("Description fetch error:", err.message);

          const fallbackHtml =
            a.description ||
            a.assignment?.description ||
            "";

          return {
            ...a,
            descriptionHtml: fallbackHtml,
            descriptionText: stripHtml(fallbackHtml) || "No description"
          };
        }
      })
    );

    const assignmentsByDay = {};

    enrichedAssignments.forEach((a) => {
      const date = a.start_at ? a.start_at.split("T")[0] : "Unknown";

      if (!assignmentsByDay[date]) {
        assignmentsByDay[date] = [];
      }

      assignmentsByDay[date].push({
        title: a.title || a.fullDetails?.name || "Untitled Assignment",
        time: a.start_at
          ? new Date(a.start_at).toLocaleTimeString()
          : "No time",
        descriptionHtml: a.descriptionHtml || "",
        descriptionText: a.descriptionText || "No description",
        assignmentId:
          a.assignment_id ||
          a.assignment?.id ||
          a.assignment?.assignment_id ||
          null,
        courseId:
          a.course_id ||
          a.assignment?.course_id ||
          getCourseIdFromContextCode(a.context_code)
      });
    });

    sessions.set(sessionId, {
      finished: true,
      assignmentsByDay,
      error: null
    });

    console.log("Assignments ready");

    await browser.close();

    // optional cleanup after 10 minutes
    setTimeout(() => {
      sessions.delete(sessionId);
      console.log(`Session ${sessionId} cleaned up`);
    }, 10 * 60 * 1000);
  } catch (err) {
    console.error("ERROR:", err);

    sessions.set(sessionId, {
      finished: true,
      assignmentsByDay: {},
      error: "Error fetching assignments"
    });

    if (browser) {
      await browser.close();
    }

    setTimeout(() => {
      sessions.delete(sessionId);
    }, 10 * 60 * 1000);
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

  
