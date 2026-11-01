import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerClientAddress } from "../src/infrastructure/client-address.js";

async function addressFor(
  trustRailwayProxy: boolean,
  headers: Record<string, string>,
  remoteAddress = "127.0.0.1",
): Promise<string> {
  const app = Fastify();
  registerClientAddress(app, { trustRailwayProxy });
  app.get("/", async (request) => ({ address: request.clientAddress }));
  const response = await app.inject({
    method: "GET",
    url: "/",
    headers,
    remoteAddress,
  });
  await app.close();
  return response.json().address;
}

describe("client address", () => {
  it("ignores X-Real-IP when not behind Railway", async () => {
    expect(await addressFor(false, { "x-real-ip": "203.0.113.9" })).toBe(
      "127.0.0.1",
    );
  });

  it("uses X-Real-IP behind Railway", async () => {
    expect(await addressFor(true, { "x-real-ip": "203.0.113.9" })).toBe(
      "203.0.113.9",
    );
  });

  it("falls back on a zoned or invalid X-Real-IP", async () => {
    expect(await addressFor(true, { "x-real-ip": "fe80::1%eth0" })).toBe(
      "127.0.0.1",
    );
    expect(await addressFor(true, { "x-real-ip": "not-an-ip" })).toBe(
      "127.0.0.1",
    );
  });

  it("unwraps IPv4-mapped IPv6 addresses", async () => {
    expect(await addressFor(true, { "x-real-ip": "::ffff:198.51.100.2" })).toBe(
      "198.51.100.2",
    );
    expect(await addressFor(false, {}, "::ffff:198.51.100.3")).toBe(
      "198.51.100.3",
    );
  });
});
