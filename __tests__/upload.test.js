function isSupportedFile(filename) {
  return /\.(txt|pdf|docx)$/i.test(filename);
}

describe("Assignment Upload File Types", () => {
  test("accepts txt files", () => {
    expect(isSupportedFile("hw.txt")).toBe(true);
  });

  test("accepts pdf files", () => {
    expect(isSupportedFile("hw.pdf")).toBe(true);
  });

  test("accepts docx files", () => {
    expect(isSupportedFile("hw.docx")).toBe(true);
  });
});