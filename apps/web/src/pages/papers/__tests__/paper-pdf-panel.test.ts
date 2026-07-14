import { describe, expect, it } from "vitest";
import { getPaperPdfPanelState, type PaperPdfPanelInput } from "../paper-pdf-panel";

const basePaper: PaperPdfPanelInput["paper"] = {
  pdfPath: undefined,
  paperStatus: "not-downloaded",
  qualityTier: 1,
  downloadCost: 10,
  requestedBy: { _id: "requester" },
  uploadedBy: undefined,
};

describe("getPaperPdfPanelState", () => {
  it("hides the internal PDF panel from normal users when no PDF exists", () => {
    const state = getPaperPdfPanelState({
      paper: basePaper,
      currentUser: { id: "reader", role: "student" },
    });

    expect(state.shouldShowPanel).toBe(false);
    expect(state.canUploadPdf).toBe(false);
  });

  it("shows a pending approval notice without upload for requesters", () => {
    const state = getPaperPdfPanelState({
      paper: { ...basePaper, paperStatus: "pending" },
      currentUser: { id: "requester", role: "student" },
    });

    expect(state.shouldShowPanel).toBe(true);
    expect(state.mode).toBe("pending-approval");
    expect(state.canUploadPdf).toBe(false);
  });

  it("allows requester upload only after the request is ready for PDF", () => {
    const state = getPaperPdfPanelState({
      paper: { ...basePaper, paperStatus: "not-downloaded" },
      currentUser: { id: "requester", role: "student" },
    });

    expect(state.shouldShowPanel).toBe(true);
    expect(state.mode).toBe("upload");
    expect(state.canUploadPdf).toBe(true);
  });

  it("shows available PDF download state for accessible uploaded files", () => {
    const state = getPaperPdfPanelState({
      paper: { ...basePaper, pdfPath: "papers/demo.pdf", paperStatus: "downloaded" },
      currentUser: { id: "reader", role: "student" },
    });

    expect(state.shouldShowPanel).toBe(true);
    expect(state.mode).toBe("available");
    expect(state.canDownloadPdf).toBe(true);
  });

  it("does not allow public internal PDF download before download cost is set", () => {
    const state = getPaperPdfPanelState({
      paper: {
        ...basePaper,
        pdfPath: "papers/demo.pdf",
        paperStatus: "downloaded",
        downloadCost: undefined,
      },
      currentUser: { id: "reader", role: "student" },
    });

    expect(state.shouldShowPanel).toBe(true);
    expect(state.mode).toBe("available");
    expect(state.canDownloadPdf).toBe(false);
  });

  it("lets requester accept or reject a pending uploaded PDF", () => {
    const state = getPaperPdfPanelState({
      paper: {
        ...basePaper,
        pdfPath: "papers/demo.pdf",
        paperStatus: "pending-requester-acceptance",
        uploadedBy: { _id: "uploader" },
      },
      currentUser: { id: "requester", role: "student" },
    });

    expect(state.shouldShowPanel).toBe(true);
    expect(state.mode).toBe("awaiting-acceptance");
    expect(state.canAcceptPdf).toBe(true);
  });
});
