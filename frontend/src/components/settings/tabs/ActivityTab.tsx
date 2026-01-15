'use client';

import React from 'react';
import { Typography, Empty } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function ActivityTab() {
    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>Activity</Title>

            <Empty
                image={<HistoryOutlined style={{ fontSize: 48, color: 'var(--text-secondary)' }} />}
                description={
                    <div>
                        <Title level={5} style={{ marginBottom: 8 }}>Activity</Title>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            View your recent activity across all boards and workspaces.
                            Content will be provided later.
                        </span>
                    </div>
                }
            />
        </div>
    );
}
