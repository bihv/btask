'use client';

import React from 'react';
import styles from './auth.module.css';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
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
    );
}
