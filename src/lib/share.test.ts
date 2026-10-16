import { describe, expect, it } from "vitest";
import { ShareCancelled, presentSharedFile } from "@/lib/download";

function png(name = "qr.png") {
  return new File(["png"], name, { type: "image/png" });
}

function pdf() {
  return new File(["pdf"], "qr.pdf", { type: "application/pdf" });
}

describe("presentSharedFile", () => {
  it("shares the first file the device accepts", async () => {
    const shared: string[] = [];
    const result = await presentSharedFile([pdf(), png()], "Cafe", {
      canShare: (data) => data.files[0]?.type === "image/png",
      share: async (data) => {
        shared.push(data.files[0]?.name ?? "");
      },
    });

    expect(result.method).toBe("shared");
    expect(result.file.name).toBe("qr.png");
    expect(shared).toEqual(["qr.png"]);
  });

  it("stops when the share menu is dismissed", async () => {
    const copyImage = async () => {
      throw new Error("should not copy");
    };
    const dismissed = new Error("dismissed");
    dismissed.name = "AbortError";

    await expect(
      presentSharedFile([png()], "Cafe", {
        share: async () => {
          throw dismissed;
        },
        copyImage,
      }),
    ).rejects.toBeInstanceOf(ShareCancelled);
  });

  it("copies the link as text when no share menu is available", async () => {
    let text = "";
    let imageCopied = false;
    const result = await presentSharedFile(
      [png("code.png")],
      "Cafe",
      {
        canShare: () => false,
        copyText: async (value) => {
          text = value;
        },
        copyImage: async () => {
          imageCopied = true;
        },
      },
      "https://example.com/menu",
    );

    expect(result.method).toBe("copied");
    expect(text).toBe("https://example.com/menu");
    expect(imageCopied).toBe(false);
  });

  it("copies the image when no share menu is available", async () => {
    let copied = "";
    const result = await presentSharedFile([pdf(), png("code.png")], "Cafe", {
      canShare: () => false,
      share: async () => {
        throw new Error("should not share");
      },
      copyImage: async (file) => {
        copied = file.name;
      },
    });

    expect(result.method).toBe("copied");
    expect(copied).toBe("code.png");
  });

  it("explains when the image cannot be shared or copied", async () => {
    await expect(presentSharedFile([pdf()], "Cafe", { canShare: () => false })).rejects.toThrow(
      /Download the image/,
    );
  });
});
