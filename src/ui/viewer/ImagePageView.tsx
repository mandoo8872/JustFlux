/**
 * ImagePageView Component - 이미지 페이지 렌더링
 */

interface ImagePageViewProps {
    pageId: string;
    imageUrl: string;
    scale: number;
    width: number;
    height: number;
}

export function ImagePageView({
    pageId,
    imageUrl,
    scale,
    width,
    height
}: ImagePageViewProps) {
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}
        >
            <img
                src={imageUrl}
                alt="Loaded image"
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                }}
                draggable={false}
            />
        </div>
    );
}
