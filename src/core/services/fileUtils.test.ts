import { describe, it, expect } from 'vitest';
import { validateFileType } from './fileUtils';

describe('validateFileType', () => {
    it('should return true for valid MIME types with matching extensions', () => {
        expect(validateFileType({ name: 'document.pdf', type: 'application/pdf' } as unknown as File)).toBe(true);
        expect(validateFileType({ name: 'image.png', type: 'image/png' } as unknown as File)).toBe(true);
        expect(validateFileType({ name: 'notes.txt', type: 'text/plain' } as unknown as File)).toBe(true);
    });

    it('should return true for valid extensions even if MIME type is missing or unknown', () => {
        expect(validateFileType({ name: 'document.pdf', type: '' } as unknown as File)).toBe(true);
        expect(validateFileType({ name: 'image.jpeg', type: 'application/octet-stream' } as unknown as File)).toBe(true);
        expect(validateFileType({ name: 'data.csv.md', type: '' } as unknown as File)).toBe(true);
    });

    it('should return true for valid MIME types even if extension is missing or invalid', () => {
        expect(validateFileType({ name: 'document', type: 'application/pdf' } as unknown as File)).toBe(true);
        expect(validateFileType({ name: 'image.xyz', type: 'image/webp' } as unknown as File)).toBe(true);
    });

    it('should handle case-insensitive extensions', () => {
        expect(validateFileType({ name: 'document.PDF', type: '' } as unknown as File)).toBe(true);
        expect(validateFileType({ name: 'image.PnG', type: '' } as unknown as File)).toBe(true);
    });

    it('should return false for invalid MIME types and extensions', () => {
        expect(validateFileType({ name: 'script.js', type: 'application/javascript' } as unknown as File)).toBe(false);
        expect(validateFileType({ name: 'archive.zip', type: 'application/zip' } as unknown as File)).toBe(false);
        expect(validateFileType({ name: 'data.json', type: 'application/json' } as unknown as File)).toBe(false);
    });

    it('should return false for files without extension and invalid MIME type', () => {
        expect(validateFileType({ name: 'unknown_file', type: '' } as unknown as File)).toBe(false);
        expect(validateFileType({ name: 'unknown_file', type: 'application/octet-stream' } as unknown as File)).toBe(false);
    });
});
