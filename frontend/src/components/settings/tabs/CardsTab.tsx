'use client';

import React from 'react';
import { Typography, Empty } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function CardsTab() {
    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>Cards</Title>

            <Empty
                image={<CreditCardOutlined style={{ fontSize: 48, color: 'var(--text-secondary)' }} />}
                description={
                    <div>
                        <Title level={5} style={{ marginBottom: 8 }}>Cards</Title>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            View all cards that you are assigned to across all boards.
                            Content will be provided later.
                        </span>
                    </div>
                }
            />
        </div>
    );
}
