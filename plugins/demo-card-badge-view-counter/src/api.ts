/**
 * Plugin API Client
 * 
 * This file handles the communication between the Plugin (running in an iframe)
 * and the Mello Host Application using the `postMessage` API.
 * 
 * Flow:
 * 1. Plugin sends a request message with a unique `messageId`.
 * 2. Host processes the request.
 * 3. Host replies with a response message containing the same `messageId`.
 * 4. We resolve/reject the Promise based on the response.
 */

export const STORAGE_KEY = 'view_stats';

export const melloApi = {
    /**
     * Fetch data from Mello's storage.
     * @param scope - The scope of data (e.g., 'card', 'board').
     * @param entityId - The ID of the entity (e.g., cardId).
     * @param key - The specific key to retrieve.
     */
    get: (scope: string, entityId: string, key: string) => {
        return new Promise((resolve, reject) => {
            const messageId = Math.random().toString(36);

            // Listener for the response
            const handler = (event: MessageEvent) => {
                // Verify the message comes from Mello and matches our request ID
                if (event.data?.type === 'mello:data:response' && event.data?.messageId === messageId) {
                    window.removeEventListener('message', handler); // Clean up listener
                    if (event.data.error) reject(new Error(event.data.error));
                    else resolve(event.data.value);
                }
            };
            window.addEventListener('message', handler);

            // Send request to Host
            window.parent.postMessage({
                type: 'mello:data:request',
                messageId,
                scope,
                entityId,
                key
            }, '*'); // In production, replace '*' with specific origin for security

            // Timeout after 5s to prevent hanging promises
            setTimeout(() => {
                window.removeEventListener('message', handler);
                reject(new Error('Timeout'));
            }, 5000);
        });
    },

    /**
     * Save data to Mello's storage.
     * @param scope - The scope of data.
     * @param entityId - The ID of the entity.
     * @param key - The specific key to save.
     * @param value - The value to store (must be serializable).
     */
    set: (scope: string, entityId: string, key: string, value: any) => {
        return new Promise((resolve, reject) => {
            const messageId = Math.random().toString(36);

            const handler = (event: MessageEvent) => {
                if (event.data?.type === 'mello:data:response' && event.data?.messageId === messageId) {
                    window.removeEventListener('message', handler);
                    clearTimeout(timeoutId);
                    if (event.data.error) reject(new Error(event.data.error));
                    else resolve(event.data.success);
                }
            };
            window.addEventListener('message', handler);

            window.parent.postMessage({
                type: 'mello:data:save',
                messageId,
                scope,
                entityId,
                key,
                value
            }, '*');

            // Timeout after 10 seconds for write operations
            const timeoutId = setTimeout(() => {
                window.removeEventListener('message', handler);
                reject(new Error('Save timeout'));
            }, 10000);
        });
    },
    /**
     * Get plugin settings.
     */
    getSettings: () => {
        return new Promise((resolve, reject) => {
            const messageId = Math.random().toString(36);
            const handler = (event: MessageEvent) => {
                if (event.data?.type === 'mello:data:response' && event.data?.messageId === messageId) {
                    window.removeEventListener('message', handler);
                    if (event.data.error) reject(new Error(event.data.error));
                    else resolve(event.data.value);
                }
            };
            window.addEventListener('message', handler);
            window.parent.postMessage({
                type: 'mello:settings:get',
                messageId
            }, '*');

            setTimeout(() => {
                window.removeEventListener('message', handler);
                reject(new Error('Timeout'));
            }, 5000);
        });
    }
};
