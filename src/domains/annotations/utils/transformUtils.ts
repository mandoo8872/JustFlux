
export const snapToGrid = (value: number, gridSize: number = 10): number => {
    return Math.round(value / gridSize) * gridSize;
};

export const getDelta = (
    currentX: number,
    currentY: number,
    startX: number,
    startY: number,
    scale: number
) => {
    return {
        deltaX: (currentX - startX) / scale,
        deltaY: (currentY - startY) / scale,
    };
};

export const isWithinBounds = (_x: number, _y: number, _width: number, _height: number, _containerWidth: number, _containerHeight: number) => {
    // Simple bounds check if needed later
    return true;
};
