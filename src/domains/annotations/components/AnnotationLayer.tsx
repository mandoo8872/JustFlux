import React from 'react';
import type { Annotation } from '../../../core/model/types';
import { annotationRegistry } from '../services/AnnotationRegistry';

interface AnnotationLayerProps {
    annotation: Annotation;
    scale: number;
    isSelected: boolean;
    isDragging: boolean;
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    onUpdate: (id: string, updates: Partial<Annotation>) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
    onDragStart?: (annotation: Annotation, startPos: { x: number; y: number }) => void;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
    annotation,
    scale,
    isSelected,
    isDragging,
    onPointerDown,
    onUpdate,
    onDelete,
    onSelect,
    onDragStart
}) => {
    const renderer = annotationRegistry.getRenderer(annotation.type);

    if (!renderer) {
        // console.warn(`No renderer found for type: ${annotation.type}`);
        return null;
    }

    return (
        <>
            {renderer.render({
                annotation,
                isSelected,
                isHovered: false,
                isDragging,
                scale,
                onSelect: () => onSelect(annotation.id),
                onUpdate: (updates: any) => onUpdate(annotation.id, updates),
                onDelete: () => onDelete(annotation.id),
                onPointerDown: (e: any) => onPointerDown(e, annotation.id),
                onHover: () => { },
                onHoverEnd: () => { },
                onDragStart: onDragStart ? (ann: any, pos: any) => onDragStart(ann, pos) : undefined
            })}
        </>
    );
};
