/**
 * ThumbnailSidebar Component - 페이지 썸네일 목록
 * Drag & Drop, Context Menu, Auto-scroll
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Page } from '../../core/model/types';
import { generateThumbnail } from '../../core/pdf/pdfLoader';
import { PageContextMenu } from './PageContextMenu';

interface ThumbnailSidebarProps {
  pages: Page[];
  allPages: Page[]; // All pages including deleted ones
  currentPageId: string | null;
  pdfProxy: PDFDocumentProxy;
  onPageSelect: (pageId: string) => void;
  onReorder: (pageIds: string[]) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onAddBlankPage: (afterPageId: string, width: number, height: number) => void;
  onAddPdfPages: (afterPageId: string, file: File) => void;
  sidebarWidth: number;
  insertedPdfPages?: Set<string>;
  insertedPdfProxies?: Map<string, PDFDocumentProxy>;
}

export function ThumbnailSidebar({ 
  pages, 
  allPages,
  currentPageId, 
  pdfProxy, 
  onPageSelect, 
  onReorder,
  onDuplicate,
  onDelete,
  onAddBlankPage,
  onAddPdfPages,
  sidebarWidth,
  insertedPdfPages = new Set(),
  insertedPdfProxies = new Map()
}: ThumbnailSidebarProps) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ pageId: string; x: number; y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<number | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const contextMenuPageIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Generate thumbnails for all pages with dynamic size based on sidebar width
    const generateAll = async () => {
      const newThumbnails: Record<string, string> = {};
      // Calculate thumbnail width: sidebar width - padding (16px on each side) - container padding (24px total)
      const thumbnailWidth = Math.max(120, sidebarWidth - 40);
      
      for (const page of pages) {
        try {
          // Check if page has PDF reference (not a blank page)
          if (page.pdfRef && pdfProxy && !insertedPdfPages.has(page.id)) {
            try {
              const dataUrl = await generateThumbnail(pdfProxy, page.pdfRef.sourceIndex - 1, thumbnailWidth);
              newThumbnails[page.id] = dataUrl;
            } catch (error) {
              console.warn(`⚠️ [ThumbnailSidebar] Failed to generate thumbnail for page ${page.index + 1} (PDF page ${page.pdfRef.sourceIndex}):`, error);
              // Generate placeholder thumbnail for pages that can't be rendered
              const canvas = document.createElement('canvas');
              const aspectRatio = page.height / page.width;
              canvas.width = thumbnailWidth;
              canvas.height = thumbnailWidth * aspectRatio;
              
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Draw white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw border
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 2;
                ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
                
                // Draw "PDF 페이지" text
                ctx.fillStyle = '#9ca3af';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('PDF 페이지', canvas.width / 2, canvas.height / 2);
              }
              newThumbnails[page.id] = canvas.toDataURL('image/png');
            }
          } else if (page.pdfRef && insertedPdfPages.has(page.id)) {
            // Try to generate thumbnail for inserted PDF pages using their own proxy
            const insertedPdfProxy = insertedPdfProxies.get(page.id);
            if (insertedPdfProxy) {
              try {
                const dataUrl = await generateThumbnail(insertedPdfProxy, page.pdfRef.sourceIndex - 1, thumbnailWidth);
                newThumbnails[page.id] = dataUrl;
              } catch (error) {
                console.warn(`⚠️ [ThumbnailSidebar] Failed to generate thumbnail for inserted PDF page ${page.index + 1}:`, error);
                // Generate placeholder thumbnail
                const canvas = document.createElement('canvas');
                const aspectRatio = page.height / page.width;
                canvas.width = thumbnailWidth;
                canvas.height = thumbnailWidth * aspectRatio;
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.strokeStyle = '#d1d5db';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
                  ctx.fillStyle = '#9ca3af';
                  ctx.font = '14px sans-serif';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText('PDF 페이지', canvas.width / 2, canvas.height / 2);
                }
                newThumbnails[page.id] = canvas.toDataURL('image/png');
              }
            } else {
              // No proxy available, generate placeholder thumbnail
              const canvas = document.createElement('canvas');
              const aspectRatio = page.height / page.width;
              canvas.width = thumbnailWidth;
              canvas.height = thumbnailWidth * aspectRatio;
              
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 2;
                ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
                ctx.fillStyle = '#9ca3af';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('PDF 페이지', canvas.width / 2, canvas.height / 2);
              }
              newThumbnails[page.id] = canvas.toDataURL('image/png');
            }
          } else {
            // Generate blank page thumbnail
            const canvas = document.createElement('canvas');
            const aspectRatio = page.height / page.width;
            canvas.width = thumbnailWidth;
            canvas.height = thumbnailWidth * aspectRatio;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Draw white background
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Draw border
              ctx.strokeStyle = '#e5e7eb';
              ctx.lineWidth = 2;
              ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
              
              // Draw "빈 페이지" text
              ctx.fillStyle = '#9ca3af';
              ctx.font = '14px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('빈 페이지', canvas.width / 2, canvas.height / 2);
            }
            
            newThumbnails[page.id] = canvas.toDataURL('image/png');
          }
        } catch (error) {
          console.error(`Failed to generate thumbnail for page ${page.index + 1}:`, error);
        }
      }
      
      setThumbnails(newThumbnails);
    };

    if (pages.length > 0) {
      generateAll();
    }
  }, [pdfProxy, pages, sidebarWidth, insertedPdfPages, insertedPdfProxies]);

  // Auto-scroll when dragging near edges
  const startAutoScroll = useCallback((direction: 'up' | 'down') => {
    if (autoScrollIntervalRef.current) return;
    
    autoScrollIntervalRef.current = window.setInterval(() => {
      if (!scrollContainerRef.current) return;
      
      const scrollAmount = direction === 'up' ? -10 : 10;
      scrollContainerRef.current.scrollTop += scrollAmount;
    }, 50);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      window.clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pageId);
  };

  const handleDragOver = (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetIndex = pages.findIndex(p => p.id === targetPageId);
    setDropTargetIndex(targetIndex);

    // Auto-scroll logic
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    const SCROLL_THRESHOLD = 80;
    
    if (mouseY < SCROLL_THRESHOLD) {
      startAutoScroll('up');
    } else if (mouseY > rect.height - SCROLL_THRESHOLD) {
      startAutoScroll('down');
    } else {
      stopAutoScroll();
    }
  };

  const handleDragLeave = () => {
    stopAutoScroll();
  };

  const handleDrop = (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    stopAutoScroll();
    
    if (!draggedPageId || draggedPageId === targetPageId) {
      setDraggedPageId(null);
      setDropTargetIndex(null);
      return;
    }

    const draggedIndex = pages.findIndex(p => p.id === draggedPageId);
    const targetIndex = pages.findIndex(p => p.id === targetPageId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new order with visible pages
    const visibleNewOrder = [...pages];
    const [draggedPage] = visibleNewOrder.splice(draggedIndex, 1);
    visibleNewOrder.splice(targetIndex, 0, draggedPage);
    
    // Remove duplicates and use only the reordered IDs
    const visibleIds = visibleNewOrder.map(p => p.id);
    
    // Merge: insert deleted pages at their relative positions
    const finalOrder: string[] = [];
    let visibleIdx = 0;
    
    for (const page of allPages) {
      if (page.deleted) {
        finalOrder.push(page.id);
      } else {
        if (visibleIdx < visibleIds.length) {
          finalOrder.push(visibleIds[visibleIdx]);
          visibleIdx++;
        }
      }
    }
    
    // Add any remaining visible pages
    while (visibleIdx < visibleIds.length) {
      finalOrder.push(visibleIds[visibleIdx]);
      visibleIdx++;
    }
    
    onReorder(finalOrder);
    
    setDraggedPageId(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    stopAutoScroll();
    setDraggedPageId(null);
    setDropTargetIndex(null);
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    setContextMenu({ pageId, x: e.clientX, y: e.clientY });
  };

  const handleAddPdfPage = (afterPageId: string) => {
    contextMenuPageIdRef.current = afterPageId;
    pdfFileInputRef.current?.click();
  };

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && contextMenuPageIdRef.current) {
      onAddPdfPages(contextMenuPageIdRef.current, file);
    }
    // Reset input
    e.target.value = '';
    contextMenuPageIdRef.current = null;
  };

  return (
    <>
      <div 
        ref={scrollContainerRef}
        style={{
          height: '100%',
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: 'white'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {pages.map((page, index) => {
              const isSelected = page.id === currentPageId;
              const isDragging = draggedPageId === page.id;
              const isDropTarget = dropTargetIndex === index;
              const thumbnail = thumbnails[page.id];

              return (
                <div key={page.id} style={{ position: 'relative' }}>
                  {/* Drop indicator line */}
                  {isDropTarget && draggedPageId && draggedPageId !== page.id && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: 0,
                      right: 0,
                      height: '4px',
                      backgroundColor: 'rgb(59, 130, 246)',
                      borderRadius: '2px',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.6)',
                      zIndex: 100,
                    }} />
                  )}

                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, page.id)}
                    onDragOver={(e) => handleDragOver(e, page.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, page.id)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={(e) => handleContextMenu(e, page.id)}
                    onClick={() => onPageSelect(page.id)}
                    style={{
                      width: '100%',
                      position: 'relative',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease-in-out',
                      border: isSelected ? '1px solid rgb(192, 132, 252)' : '1px solid rgb(229, 231, 235)',
                      boxShadow: isSelected 
                        ? '0 10px 15px -3px rgba(168, 85, 247, 0.3)' 
                        : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      background: isSelected 
                        ? 'linear-gradient(to bottom right, rgb(250, 245, 255), rgb(239, 246, 255))' 
                        : 'white',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      opacity: isDragging ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isDragging) {
                        e.currentTarget.style.borderColor = 'rgb(216, 180, 254)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isDragging) {
                        e.currentTarget.style.borderColor = 'rgb(229, 231, 235)';
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <div style={{ padding: '10px' }}>
                      {/* Thumbnail */}
                      <div style={{
                        aspectRatio: '8.5 / 11',
                        background: 'linear-gradient(to bottom right, rgb(249, 250, 251), rgb(243, 244, 246))',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: '10px',
                        position: 'relative',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        border: '1px solid rgb(243, 244, 246)'
                      }}>
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={`Page ${page.index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              pointerEvents: 'none' // Prevent drag interference
                            }}
                          />
                        ) : (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              border: '2px solid rgb(209, 213, 219)',
                              borderTopColor: 'rgb(168, 85, 247)',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                          </div>
                        )}
                      </div>

                      {/* Page Number - Pill style */}
                      <div style={{
                        fontSize: '12px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        borderRadius: '9999px',
                        background: isSelected 
                          ? 'linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246))' 
                          : 'rgb(243, 244, 246)',
                        color: isSelected ? 'white' : 'rgb(75, 85, 99)',
                        boxShadow: isSelected ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                      }}>
                        {page.index + 1}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Hidden file input for PDF insertion */}
      <input
        ref={pdfFileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={handlePdfFileSelect}
      />

      {/* Context Menu */}
      {contextMenu && (
        <PageContextMenu
          pageId={contextMenu.pageId}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onAddBlankPage={(pageId) => {
            const page = pages.find(p => p.id === pageId);
            if (page) {
              onAddBlankPage(pageId, page.width, page.height);
            }
          }}
          onAddPdfPage={handleAddPdfPage}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

