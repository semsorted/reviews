import { describe, expect, it, vi } from "vitest";
import { copyDraft, copyViaCommand } from "@/lib/reviews/copy-draft";

describe("copyDraft", () => {
  it("copies the exact text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyDraft("Good service.", { writeText })).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("Good service.");
  });

  it("reports a blocked clipboard", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("NotAllowedError"));
    await expect(copyDraft("Good service.", { writeText })).resolves.toBe(false);
  });

  it("reports a missing clipboard", async () => {
    await expect(copyDraft("Good service.", undefined)).resolves.toBe(false);
  });
});

describe("copyViaCommand", () => {
  function fakeDocument(result: boolean | Error) {
    const field = { value: "", style: {}, setAttribute: vi.fn(), select: vi.fn(), setSelectionRange: vi.fn(), remove: vi.fn() };
    const doc = {
      body: { appendChild: vi.fn() },
      createElement: vi.fn(() => field),
      execCommand: vi.fn(() => {
        if (result instanceof Error) throw result;
        return result;
      }),
    };
    return { doc: doc as unknown as Document, field };
  }

  it("copies from a read-only field so the phone keyboard stays closed", () => {
    const { doc, field } = fakeDocument(true);
    expect(copyViaCommand("Good service.", doc)).toBe(true);
    expect(field.value).toBe("Good service.");
    expect(field.setAttribute).toHaveBeenCalledWith("readonly", "");
    expect(field.remove).toHaveBeenCalled();
  });

  it("reports a refused command", () => {
    const { doc, field } = fakeDocument(false);
    expect(copyViaCommand("Good service.", doc)).toBe(false);
    expect(field.remove).toHaveBeenCalled();
  });

  it("reports a thrown command", () => {
    const { doc, field } = fakeDocument(new Error("blocked"));
    expect(copyViaCommand("Good service.", doc)).toBe(false);
    expect(field.remove).toHaveBeenCalled();
  });
});
