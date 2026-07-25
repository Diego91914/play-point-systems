import { describe, expect, it } from "vitest";
import { resolvePostgresSslConfig } from "../lib/play-point-core/postgres-ssl";

describe("Postgres TLS configuration", () => {
  it("verifies certificates for remote databases by default", () => {
    expect(
      resolvePostgresSslConfig({}, "postgresql://user:pass@db.example.com:5432/postgres")
    ).toEqual({ rejectUnauthorized: true });
  });

  it("accepts an explicitly configured CA certificate", () => {
    expect(
      resolvePostgresSslConfig(
        { PLAY_POINT_LIVE_DATABASE_CA_CERT: "line-one\\nline-two" },
        "postgresql://user:pass@db.example.com:5432/postgres"
      )
    ).toEqual({ rejectUnauthorized: true, ca: "line-one\nline-two" });
  });

  it("allows plaintext only for local development", () => {
    expect(
      resolvePostgresSslConfig(
        { PLAY_POINT_LIVE_DATABASE_SSL: "disable" },
        "postgresql://user:pass@localhost:5432/postgres"
      )
    ).toBe(false);

    expect(() =>
      resolvePostgresSslConfig(
        { PLAY_POINT_LIVE_DATABASE_SSL: "disable" },
        "postgresql://user:pass@db.example.com:5432/postgres"
      )
    ).toThrow("Postgres TLS can only be disabled");
  });
});
