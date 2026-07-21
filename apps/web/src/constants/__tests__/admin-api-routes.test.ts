import { describe, expect, it } from "vitest";

import { API_ROUTES } from "../api";

describe("OpenAlex ingest admin routes", () => {
  it("matches the backend router mount without the legacy sync segment", () => {
    expect(API_ROUTES.admin.openAlexIngestPreflight).toBe("/admin/openalex-ingest/preflight");
    expect(API_ROUTES.admin.openAlexIngestCampaigns).toBe("/admin/openalex-ingest/campaigns");
    expect(API_ROUTES.admin.openAlexIngestCampaign("campaign-id")).toBe("/admin/openalex-ingest/campaigns/campaign-id");
    expect(API_ROUTES.admin.startOpenAlexIngestCampaign("campaign-id")).toBe("/admin/openalex-ingest/campaigns/campaign-id/start");
    expect(API_ROUTES.admin.pauseOpenAlexIngestCampaign("campaign-id")).toBe("/admin/openalex-ingest/campaigns/campaign-id/pause");
    expect(API_ROUTES.admin.cancelOpenAlexIngestCampaign("campaign-id")).toBe("/admin/openalex-ingest/campaigns/campaign-id/cancel");
  });
});
