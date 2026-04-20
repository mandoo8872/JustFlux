import { describe, it, expect } from 'vitest';
import { clampToA4 } from './fileUtils';

describe('clampToA4', () => {
    it('returns original dimensions if smaller than A4', () => {
        expect(clampToA4(100, 200)).toEqual({ width: 100, height: 200 });
        expect(clampToA4(500, 800)).toEqual({ width: 500, height: 800 });
    });

    it('returns original dimensions if exactly A4 size', () => {
        expect(clampToA4(595, 842)).toEqual({ width: 595, height: 842 });
    });

    it('scales proportionally based on width if width exceeds max', () => {
        // max width is 595. So 1190 is 2x.
        // ratio = min(595/1190, 842/800) = min(0.5, 1.0525) = 0.5
        expect(clampToA4(1190, 800)).toEqual({ width: 595, height: 400 });
    });

    it('scales proportionally based on height if height exceeds max', () => {
        // max height is 842. So 1684 is 2x.
        // ratio = min(595/500, 842/1684) = min(1.19, 0.5) = 0.5
        expect(clampToA4(500, 1684)).toEqual({ width: 250, height: 842 });
    });

    it('scales proportionally based on both exceeding max (width is limiting)', () => {
        // 1190 (2x width) and 1263 (1.5x height)
        // ratio = min(0.5, 0.666...) = 0.5
        expect(clampToA4(1190, 1263)).toEqual({ width: 595, height: 631.5 });
    });

    it('scales proportionally based on both exceeding max (height is limiting)', () => {
        // 892.5 (1.5x width) and 1684 (2x height)
        // ratio = min(0.666..., 0.5) = 0.5
        expect(clampToA4(892.5, 1684)).toEqual({ width: 446.25, height: 842 });
    });

    it('handles zero dimensions correctly', () => {
        expect(clampToA4(0, 0)).toEqual({ width: 0, height: 0 });
    });
});
