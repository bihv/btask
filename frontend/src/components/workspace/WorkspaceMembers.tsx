'use client';

import { Typography, List, Avatar, Button, Empty } from 'antd';
import { UserOutlined, PlusOutlined } from '@ant-design/icons';
import { Workspace } from '@/types';

const { Title, Text } = Typography;

interface WorkspaceMembersProps {
    workspace: Workspace;
}

export default function WorkspaceMembers({ workspace }: WorkspaceMembersProps) {
    // Placeholder members data since it might not be in the workspace object yet
    // In a real implementation, we would fetch members or use a separate hook
    const members = [
        { id: '1', name: 'Current User', role: 'Admin', avatar: null },
        // Add more placeholder members or use real data if available
    ];

    return (
        <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>Workspace Members</Title>
                <Button type="primary" icon={<PlusOutlined />}>
                    Invite Member
                </Button>
            </div>

            <List
                itemLayout="horizontal"
                dataSource={members}
                renderItem={(item) => (
                    <List.Item
                        actions={[<Button type="link" key="remove">Remove</Button>]}
                    >
                        <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} />}
                            title={<Text strong>{item.name}</Text>}
                            description={`Role: ${item.role}`}
                        />
                    </List.Item>
                )}
            />
        </div>
    );
}
