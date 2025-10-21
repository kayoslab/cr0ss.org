import { describe, it, expect } from 'vitest';
import {
  toBerlinYMD,
  startOfBerlinDayISO,
  endOfBerlinDayISO,
  prevBerlinDateKey,
  berlinDateTimeToUTCISO,
  isoToBerlinDate,
} from './berlin';

describe('berlin time utilities', () => {
  describe('toBerlinYMD', () => {
    it('should convert Date to YYYY-MM-DD format in Berlin timezone', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = toBerlinYMD(date);

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe('2024-01-15');
    });

    it('should handle dates near midnight UTC', () => {
      // 23:00 UTC on Jan 14 = 00:00 CET on Jan 15
      const date = new Date('2024-01-14T23:00:00Z');
      const result = toBerlinYMD(date);

      expect(result).toBe('2024-01-15');
    });

    it('should handle summer time (CEST)', () => {
      // During summer, Berlin is UTC+2
      const date = new Date('2024-07-15T10:30:00Z');
      const result = toBerlinYMD(date);

      expect(result).toBe('2024-07-15');
    });
  });

  describe('startOfBerlinDayISO', () => {
    it('should return start of day in Berlin timezone as UTC ISO', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = startOfBerlinDayISO(date);

      // Jan 15 00:00 in Berlin (CET = UTC+1) is Jan 14 23:00 UTC
      expect(result).toBe('2024-01-14T23:00:00.000Z');
    });

    it('should handle summer time', () => {
      const date = new Date('2024-07-15T10:30:00Z');
      const result = startOfBerlinDayISO(date);

      // Jul 15 00:00 in Berlin (CEST = UTC+2) is Jul 14 22:00 UTC
      expect(result).toBe('2024-07-14T22:00:00.000Z');
    });
  });

  describe('endOfBerlinDayISO', () => {
    it('should return end of day in Berlin timezone as UTC ISO', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = endOfBerlinDayISO(date);

      // Jan 15 23:59:59.999 in Berlin (CET) is Jan 15 22:59:59.999 UTC
      expect(result).toBe('2024-01-15T22:59:59.999Z');
    });

    it('should be exactly 1ms before next day start', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const end = Date.parse(endOfBerlinDayISO(date));
      const nextStart = Date.parse(startOfBerlinDayISO(new Date('2024-01-16T00:00:00Z')));

      expect(nextStart - end).toBe(1);
    });
  });

  describe('prevBerlinDateKey', () => {
    it('should return previous day in YYYY-MM-DD format', () => {
      const result = prevBerlinDateKey('2024-01-15');

      expect(result).toBe('2024-01-14');
    });

    it('should handle month boundaries', () => {
      const result = prevBerlinDateKey('2024-02-01');

      expect(result).toBe('2024-01-31');
    });

    it('should handle year boundaries', () => {
      const result = prevBerlinDateKey('2024-01-01');

      expect(result).toBe('2023-12-31');
    });

    it('should handle leap years', () => {
      const result = prevBerlinDateKey('2024-03-01');

      expect(result).toBe('2024-02-29');
    });
  });

  describe('berlinDateTimeToUTCISO', () => {
    it('should convert Berlin wall-clock time to UTC ISO string', () => {
      const result = berlinDateTimeToUTCISO('2024-01-15', '14:30');

      // 14:30 CET (UTC+1) = 13:30 UTC
      expect(result).toBe('2024-01-15T13:30:00.000Z');
    });

    it('should handle midnight', () => {
      const result = berlinDateTimeToUTCISO('2024-01-15', '00:00');

      // 00:00 CET (UTC+1) = 23:00 UTC previous day
      expect(result).toBe('2024-01-14T23:00:00.000Z');
    });

    it('should handle summer time', () => {
      const result = berlinDateTimeToUTCISO('2024-07-15', '14:30');

      // 14:30 CEST (UTC+2) = 12:30 UTC
      expect(result).toBe('2024-07-15T12:30:00.000Z');
    });
  });

  describe('isoToBerlinDate', () => {
    it('should convert UTC timestamp to Berlin date string', () => {
      const timestamp = Date.parse('2024-01-15T13:30:00.000Z');
      const result = isoToBerlinDate(timestamp);

      // 13:30 UTC = 14:30 CET
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      expect(result).toBe('2024-01-15 14:30');
    });

    it('should handle near-midnight conversions', () => {
      const timestamp = Date.parse('2024-01-14T23:30:00.000Z');
      const result = isoToBerlinDate(timestamp);

      // 23:30 UTC = 00:30 CET next day
      expect(result).toBe('2024-01-15 00:30');
    });
  });
});
