/**
 * LayerOrderButtons — 레이어 순서 조작 버튼
 */

import { CaretUp, CaretDown } from 'phosphor-react';
import { sectionStyle, labelStyle, buttonStyle } from './panelStyles';

interface LayerOrderButtonsProps {
    onMoveUp: () => void;
    onMoveDown: () => void;
    onMoveToTop: () => void;
    onMoveToBottom: () => void;
}

export function LayerOrderButtons({ onMoveUp, onMoveDown, onMoveToTop, onMoveToBottom }: LayerOrderButtonsProps) {
    return (
        <div style={sectionStyle}>
            <label style={labelStyle}>레이어 순서</label>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    style={{ ...buttonStyle, backgroundColor: '#6366F1', color: 'white', padding: '8px' }}
                    onClick={onMoveToTop}
                    title="맨 앞으로"
                >
                    <CaretUp size={16} weight="bold" />
                    <CaretUp size={16} weight="bold" style={{ marginLeft: '-8px' }} />
                </button>
                <button
                    style={{ ...buttonStyle, backgroundColor: '#6366F1', color: 'white', padding: '8px' }}
                    onClick={onMoveUp}
                    title="앞으로"
                >
                    <CaretUp size={16} />
                </button>
                <button
                    style={{ ...buttonStyle, backgroundColor: '#6366F1', color: 'white', padding: '8px' }}
                    onClick={onMoveDown}
                    title="뒤로"
                >
                    <CaretDown size={16} />
                </button>
                <button
                    style={{ ...buttonStyle, backgroundColor: '#6366F1', color: 'white', padding: '8px' }}
                    onClick={onMoveToBottom}
                    title="맨 뒤로"
                >
                    <CaretDown size={16} weight="bold" />
                    <CaretDown size={16} weight="bold" style={{ marginLeft: '-8px' }} />
                </button>
            </div>
        </div>
    );
}
