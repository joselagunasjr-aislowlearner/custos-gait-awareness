import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const publicCopyFiles = [
  "src/App.tsx",
  "README.md",
  "docs/DEVPOST_DRAFT.md",
  "docs/VIDEO_SCRIPT.md",
  "docs/SUBMISSION_CHECKLIST.md",
];

describe("public claim and language boundary", () => {
  it.each(publicCopyFiles)("keeps %s inside the approved language", (file) => {
    const copy = readFileSync(resolve(file), "utf8");
    expect(copy).not.toMatch(
      /\b(elderly|monitoring|surveillance|inspection)\b|Digital Shield|Parkinson|Alzheimer/i,
    );
  });
});
