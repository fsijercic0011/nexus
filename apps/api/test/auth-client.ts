import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import * as OTPAuth from "otpauth";
import { nextTestAddress } from "./test-config.js";

export const TEST_PASSWORD = "correct horse battery staple";

/** A cookie-keeping client for Better Auth endpoints via app.inject. */
export class AuthTestClient {
  private cookies = new Map<string, string>();
  readonly remoteAddress = nextTestAddress();

  constructor(private readonly app: FastifyInstance) {}

  get cookieHeader(): string {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  async request(
    method: "GET" | "POST" | "PATCH",
    url: string,
    payload?: unknown,
    headers: Record<string, string> = {},
  ): Promise<LightMyRequestResponse> {
    const response = await this.app.inject({
      method,
      url,
      remoteAddress: this.remoteAddress,
      headers: { ...headers, cookie: this.cookieHeader },
      ...(payload === undefined ? {} : { payload: payload as object }),
    });
    for (const raw of [response.headers["set-cookie"] ?? []].flat()) {
      const [pair = ""] = raw.split(";");
      const index = pair.indexOf("=");
      const name = pair.slice(0, index);
      const value = pair.slice(index + 1);
      if (/max-age=0/i.test(raw) || value === "") this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return response;
  }

  signUp(email = "owner@example.com", name = "Owner") {
    return this.request("POST", "/api/auth/sign-up/email", {
      email,
      password: TEST_PASSWORD,
      name,
    });
  }

  signIn(email = "owner@example.com", password = TEST_PASSWORD) {
    return this.request("POST", "/api/auth/sign-in/email", {
      email,
      password,
    });
  }

  async session(): Promise<{ user?: { id: string } } | null> {
    const response = await this.request("GET", "/api/auth/get-session");
    return response.json();
  }

  signOut() {
    return this.request("POST", "/api/auth/sign-out", {});
  }
}

/** The current TOTP code for an otpauth:// URI. */
export function totpCode(totpURI: string): string {
  return OTPAuth.URI.parse(totpURI).generate();
}
