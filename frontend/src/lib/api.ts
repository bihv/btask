import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Send cookies automatically
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    return config;
});

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Upload file helper
export const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/upload`,
        formData,
        {
            withCredentials: true, // Send cookies
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response.data.data.url;
};

// Upload file and create attachment record (for BlockNote editor)
export const uploadFileWithAttachment = async (
    file: File,
    cardId: string,
    source: 'upload' | 'editor' = 'editor'
): Promise<string> => {
    // First upload the file
    const fileUrl = await uploadFile(file);

    // Then create attachment record
    await attachmentApi.createWithSource(cardId, {
        file_name: file.name,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
        source,
    });

    return fileUrl;
};

// Checklist API functions
export const checklistApi = {
    getByCardId: (cardId: string) => api.get(`/cards/${cardId}/checklists`),
    create: (cardId: string, data: { title: string }) => api.post(`/cards/${cardId}/checklists`, data),
    update: (id: string, data: { title?: string; position?: number }) => api.put(`/checklists/${id}`, data),
    delete: (id: string) => api.delete(`/checklists/${id}`),

    // Checklist items
    createItem: (checklistId: string, data: { content: string; assignee_ids?: string[]; due_date?: string }) =>
        api.post(`/checklists/${checklistId}/items`, data),
    updateItem: (checklistId: string, itemId: string, data: { content?: string; is_completed?: boolean; assignee_ids?: string[]; due_date?: string | null; clear_due_date?: boolean }) =>
        api.put(`/checklists/${checklistId}/items/${itemId}`, data),
    deleteItem: (checklistId: string, itemId: string) => api.delete(`/checklists/${checklistId}/items/${itemId}`),
    toggleItem: (checklistId: string, itemId: string) => api.put(`/checklists/${checklistId}/items/${itemId}/toggle`),
    convertItemToCard: (checklistId: string, itemId: string, listId: string) =>
        api.post(`/checklists/${checklistId}/items/${itemId}/convert-to-card`, { list_id: listId }),
};

// Attachment API functions
export const attachmentApi = {
    getByCardId: (cardId: string, source?: 'upload' | 'editor') =>
        api.get(`/cards/${cardId}/attachments${source ? `?source=${source}` : ''}`),
    create: (cardId: string, data: { file_name: string; file_url: string; file_type?: string; file_size?: number }) =>
        api.post(`/cards/${cardId}/attachments`, data),
    createWithSource: (cardId: string, data: { file_name: string; file_url: string; file_type?: string; file_size?: number; source: 'upload' | 'editor' }) =>
        api.post(`/cards/${cardId}/attachments`, data),
    delete: (id: string) => api.delete(`/attachments/${id}`),
    syncOrphans: (cardId: string, urls: string[]) =>
        api.post(`/cards/${cardId}/attachments/sync-orphans`, { urls }),
};

// Card Archive API functions
export const cardArchiveApi = {
    archive: (cardId: string) => api.put(`/cards/${cardId}/archive`),
    unarchive: (cardId: string) => api.put(`/cards/${cardId}/unarchive`),
    getArchivedByBoard: (boardId: string) => api.get(`/boards/${boardId}/archived-cards`),
};

// Link Preview API functions
export const linkPreviewApi = {
    // Fetch link preview for a URL
    fetch: (url: string) => api.post('/link-preview', { url }),
    // Refresh link preview for a card
    refresh: (cardId: string) => api.post(`/cards/${cardId}/refresh-link-preview`),
    // Clear link preview data for a card
    clear: (cardId: string) => api.delete(`/cards/${cardId}/link-preview`),
};

// Custom Field API functions
export const customFieldApi = {
    // Board-level custom fields
    getByBoardId: (boardId: string) => api.get(`/boards/${boardId}/custom-fields`),
    create: (boardId: string, data: { name: string; type: string; show_on_card: boolean; options?: string[] }) =>
        api.post(`/boards/${boardId}/custom-fields`, data),
    addDefaultField: (boardId: string, fieldName: string) =>
        api.post(`/boards/${boardId}/custom-fields/default`, { field_name: fieldName }),
    update: (id: string, data: { name?: string; show_on_card?: boolean; position?: number }) =>
        api.put(`/custom-fields/${id}`, data),
    delete: (id: string) => api.delete(`/custom-fields/${id}`),

    // Custom field options
    addOption: (fieldId: string, data: { value: string; color?: string }) =>
        api.post(`/custom-fields/${fieldId}/options`, data),
    updateOption: (optionId: string, data: { value: string; color?: string }) =>
        api.put(`/custom-fields/options/${optionId}`, data),
    deleteOption: (optionId: string) => api.delete(`/custom-fields/options/${optionId}`),

    // Card custom field values
    getCardValues: (cardId: string) => api.get(`/cards/${cardId}/custom-fields`),
    setCardValue: (cardId: string, fieldId: string, data: { value?: string; option_id?: string }) =>
        api.put(`/cards/${cardId}/custom-fields/${fieldId}`, data),
    clearCardValue: (cardId: string, fieldId: string) =>
        api.delete(`/cards/${cardId}/custom-fields/${fieldId}`),
};

export default api;
