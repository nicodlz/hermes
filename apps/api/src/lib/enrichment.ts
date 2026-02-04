/**
 * Lead Enrichment - Email finder integration
 * 
 * Supports multiple providers with fallback:
 * 1. Hunter.io (25 free requests/month)
 * 2. Manual parsing from LinkedIn/website
 */

interface EnrichmentResult {
  email?: string;
  confidence?: number;
  source: string;
  raw?: any;
}

interface HunterResponse {
  data?: {
    email?: string;
    score?: number;
    sources?: Array<{ uri: string }>;
  };
  errors?: Array<{ details: string }>;
}

/**
 * Find email using Hunter.io Email Finder API
 * Requires: domain + (first_name + last_name) OR full_name
 */
export async function findEmailWithHunter(params: {
  domain?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}): Promise<EnrichmentResult> {
  const apiKey = process.env.HUNTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("HUNTER_API_KEY not configured");
  }

  if (!params.domain) {
    throw new Error("Domain is required for Hunter.io");
  }

  // Build query parameters
  const query = new URLSearchParams({
    domain: params.domain,
    api_key: apiKey,
  });

  if (params.firstName && params.lastName) {
    query.append("first_name", params.firstName);
    query.append("last_name", params.lastName);
  } else if (params.fullName) {
    query.append("full_name", params.fullName);
  } else {
    throw new Error("Either firstName+lastName or fullName is required");
  }

  const url = `https://api.hunter.io/v2/email-finder?${query}`;
  
  const response = await fetch(url);
  const data = await response.json() as HunterResponse;

  if (data.errors && data.errors.length > 0) {
    throw new Error(`Hunter.io error: ${data.errors[0].details}`);
  }

  if (!data.data?.email) {
    return {
      source: "hunter.io",
      confidence: 0,
    };
  }

  return {
    email: data.data.email,
    confidence: data.data.score || 0,
    source: "hunter.io",
    raw: data.data,
  };
}

/**
 * Extract domain from company name or website
 */
export function extractDomain(input: string): string | null {
  // Remove common prefixes
  let cleaned = input.toLowerCase().trim();
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, "");
  
  // Remove path and query params
  cleaned = cleaned.split("/")[0];
  cleaned = cleaned.split("?")[0];
  
  // If it looks like a domain, return it
  if (cleaned.includes(".")) {
    return cleaned;
  }
  
  // Otherwise, assume it's a company name and add .com
  // (naive approach, could be improved with company → domain API)
  return `${cleaned}.com`;
}

/**
 * Parse name into first/last
 */
export function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  
  // First word = first name, rest = last name
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  
  return { firstName, lastName };
}

/**
 * Extract LinkedIn username from URL
 */
export function extractLinkedInUsername(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([^/]+)/);
  return match ? match[1] : null;
}
