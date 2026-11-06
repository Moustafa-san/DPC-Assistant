import crypto from "crypto";

export type PublicResourceType = "brief" | "quote" | "booking" | "invoice";

export interface PublicTokenRecord {
  id: string;
  ownerId: string;
  resourceType: PublicResourceType;
  resourceId: string;
  tokenHash: string;
  expiresAt: string; // ISO 8601 UTC
  revokedAt: string | null;
  rateLimitCount: number;
  rateLimitWindowStart: string; // ISO 8601 UTC
}

export interface GeneratedTokenResult {
  rawToken: string; // Given once to user to construct URL
  tokenHash: string; // Stored securely in database
  expiresAt: string;
}

/**
 * Generates a high-entropy 256-bit cryptographic token.
 */
export function generateSecureToken(expiresInHours: number = 72): GeneratedTokenResult {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiresDate = new Date(Date.now() + expiresInHours * 3600 * 1000);
  const expiresAt = expiresDate.toISOString();

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
}

/**
 * Computes SHA-256 hash of a raw token.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export interface TokenValidationResult {
  isValid: boolean;
  error?: "EXPIRED" | "REVOKED" | "RATE_LIMITED" | "INVALID_HASH";
  remainingRequests?: number;
}

/**
 * Validates a public token record against expiration, revocation, and rate limiting.
 * Rate limit policy: max 30 requests per 60-second window.
 */
export function validatePublicToken(
  record: PublicTokenRecord,
  maxRequestsPerMinute: number = 30,
  currentTime: Date = new Date()
): {
  result: TokenValidationResult;
  updatedRecord: PublicTokenRecord;
} {
  // Check if revoked
  if (record.revokedAt !== null) {
    return {
      result: { isValid: false, error: "REVOKED" },
      updatedRecord: record,
    };
  }

  // Check if expired
  const expiresDate = new Date(record.expiresAt);
  if (currentTime.getTime() > expiresDate.getTime()) {
    return {
      result: { isValid: false, error: "EXPIRED" },
      updatedRecord: record,
    };
  }

  // Check Rate Limiting Window
  const windowStart = new Date(record.rateLimitWindowStart);
  const windowElapsedSeconds = (currentTime.getTime() - windowStart.getTime()) / 1000;

  let newCount = record.rateLimitCount;
  let newWindowStart = record.rateLimitWindowStart;

  if (windowElapsedSeconds >= 60) {
    // Reset window
    newCount = 1;
    newWindowStart = currentTime.toISOString();
  } else {
    newCount += 1;
  }

  if (newCount > maxRequestsPerMinute) {
    return {
      result: { isValid: false, error: "RATE_LIMITED", remainingRequests: 0 },
      updatedRecord: {
        ...record,
        rateLimitCount: newCount,
        rateLimitWindowStart: newWindowStart,
      },
    };
  }

  const remaining = Math.max(0, maxRequestsPerMinute - newCount);

  return {
    result: { isValid: true, remainingRequests: remaining },
    updatedRecord: {
      ...record,
      rateLimitCount: newCount,
      rateLimitWindowStart: newWindowStart,
    },
  };
}
