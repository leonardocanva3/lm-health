import { expect, test } from "@playwright/test";

import { getWorkspacePublicationStatus } from "@/lib/workspaces/publication-status";

test.describe("workspace publication status", () => {
  test("marks portal as incomplete without a slug and commercial fields", () => {
    const status = getWorkspacePublicationStatus({
      logoUrl: null,
      name: "",
      primaryColor: null,
      secondaryColor: null,
      slug: "",
      specialty: null,
      whatsapp: null,
    });

    expect(status.isPublished).toBe(false);
    expect(status.completedCount).toBe(0);
    expect(status.checklistItems.find((item) => item.id === "slug")?.isComplete).toBe(false);
  });

  test("marks portal as published when every required field is present", () => {
    const status = getWorkspacePublicationStatus({
      logoUrl: "https://example.com/logo.png",
      name: "Clinica Modelo",
      primaryColor: "#047857",
      secondaryColor: "#0f172a",
      slug: "clinica-modelo",
      specialty: "Fisioterapia",
      whatsapp: "(11) 99999-9999",
    });

    expect(status.isPublished).toBe(true);
    expect(status.completedCount).toBe(status.totalCount);
  });
});
