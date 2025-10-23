/**
 * PageNavigator Component - 페이지 네비게이션
 */

import { useState, useEffect } from 'react';
import { CaretLeft, CaretRight } from 'phosphor-react';

interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PageNavigator({ currentPage, totalPages, onPageChange }: PageNavigatorProps) {
  const [inputValue, setInputValue] = useState(String(currentPage + 1));

  useEffect(() => {
    setInputValue(String(currentPage + 1));
  }, [currentPage]);

  const handlePrev = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputSubmit = () => {
    const page = parseInt(inputValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page - 1);
    } else {
      setInputValue(String(currentPage + 1));
    }
  };

  const buttonStyle = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: 'none',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#6b7280'
  };

  const buttonHoverStyle = {
    background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
    color: 'white',
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
  };

  const buttonDisabledStyle = {
    ...buttonStyle,
    opacity: 0.3,
    cursor: 'not-allowed'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      {/* Previous Button */}
      <button
        onClick={handlePrev}
        disabled={currentPage === 0}
        style={currentPage === 0 ? buttonDisabledStyle : buttonStyle}
        title="이전 페이지"
        onMouseEnter={(e) => {
          if (currentPage > 0) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage > 0) {
            Object.assign(e.currentTarget.style, buttonStyle);
          }
        }}
      >
        <CaretLeft size={18} weight="bold" />
      </button>

      {/* Page Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleInputSubmit();
            }
          }}
          style={{
            width: '32px',
            textAlign: 'center',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937',
            background: 'transparent'
          }}
        />
        <span style={{
          fontSize: '14px',
          color: '#9ca3af',
          fontWeight: '500'
        }}>
          / {totalPages}
        </span>
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages - 1}
        style={currentPage === totalPages - 1 ? buttonDisabledStyle : buttonStyle}
        title="다음 페이지"
        onMouseEnter={(e) => {
          if (currentPage < totalPages - 1) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage < totalPages - 1) {
            Object.assign(e.currentTarget.style, buttonStyle);
          }
        }}
      >
        <CaretRight size={18} weight="bold" />
      </button>
    </div>
  );
}
