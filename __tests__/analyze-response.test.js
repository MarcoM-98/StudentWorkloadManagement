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

describe("Analyze API JSON Response", () => {
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
          json: () => Promise.resolve({ filename: "hw1.txt" }),
        });
      }

      if (url === "/api/analyze") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                minutes: 90,
                due_date: "2026-05-01",
                keywords: ["quiz"],
                isActionable: true,
              },
            }),
        });
      }
    });
  });

  test("analyze response populates extracted assignment data", async () => {
    const { container } = render(<UploadForm />);

    const fileInput = container.querySelector('input[type="file"]');

    const file = new File(["hello"], "hw1.txt", {
      type: "text/plain",
    });

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: /upload/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/review and edit the extracted assignment details below/i)
      ).toBeTruthy();
    });

    expect(screen.getByText("Mock Review Form")).toBeTruthy();
  });
});