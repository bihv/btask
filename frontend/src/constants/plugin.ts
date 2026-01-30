export const PLUGIN_SLOTS = {
    CARD_BADGE: 'card-badge',
    CARD_BACK_SECTION: 'card-back-section',
    CARD_BUTTON: 'card-button',
} as const;

export const PLUGIN_CAPABILITIES = {
    CARD_BADGES: 'card-badges',
    CARD_BUTTONS: 'card-buttons',
    CARD_BACK_SECTION: 'card-back-section',
    BOARD_BUTTONS: 'board-buttons',
    SETTINGS: 'settings',
} as const;

export const PLUGIN_PERMISSIONS = {
    READ_CARDS: 'read:cards',
    WRITE_CARDS: 'write:cards',
    READ_LISTS: 'read:lists',
    WRITE_LISTS: 'write:lists',
    READ_BOARDS: 'read:boards',
    WRITE_BOARDS: 'write:boards',
    READ_MEMBERS: 'read:members',
} as const;
