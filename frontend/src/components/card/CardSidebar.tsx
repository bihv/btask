'use client';

import { Comment, User } from '@/types';
import ActivitySection from './ActivitySection';

interface CardSidebarProps {
    currentUser: User | null;
    comments: Comment[];
    isAddingComment: boolean;
    onAddComment: (content: string) => Promise<Comment>;
    onUpdateComment?: (commentId: string, content: string) => Promise<Comment>;
    workspaceId?: string;
    cardId?: string;
}

export default function CardSidebar({
    currentUser,
    comments,
    isAddingComment,
    onAddComment,
    onUpdateComment,
    workspaceId,
    cardId,
}: CardSidebarProps) {
    return (
        <div
            style={{
                width: 380,
                flexShrink: 0,
                borderLeft: '1px solid var(--border-color)',
                padding: 16,
                overflowY: 'auto',
                minHeight: 0,
            }}
            className="card-sidebar"
        >
            <style jsx>{`
                @media (max-width: 768px) {
                    .card-sidebar {
                        width: 100% !important;
                        border-left: none !important;
                        border-top: 1px solid var(--border-color) !important;
                        height: auto !important;
                        overflow-y: visible !important;
                    }
                }
            `}</style>
            <div>
                {/* Comments and Activity Section */}
                <ActivitySection
                    comments={comments}
                    currentUser={currentUser}
                    onAddComment={onAddComment}
                    onUpdateComment={onUpdateComment}
                    isLoading={isAddingComment}
                    workspaceId={workspaceId}
                    cardId={cardId}
                />
            </div>
        </div>
    );
}
