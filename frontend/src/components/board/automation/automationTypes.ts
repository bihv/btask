export type TriggerCategory = 'card_move' | 'card_changes' | 'dates' | 'checklists' | 'content' | 'fields';

export interface TriggerOption {
    id: string;
    text: string; // The full sentence template
    category: TriggerCategory;
    parts: TriggerPart[];
}

export type TriggerPartType = 'static' | 'filter' | 'user' | 'list_select' | 'verb_select' | 'input_text' | 'input_number' | 'condition_group';

export interface TriggerPart {
    type: TriggerPartType;
    value?: string; // For static text or default value
    options?: string[]; // For dropdowns
    key?: string; // key in the data object
    placeholder?: string;
}

export const TRIGGER_CATEGORIES: { id: TriggerCategory; label: string; icon?: string }[] = [
    { id: 'card_move', label: 'Card Move' },
    { id: 'card_changes', label: 'Card Changes' },
    { id: 'dates', label: 'Dates' },
    { id: 'checklists', label: 'Checklists' },
    { id: 'content', label: 'Card Content' },
    { id: 'fields', label: 'Fields' },
];

export const TRIGGER_TEMPLATES: TriggerOption[] = [
    // --- CARD MOVE ---
    {
        id: 'card_added_to_board',
        category: 'card_move',
        text: 'when a card {filter} is {verb} the board {user}',
        parts: [
            { type: 'static', value: 'when a card' },
            { type: 'filter', key: 'filter' },
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'added to',
                options: ['added to', 'created in', 'emailed into', 'moved into', 'moved out of']
            },
            { type: 'static', value: 'the board' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'card_added_to_list',
        category: 'card_move',
        text: 'when a card {filter} is {verb} list {list} {user}',
        parts: [
            { type: 'static', value: 'when a card' },
            { type: 'filter', key: 'filter' },
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'added to',
                options: ['added to', 'copied into', 'created in', 'emailed into', 'moved into', 'moved out of']
            },
            { type: 'static', value: 'list' },
            { type: 'list_select', key: 'list_id' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'card_archived',
        category: 'card_move',
        text: 'when a card {filter} is {verb} {user}',
        parts: [
            { type: 'static', value: 'when a card' },
            { type: 'filter', key: 'filter' },
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'archived',
                options: ['archived', 'unarchived']
            },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'list_created',
        category: 'card_move',
        text: 'when a list is {verb} {user}',
        parts: [
            { type: 'static', value: 'when a list is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'created',
                options: ['created', 'renamed', 'archived', 'unarchived']
            },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'list_card_count',
        category: 'card_move',
        text: 'when list {list} has exactly {count} {conditions} cards',
        parts: [
            { type: 'static', value: 'when list' },
            { type: 'list_select', key: 'list_id' },
            { type: 'static', value: 'has exactly' },
            { type: 'input_number', key: 'count', value: '1' },
            { type: 'condition_group', key: 'conditions' }, // Dynamic "more than X", "fewer than Y"
            { type: 'static', value: 'cards' }
        ]
    },
];
