/**
 * TextPageView Component - 텍스트/마크다운 페이지 렌더링
 */

import { useMemo } from 'react';

interface TextPageViewProps {
    pageId: string;
    textContent: string;
    contentType: 'text' | 'markdown';
    scale: number;
    width: number;
    height: number;
}

// 간단한 마크다운 파싱 함수
function parseMarkdown(text: string): string {
    let html = text;

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 style="font-size: 18px; font-weight: bold; margin: 16px 0 8px;">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 style="font-size: 22px; font-weight: bold; margin: 20px 0 10px;">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 style="font-size: 28px; font-weight: bold; margin: 24px 0 12px;">$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 14px;">$2</pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>');

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li style="margin-left: 20px;">$1</li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin-left: 20px;">$1</li>');

    // Paragraphs (double newline)
    html = html.replace(/\n\n/g, '</p><p style="margin: 12px 0;">');

    // Single line breaks
    html = html.replace(/\n/g, '<br/>');

    return `<p style="margin: 12px 0;">${html}</p>`;
}

export function TextPageView({
    pageId,
    textContent,
    contentType,
    scale,
    width,
    height
}: TextPageViewProps) {
    const renderedContent = useMemo(() => {
        if (contentType === 'markdown') {
            return parseMarkdown(textContent);
        }
        // Plain text - preserve whitespace
        return `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: inherit; margin: 0;">${textContent}</pre>`;
    }, [textContent, contentType]);

    return (
        <div
            key={pageId}
            style={{
                width: width * scale,
                height: height * scale,
                backgroundColor: '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                borderRadius: '8px',
                border: '1px solid #E0E0E0',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    padding: `${24 * scale}px`,
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                    fontSize: `${14 * scale}px`,
                    lineHeight: 1.6,
                    color: '#1f2937',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
                dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
        </div>
    );
}
