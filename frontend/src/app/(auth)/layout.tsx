'use client';

import React from 'react';
import { ConfigProvider, theme } from 'antd';
import styles from './auth.module.css';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorBgContainer: 'rgba(255, 255, 255, 0.08)',
                    colorBorder: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    colorPrimary: '#7dd3c0',
                },
                components: {
                    Input: {
                        colorBgContainer: 'rgba(255, 255, 255, 0.08)',
                        activeBorderColor: '#7dd3c0',
                        hoverBorderColor: '#7dd3c0',
                    },
                }
            }}
        >
            <div className={styles.container}>
                {/* Background Layer with Illustration/Image */}
                <div className={styles.backgroundLayer}>
                    <img
                        src="/images/background.webp"
                        alt="Background"
                        className={styles.backgroundImage}
                    />
                </div>

                {/* Form Section Floating on top */}
                <div className={styles.formWrapper}>
                    {children}
                </div>
            </div>
        </ConfigProvider>
    );
}
