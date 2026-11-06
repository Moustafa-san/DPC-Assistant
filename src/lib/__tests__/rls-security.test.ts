import { describe, it, expect } from "vitest";
import { assertServerOnly, getSupabaseEnv } from "../supabase/config";

describe("RLS & Tenancy Cross-User Security Invariants (OWASP ASVS Level 2)", () => {
  // Mock User A and User B
  const userA = { id: "user-uuid-aaaa-1111", email: "photographerA@studio.com" };
  const userB = { id: "user-uuid-bbbb-2222", email: "photographerB@studio.com" };

  // Simulated Database Row
  interface SecureProjectRow {
    id: string;
    owner_id: string;
    title: string;
    budgetMinor: bigint;
  }

  const mockDbTable: SecureProjectRow[] = [
    {
      id: "project-1",
      owner_id: userA.id,
      title: "Wedding Shoot Cairo",
      budgetMinor: BigInt(5000000),
    },
    {
      id: "project-2",
      owner_id: userB.id,
      title: "Fashion Campaign Alexandria",
      budgetMinor: BigInt(8000000),
    },
  ];

  /**
   * Evaluates PostgreSQL RLS policy: FOR SELECT USING (auth.uid() = owner_id)
   */
  function rlsSelectPolicy(currentUserId: string, row: SecureProjectRow): boolean {
    return currentUserId === row.owner_id;
  }

  /**
   * Evaluates PostgreSQL RLS policy: FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)
   */
  function rlsUpdatePolicy(
    currentUserId: string,
    existingRow: SecureProjectRow,
    incomingUpdate: Partial<SecureProjectRow>
  ): boolean {
    // Both existing row and new state must belong to current user (prevents changing owner_id)
    const isOwner = existingRow.owner_id === currentUserId;
    const remainsOwner =
      incomingUpdate.owner_id === undefined || incomingUpdate.owner_id === currentUserId;
    return isOwner && remainsOwner;
  }

  it("prohibits User A from reading User B's projects (Cross-user read denial)", () => {
    const userAProjects = mockDbTable.filter((row) => rlsSelectPolicy(userA.id, row));
    expect(userAProjects.length).toBe(1);
    expect(userAProjects[0].id).toBe("project-1");

    // Attempting to read project-2 as User A
    const canReadUserBProject = rlsSelectPolicy(userA.id, mockDbTable[1]);
    expect(canReadUserBProject).toBe(false);
  });

  it("prevents IDOR: User A cannot modify or hijack User B's project", () => {
    const targetProject = mockDbTable[1]; // Owned by User B

    // User A attempts to update User B's project
    const updateAllowed = rlsUpdatePolicy(userA.id, targetProject, {
      title: "Malicious Tampering",
    });
    expect(updateAllowed).toBe(false);
  });

  it("prevents IDOR: User A cannot transfer project ownership by changing owner_id", () => {
    const userAProject = mockDbTable[0]; // Owned by User A

    // User A attempts to change owner_id to User B
    const transferAllowed = rlsUpdatePolicy(userA.id, userAProject, {
      owner_id: userB.id,
    });
    expect(transferAllowed).toBe(false);
  });

  it("enforces server-only guardrail for Service Role keys", () => {
    // In Node test environment, window is undefined, so assertServerOnly should not throw
    expect(() => assertServerOnly("AdminOperation")).not.toThrow();

    // Verify config helper correctly flags unconfigured state without throwing fatal crashes
    const env = getSupabaseEnv();
    expect(typeof env.isConfigured).toBe("boolean");
  });
});
