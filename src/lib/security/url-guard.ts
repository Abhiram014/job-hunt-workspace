import dns from "dns/promises";
import net from "net";

// Blocks SSRF: only allow fetching job posting pages from public hosts over
// http/https, never internal/loopback/link-local/metadata addresses.
export class UnsafeUrlError extends Error {}

function ipToLong(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const long = ipToLong(ip);
  const ranges: [string, number][] = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16], // includes cloud metadata (169.254.169.254)
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["224.0.0.0", 3],
  ];
  return ranges.some(([base, bits]) => {
    const baseLong = ipToLong(base);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (long & mask) === (baseLong & mask);
  });
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower.startsWith("fe80:") || // link-local
    lower.startsWith("fc") ||
    lower.startsWith("fd") || // unique local
    lower.startsWith("::ffff:127.") ||
    lower.startsWith("::ffff:10.") ||
    lower.startsWith("::ffff:192.168.")
  );
}

export async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("Not a valid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http/https URLs are allowed");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new UnsafeUrlError("Local addresses are not allowed");
  }

  if (net.isIP(hostname)) {
    if (net.isIP(hostname) === 4 && isPrivateIPv4(hostname)) {
      throw new UnsafeUrlError("Private IP addresses are not allowed");
    }
    if (net.isIP(hostname) === 6 && isPrivateIPv6(hostname)) {
      throw new UnsafeUrlError("Private IP addresses are not allowed");
    }
    return url;
  }

  const records = await dns.lookup(hostname, { all: true });
  for (const record of records) {
    if (record.family === 4 && isPrivateIPv4(record.address)) {
      throw new UnsafeUrlError("This host resolves to a private address");
    }
    if (record.family === 6 && isPrivateIPv6(record.address)) {
      throw new UnsafeUrlError("This host resolves to a private address");
    }
  }

  return url;
}
