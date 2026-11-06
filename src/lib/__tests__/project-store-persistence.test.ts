import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "../store/project-store";
import { defaultProjectRepository } from "../repositories/project-repository";

describe("Project Store & Persistence Integration (Commit 10)", () => {
  const testUserId = "user-photographer-clean-uuid";

  beforeEach(() => {
    useProjectStore.getState().resetStore();
  });

  it("initializes with a strictly clean, empty state with ZERO sample data", () => {
    const state = useProjectStore.getState();

    // Verify no sample client or project data exists
    expect(state.projectId).toBe("");
    expect(state.projectTitle).toBe("");
    expect(state.client.name).toBe("");
    expect(state.client.email).toBe("");
    expect(state.costItems.length).toBe(0);
    expect(state.shots.length).toBe(0);
    expect(state.gearPackingList.length).toBe(0);
    expect(state.payments.length).toBe(0);
    expect(state.ledgerEntries.length).toBe(0);
    expect(state.tasks.length).toBe(0);
  });

  it("creates a fresh project and auto-persists updates to repository", async () => {
    const store = useProjectStore.getState();

    // 1. User signs in and creates project
    await store.loadForUser(testUserId);
    const activeState = useProjectStore.getState();

    expect(activeState.ownerId).toBe(testUserId);
    expect(activeState.projectId).toBeTruthy();
    expect(activeState.projectTitle).toBe("مشروعي الأول");

    // 2. User updates project details
    store.setProjectDetails({ projectTitle: "جلسة تصوير إعلانية لشركة التقنية" });
    await store.saveActiveProject();
    expect(useProjectStore.getState().projectTitle).toBe("جلسة تصوير إعلانية لشركة التقنية");

    // 3. User adds a cost item
    store.addCostItem({
      id: "item-101",
      name: "كاميرا سينمائية",
      category: "gear",
      quantity: 1,
      unitCostMinor: 500000n,
      currency: "EGP",
    });
    await store.saveActiveProject();

    expect(useProjectStore.getState().costItems.length).toBe(1);
    expect(useProjectStore.getState().costItems[0].name).toBe("كاميرا سينمائية");

    // 4. Verify projects loaded for user contains the persisted project
    const loadedProjects = await defaultProjectRepository.loadProjects(testUserId);
    expect(loadedProjects.length).toBeGreaterThanOrEqual(1);
    expect(loadedProjects[0].title).toBe("جلسة تصوير إعلانية لشركة التقنية");
  });
});
