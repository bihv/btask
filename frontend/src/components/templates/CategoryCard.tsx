'use client';

import type { ComponentType } from 'react';
import React from 'react';

import { Card, Text } from '@mantine/core';
interface CategoryCardProps {
    name: string;
    icon: ComponentType<{ style?: React.CSSProperties }>;
    color: string;
}

export default function CategoryCard({ name, icon: Icon, color }: CategoryCardProps) {
    return (
        <Card
            withBorder
            className="category-card"
            style={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                position: 'relative',
                overflow: 'hidden',
				backgroundColor: 'var(--bg-primary)', // Use theme variable
            }}
            
        >
            <style jsx global>{`
                .category-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
                }
            `}</style>
            
            {/* Background color strip/overlay could be added here if we want the "Trello" style full card color
                but for now let's reproduce the icon + text style from the image 
            */}
             <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    backgroundColor: color,
                }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '32px', 
                        height: '32px', 
                        // backgroundColor: color, 
                        // borderRadius: '4px',
                        color: color, // Icon color matches category color
                        fontSize: '24px'
                    }}
                >
                    <Icon />
                </div>
                <Text fw={700} style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{name}</Text>
            </div>
        </Card>
    );
}
