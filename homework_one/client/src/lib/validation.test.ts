import { describe, expect, it } from 'vitest';
import {
  deriveName,
  emailValid,
  formatPlan,
  passwordStrength,
  timeGreeting,
} from './validation';

describe('emailValid', () => {
  it.each([
    'jane@example.com',
    'a@b.co',
    'foo.bar@example.co.uk',
    'with+tag@example.com',
  ])('accepts %s', (value) => {
    expect(emailValid(value)).toBe(true);
  });

  it.each(['', 'no-at', 'no-domain@', '@no-local.com', 'has spaces@example.com', 'no-tld@example'])(
    'rejects %s',
    (value) => {
      expect(emailValid(value)).toBe(false);
    },
  );
});

describe('passwordStrength', () => {
  it('is 0 for empty input', () => {
    expect(passwordStrength('')).toBe(0);
  });

  it('is 1 for length ≥ 6 with no character-class mix', () => {
    expect(passwordStrength('abcdef')).toBe(1);
  });

  it('is 2 once length crosses 10', () => {
    expect(passwordStrength('abcdefghij')).toBe(2);
  });

  it('is 3 when upper + lower coexist', () => {
    expect(passwordStrength('AbcDefGhij')).toBe(3);
  });

  it('is 4 when digit + special are also present', () => {
    expect(passwordStrength('AbcDef1!ij')).toBe(4);
  });

  it('caps at 4', () => {
    expect(passwordStrength('SuperLongPassword123!!ABC')).toBe(4);
  });
});

describe('deriveName', () => {
  it.each([
    ['jane.doe@example.com', 'Jane Doe'],
    ['john_smith@example.com', 'John Smith'],
    ['someone-else@example.com', 'Someone Else'],
    ['solo@example.com', 'Solo'],
  ])('derives %s -> %s', (email, expected) => {
    expect(deriveName(email)).toBe(expected);
  });

  it('falls back to "friend" when local-part is empty or unrecognisable', () => {
    expect(deriveName('@example.com')).toBe('friend');
    expect(deriveName('')).toBe('friend');
  });
});

describe('timeGreeting', () => {
  it.each([
    [3, 'Good night'],
    [7, 'Good morning'],
    [11, 'Good morning'],
    [13, 'Good afternoon'],
    [18, 'Good evening'],
    [22, 'Good night'],
  ])('hour %i -> %s', (hour, expected) => {
    const d = new Date(2026, 4, 14, hour, 0, 0);
    expect(timeGreeting(d)).toBe(expected);
  });
});

describe('formatPlan', () => {
  it('appends "· trial" only to Free', () => {
    expect(formatPlan('Free')).toBe('Free · trial');
    expect(formatPlan('Pro')).toBe('Pro');
    expect(formatPlan('Team')).toBe('Team');
  });
});
