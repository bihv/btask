'use client';

import React from 'react';
import { Typography, Empty } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useLabels';

const { Title } = Typography;

export default function ActivityTab() {
    const t = useTranslation();
    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>{t('UI_ACTIVITY')}</Title>

            <Empty
                image={<HistoryOutlined style={{ fontSize: 48, color: 'var(--text-secondary)' }} />}
                description={
                    <div>
                        <Title level={5} style={{ marginBottom: 8 }}>{t('UI_ACTIVITY')}</Title>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            {t('UI_ACTIVITY_DESC')}
                        </span>
                    </div>
                }
            />
        </div>
    );
}
