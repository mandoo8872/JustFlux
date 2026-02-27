/**
 * PageNavigator Component - 페이지 네비게이션
 */

import { useState, useEffect } from 'react';
import { CaretUp, CaretDown } from 'phosphor-react';
import { useTranslation } from '../../i18n';

interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PageNavigator({ currentPage, totalPages, onPageChange }: PageNavigatorProps) {
  const [inputValue, setInputValue] = useState(String(currentPage + 1));
  const { t } = useTranslation();

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
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease-in-out',
    color: '#666666',
    borderRadius: '4px',
  };

  const buttonHoverStyle = {
    backgroundColor: '#E0E0E0'
  };

  const buttonDisabledStyle = {
    ...buttonStyle,
    opacity: 0.3,
    cursor: 'not-allowed'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px'
    }}>
      {/* Previous Button (위 화살표) */}
      <button
        onClick={handlePrev}
        disabled={currentPage === 0}
        style={currentPage === 0 ? buttonDisabledStyle : buttonStyle}
        title={t('pageNav.prev')}
        onMouseEnter={(e) => {
          if (currentPage > 0) {
            e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = buttonStyle.background;
        }}
      >
        <CaretUp size={20} weight="regular" />
      </button>

      {/* Page Input */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        minHeight: '40px',
        justifyContent: 'center'
      }}>
        {/* Current Page Number */}
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
            width: '28px',
            textAlign: 'center',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: '#333333',
            background: 'transparent',
            padding: 0
          }}
        />
        {/* Divider Line */}
        <div style={{
          width: '20px',
          height: '1px',
          backgroundColor: '#CCCCCC',
          margin: '4px 0'
        }} />
        {/* Total Pages */}
        <span style={{
          fontSize: '12px',
          color: '#666666',
          fontWeight: 500
        }}>
          {totalPages}
        </span>
      </div>

      {/* Next Button (아래 화살표) */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages - 1}
        style={currentPage === totalPages - 1 ? buttonDisabledStyle : buttonStyle}
        title={t('pageNav.next')}
        onMouseEnter={(e) => {
          if (currentPage < totalPages - 1) {
            e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = buttonStyle.background;
        }}
      >
        <CaretDown size={20} weight="regular" />
      </button>
    </div>
  );
}
