/**
 * File Download Utilities
 */

/**
 * Blob을 파일로 다운로드
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Uint8Array를 파일로 다운로드
 */
export function downloadUint8Array(
  bytes: Uint8Array,
  filename: string,
  mimeType: string
): void {
  // TypeScript strict mode workaround for Uint8Array -> Blob conversion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = new Blob([bytes as any], { type: mimeType });
  downloadBlob(blob, filename);
}

