import { describe, it, expect } from 'vitest';
import { uuid, isUuid } from './uuid';

describe('uuid', () => {
  it('produces well-formed UUID v4 strings', () => {
    const id = uuid();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('does not repeat across a large batch', () => {
    const seen = new Set(Array.from({ length: 10_000 }, () => uuid()));
    expect(seen.size).toBe(10_000);
  });

  it('is accepted by the cloud-schema id check', () => {
    expect(isUuid(uuid())).toBe(true);
  });
});

describe('isUuid', () => {
  it('accepts valid versioned UUIDs, case-insensitively', () => {
    // v1
    expect(isUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    // v4
    expect(isUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
    expect(isUuid('F47AC10B-58CC-4372-A567-0E02B2C3D479')).toBe(true);
  });

  it('rejects the nil UUID — the cloud validators require a real version', () => {
    expect(isUuid('00000000-0000-0000-0000-000000000000')).toBe(false);
  });

  it('rejects legacy local ids and malformed input', () => {
    expect(isUuid('p_lx8f2k')).toBe(false);
    expect(isUuid('t_abc123')).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid('not-a-uuid')).toBe(false);
  });
});
