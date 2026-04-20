import { describe, it, expect } from 'vitest';
import { applyWidthMatching } from './fileUtils';

describe('applyWidthMatching', () => {
    it('should scale height proportionally when difference is > 1', () => {
        const result = applyWidthMatching(100, 200, 200, true);
        expect(result).toEqual({ width: 200, height: 400 });
    });

    it('should return original dimensions when difference is <= 1', () => {
        // Difference is exactly 1
        const result1 = applyWidthMatching(100, 200, 101, true);
        expect(result1).toEqual({ width: 100, height: 200 });

        // Difference is 0.5 (< 1)
        const result2 = applyWidthMatching(100, 200, 100.5, true);
        expect(result2).toEqual({ width: 100, height: 200 });

        // Difference is exactly 1 (negative direction)
        const result3 = applyWidthMatching(100, 200, 99, true);
        expect(result3).toEqual({ width: 100, height: 200 });
    });

    it('should return original dimensions when matchWidth is false', () => {
        const result = applyWidthMatching(100, 200, 200, false);
        expect(result).toEqual({ width: 100, height: 200 });
    });

    it('should return original dimensions when targetWidth is null', () => {
        const result = applyWidthMatching(100, 200, null, true);
        expect(result).toEqual({ width: 100, height: 200 });
    });
});
