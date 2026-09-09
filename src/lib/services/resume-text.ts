// Best-effort text extraction so resumes are searchable and usable by the
// (future) AI match/tailor features. Falls back to empty string on failure —
// the file itself is always preserved regardless of extraction success.
export async function extractResumeText(
  buffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    if (contentType === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      return result.text.trim();
    }

    if (
      contentType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    }

    if (contentType === "text/plain") {
      return buffer.toString("utf-8").trim();
    }
  } catch {
    return "";
  }

  return "";
}
