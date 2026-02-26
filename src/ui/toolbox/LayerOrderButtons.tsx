/**
 * LayerOrderButtons — 레이어 순서 조작 (컴팩트 아이콘 전용)
 */

import { CaretDoubleUp, CaretUp, CaretDown, CaretDoubleDown } from 'phosphor-react';
import { iconButtonStyle } from './panelStyles';

interface LayerOrderButtonsProps {
    onMoveUp: () => void;
    onMoveDown: () => void;
    onMoveToTop: () => void;
    onMoveToBottom: () => void;
}

export function LayerOrderButtons({ onMoveUp, onMoveDown, onMoveToTop, onMoveToBottom }: LayerOrderButtonsProps) {
    return (
        <div style={{ display: 'flex', gap: '4px' }}>
            <button
                style={{ ...iconButtonStyle, flex: 1 }}
                onClick={onMoveToTop}
                title="맨 앞으로"
            >
                <CaretDoubleUp size={14} weight="bold" />
            </button>
            <button
                style={{ ...iconButtonStyle, flex: 1 }}
                onClick={onMoveUp}
                title="앞으로"
            >
                <CaretUp size={14} />
            </button>
            <button
                style={{ ...iconButtonStyle, flex: 1 }}
                onClick={onMoveDown}
                title="뒤로"
            >
                <CaretDown size={14} />
            </button>
            <button
                style={{ ...iconButtonStyle, flex: 1 }}
                onClick={onMoveToBottom}
                title="맨 뒤로"
            >
                <CaretDoubleDown size={14} weight="bold" />
            </button>
        </div>
    );
}
