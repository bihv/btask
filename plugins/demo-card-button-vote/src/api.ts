/**
 * Plugin API Client
 * 
 * Handles communication with the Mello Host Application using `postMessage`.
 */

export const STORAGE_KEY = 'vote_data';

export const melloApi = {
    /**
     * Fetch data from Mello's storage.
     */
    get: (scope: string, entityId: string, key: string) => {
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
                type: 'mello:data:request',
                messageId,
                scope,
                entityId,
                key
            }, '*');

            setTimeout(() => {
                window.removeEventListener('message', handler);
                reject(new Error('Timeout'));
            }, 5000);
        });
    },

    /**
     * Save data to Mello's storage.
     */
    set: (scope: string, entityId: string, key: string, value: any) => {
        return new Promise((resolve, reject) => {
            const messageId = Math.random().toString(36);

            const handler = (event: MessageEvent) => {
                if (event.data?.type === 'mello:data:response' && event.data?.messageId === messageId) {
                    window.removeEventListener('message', handler);
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

            setTimeout(() => {
                window.removeEventListener('message', handler);
                reject(new Error('Save timeout'));
            }, 10000);
        });
    }
};
