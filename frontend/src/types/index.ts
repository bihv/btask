// User types
export interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    created_at: string;
}

// Workspace types
export interface Workspace {
    id: string;
    name: string;
    description?: string;
    owner_id: string;
    owner?: User;
    boards?: Board[];
    created_at: string;
    updated_at: string;
}

export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    user?: User;
    created_at: string;
}

// Board types
export interface Board {
    id: string;
    workspace_id: string;
    title: string;
    description?: string;
    background_color: string;
    background_image?: string;
    is_starred: boolean;
    position: number;
    lists?: List[];
    labels?: Label[];
    created_at: string;
    updated_at: string;
}

// List types
export interface List {
    id: string;
    board_id: string;
    title: string;
    position: number;
    cards?: Card[];
    created_at: string;
    updated_at: string;
}

// Card types
export interface Card {
    id: string;
    list_id: string;
    title: string;
    description?: string;
    position: number;
    due_date?: string;
    is_completed: boolean;
    created_by: string;
    creator?: User;
    labels?: CardLabel[];
    members?: CardMember[];
    comments?: Comment[];
    created_at: string;
    updated_at: string;
}

export interface CardLabel {
    id: string;
    card_id: string;
    label_id: string;
    label?: Label;
}

export interface CardMember {
    id: string;
    card_id: string;
    user_id: string;
    user?: User;
}

// Label types
export interface Label {
    id: string;
    board_id: string;
    name?: string;
    color: string;
}

// Comment types
export interface Comment {
    id: string;
    card_id: string;
    user_id: string;
    content: string;
    user?: User;
    created_at: string;
    updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Auth types
export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
}

// Create/Update request types
export interface CreateWorkspaceRequest {
    name: string;
    description?: string;
}

export interface CreateBoardRequest {
    title: string;
    description?: string;
    background_color?: string;
}

export interface CreateListRequest {
    title: string;
    position?: number;
}

export interface CreateCardRequest {
    title: string;
    description?: string;
    position?: number;
    due_date?: string;
}

export interface MoveCardRequest {
    list_id: string;
    position: number;
}

export interface CreateLabelRequest {
    name?: string;
    color: string;
}

export interface CreateCommentRequest {
    content: string;
}
