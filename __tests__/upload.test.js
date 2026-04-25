import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UploadForm from "@/components/UploadForm";

jest.mock("@/components/AssignmentReviewForm", () => {
  return function MockAssignmentReviewForm() {
    return <div>Mock Review Form</div>;
  };
});

jest.mock("@/components/SavedAssignmentsList", () => {
  return function MockSavedAssignmentsList() {
    return <div>Mock Saved Assignments</div>;
  };
});

describe("Assignment Upload API Calls", () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url === "/api/assignments") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }

      if (url === "/api/upload") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ filename: "test-assignment.txt" }),
        });
      }

      if (url === "/api/analyze") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                minutes: 120,
                due_date: "2026-04-30",
                keywords: [],
                isActionable: true,
              },
            }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch call: ${url}`));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("upload button calls upload and analyze API routes", async () => {
    const { container } = render(<UploadForm />);

    const fileInput = container.querySelector('input[type="file"]');

    const file = new File(["Assignment text"], "test-assignment.txt", {
      type: "text/plain",
    });

    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /upload/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/upload",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      );
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/analyze",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: "test-assignment.txt",
          }),
        })
      );
    });
  });
});