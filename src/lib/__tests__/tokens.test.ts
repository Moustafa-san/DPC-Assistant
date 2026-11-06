import { describe, it, expect } from "vitest";
import {
  generateSecureToken,
  hashToken,
  validatePublicToken,
  PublicTokenRecord,
} from "../tokens/crypto";

describe("Public Cryptographic Tokens & Rate Limiting", () => {
  it("generates high-entropy tokens and computes consistent SHA-256 hashes", () => {
    const { rawToken, tokenHash, expiresAt } = generateSecureToken(48);

    expect(rawToken.length).toBe(64); // 32 bytes in hex = 64 characters
    expect(tokenHash.length).toBe(64); // SHA-256 hex = 64 characters
    expect(hashToken(rawToken)).toBe(tokenHash);

    const now = new Date();
    const expiry = new Date(expiresAt);
    expect(expiry.getTime()).toBeGreaterThan(now.getTime());
  });

  it("validates an active, unexpired, unrevoked token successfully", () => {
    const { tokenHash, expiresAt } = generateSecureToken(24);

    const record: PublicTokenRecord = {
      id: "tok-1",
      ownerId: "photographer-1",
      resourceType: "brief",
      resourceId: "proj-wedding-1",
      tokenHash,
      expiresAt,
      revokedAt: null,
      rateLimitCount: 5,
      rateLimitWindowStart: new Date().toISOString(),
    };

    const { result, updatedRecord } = validatePublicToken(record, 30);
    expect(result.isValid).toBe(true);
    expect(result.remainingRequests).toBe(24); // 30 - 6 = 24
    expect(updatedRecord.rateLimitCount).toBe(6);
  });

  it("rejects an expired token immediately", () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString(); // Expired 1 hr ago

    const record: PublicTokenRecord = {
      id: "tok-expired",
      ownerId: "photographer-1",
      resourceType: "invoice",
      resourceId: "inv-1",
      tokenHash: "fakehash",
      expiresAt: pastDate,
      revokedAt: null,
      rateLimitCount: 0,
      rateLimitWindowStart: pastDate,
    };

    const { result } = validatePublicToken(record, 30);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("EXPIRED");
  });

  it("rejects a revoked token immediately", () => {
    const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();

    const record: PublicTokenRecord = {
      id: "tok-revoked",
      ownerId: "photographer-1",
      resourceType: "quote",
      resourceId: "quote-1",
      tokenHash: "fakehash",
      expiresAt: futureDate,
      revokedAt: new Date().toISOString(), // Revoked by user!
      rateLimitCount: 0,
      rateLimitWindowStart: new Date().toISOString(),
    };

    const { result } = validatePublicToken(record, 30);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("REVOKED");
  });

  it("enforces rate limits when requests exceed threshold within window", () => {
    const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();

    let record: PublicTokenRecord = {
      id: "tok-rate-limit",
      ownerId: "photographer-1",
      resourceType: "brief",
      resourceId: "brief-1",
      tokenHash: "hash-rl",
      expiresAt: futureDate,
      revokedAt: null,
      rateLimitCount: 29, // 29 already consumed
      rateLimitWindowStart: new Date().toISOString(),
    };

    // 30th request (Allowed)
    const step30 = validatePublicToken(record, 30);
    expect(step30.result.isValid).toBe(true);
    expect(step30.result.remainingRequests).toBe(0);
    record = step30.updatedRecord;

    // 31st request (BLOCKED)
    const step31 = validatePublicToken(record, 30);
    expect(step31.result.isValid).toBe(false);
    expect(step31.result.error).toBe("RATE_LIMITED");
  });
});
