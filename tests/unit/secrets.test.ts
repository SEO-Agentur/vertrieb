import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
process.env.SESSION_SECRET = "test-secret-0123456789abcdef";
const { encryptSecret, decryptSecret } = await import("@/lib/secrets");

describe("Verschlüsselung von Zugangsdaten", () => {
  it("verschlüsselt und entschlüsselt verlustfrei", () => {
    const c = encryptSecret("sk-ant-api03-beispiel-key");
    expect(c).not.toContain("sk-ant");
    expect(decryptSecret(c)).toBe("sk-ant-api03-beispiel-key");
  });
  it("erzeugt bei jedem Aufruf ein anderes Chiffrat", () => {
    expect(encryptSecret("x")).not.toBe(encryptSecret("x"));
  });
  it("erkennt Manipulation", () => {
    const c = encryptSecret("geheim");
    const parts = c.split(".");
    parts[2] = Buffer.from("manipuliert").toString("base64");
    expect(decryptSecret(parts.join("."))).toBeNull();
  });
});
