import request from "supertest";
import app, { sessions } from "../server.js";

describe("GET /status", () => {

  test("returns error for invalid sessionId", async () => {
    const res = await request(app).get("/status?sessionId=invalid123");

    expect(res.status).toBe(200);
    expect(res.body.error).toBe("Invalid session");
    expect(res.body.assignmentsByDay).toEqual({});
  });

});
test("returns assignments for valid sessionId", async () => {
  const sessionId = "test-session";

  sessions.set(sessionId, {
    finished: true,
    assignmentsByDay: {
      "2026-04-24": [
        { title: "Test Assignment", time: "11:59 PM" }
      ]
    },
    error: null
  });

  const res = await request(app).get(`/status?sessionId=${sessionId}`);

  expect(res.status).toBe(200);
  expect(res.body.finished).toBe(true);
  expect(res.body.assignmentsByDay["2026-04-24"]).toHaveLength(1);

  import { stripHtml } from "../server.js";

test("stripHtml removes HTML correctly", () => {
  const input = "<p>Hello <b>world</b></p>";
  const output = stripHtml(input);

  expect(output).toBe("Hello world");
});
});
