'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface DraggableCoverImageProps {
    imageUrl: string;
    position: number; // 0-100
    onPositionChange: (position: number) => void;
    onPositionChangeComplete: (position: number) => void;
    height?: number;
}

export default function DraggableCoverImage({
    imageUrl,
    position,
    onPositionChange,
    onPositionChangeComplete,
    height = 200,
}: DraggableCoverImageProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [startPosition, setStartPosition] = useState(position);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStartY(e.clientY);
        setStartPosition(position);
    }, [position]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const containerHeight = containerRef.current.offsetHeight;
        const deltaY = e.clientY - dragStartY;
        // Dragging down should decrease position (move image up in view)
        const deltaPercent = (deltaY / containerHeight) * 100;
        const newPosition = Math.max(0, Math.min(100, startPosition - deltaPercent));
        
        onPositionChange(Math.round(newPosition));
    }, [isDragging, dragStartY, startPosition, onPositionChange]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            onPositionChangeComplete(position);
        }
    }, [isDragging, position, onPositionChangeComplete]);

    // Touch support
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStartY(touch.clientY);
        setStartPosition(position);
    }, [position]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging || !containerRef.current) return;

        const touch = e.touches[0];
        const containerHeight = containerRef.current.offsetHeight;
        const deltaY = touch.clientY - dragStartY;
        const deltaPercent = (deltaY / containerHeight) * 100;
        const newPosition = Math.max(0, Math.min(100, startPosition - deltaPercent));
        
        onPositionChange(Math.round(newPosition));
    }, [isDragging, dragStartY, startPosition, onPositionChange]);

    const handleTouchEnd = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            onPositionChangeComplete(position);
        }
    }, [isDragging, position, onPositionChangeComplete]);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    return (
        <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
                width: '100%',
                height,
                overflow: 'hidden',
                position: 'relative',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
            }}
        >
            <img
                src={imageUrl}
                alt="Cover"
                draggable={false}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: `center ${position}%`,
                    pointerEvents: 'none',
                }}
            />
            {/* Drag hint overlay - only shown on hover when not dragging */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: 4,
                    padding: '4px 8px',
                    opacity: isDragging ? 1 : 0,
                    transition: 'opacity 0.2s',
                    pointerEvents: 'none',
                }}
            >
                <span style={{ fontSize: 12, color: 'white' }}>
                    {position}%
                </span>
            </div>
        </div>
    );
}
