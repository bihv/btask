export type TriggerCategory = 'card_move' | 'card_changes' | 'dates' | 'checklists' | 'content' | 'fields';

export interface TriggerOption {
    id: string;
    text: string; // The full sentence template
    category: TriggerCategory;
    parts: TriggerPart[];
}

export type TriggerPartType = 'static' | 'filter' | 'user' | 'list_select' | 'verb_select' | 'input_text' | 'input_number' | 'condition_group' | 'label_select' | 'member_select' | 'text_match' | 'date_comparison' | 'custom_field_select' | 'custom_field_multi_select' | 'number_comparison';


export interface TriggerPart {
    type: TriggerPartType;
    value?: string; // For static text or default value
    options?: string[]; // For dropdowns
    key?: string; // key in the data object
    placeholder?: string;
    icon?: 'text' | 'list';
    filterType?: 'text' | 'number' | 'date' | 'checkbox'; // For custom_field_select
    tooltip?: string;
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
    // --- FIELDS ---
    {
        id: 'custom_fields_all_completed',
        category: 'fields',
        text: 'when all custom fields are completed {filter}',
        parts: [
            { type: 'static', value: 'when all custom fields are completed', tooltip: 'Supports all field types' },
            { type: 'filter', key: 'filter' }
        ]
    },
    {
        id: 'custom_field_completed',
        category: 'fields',
        text: 'when custom fields {fields} are completed {filter}',
        parts: [
            { type: 'static', value: 'when custom fields', tooltip: 'Supports all field types' },
            { type: 'custom_field_multi_select', key: 'field_ids' },
            { type: 'static', value: 'are completed' },
            { type: 'filter', key: 'filter' }
        ]
    },
    {
        id: 'custom_field_state_changed',
        category: 'fields',
        text: 'when custom field {field} is {state} {filter} {user}',
        parts: [
            { type: 'static', value: 'when custom field', tooltip: 'Supports all field types' },
            { type: 'custom_field_select', key: 'field_id' },
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'state',
                value: 'set',
                options: ['set', 'cleared']
            },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'custom_field_value_changed',
        category: 'fields',
        text: 'when custom field {field} is set to {value} {filter} {user}',
        parts: [
            { type: 'static', value: 'when custom field', tooltip: 'Supports: Text, Number' },
            { type: 'custom_field_select', key: 'field_id', filterType: 'text' }, // Also supports number technically
            { type: 'static', value: 'is set to' },
            { type: 'input_text', key: 'value', placeholder: 'value' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'custom_field_checkbox_changed',
        category: 'fields',
        text: 'when custom field {field} is {state} {filter} {user}',
        parts: [
            { type: 'static', value: 'when custom field', tooltip: 'Supports: Checkbox' },
            { type: 'custom_field_select', key: 'field_id', filterType: 'checkbox' },
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'state',
                value: 'checked',
                options: ['checked', 'unchecked']
            },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'custom_field_number_changed',
        category: 'fields',
        text: 'when custom field {field} is set to a number {comparison} {filter} {user}',
        parts: [
            { type: 'static', value: 'when custom field', tooltip: 'Supports: Number' },
            { type: 'custom_field_select', key: 'field_id', filterType: 'number' },
            { type: 'static', value: 'is set to a number' },
            { type: 'number_comparison', key: 'comparison' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'custom_field_date_range_changed',
        category: 'fields',
        text: 'when custom field {field} is set to a date {operator} {range} {filter} {user}',
        parts: [
            { type: 'static', value: 'when custom field', tooltip: 'Supports: Date' },
            { type: 'custom_field_select', key: 'field_id', filterType: 'date' },
            { type: 'static', value: 'is set to a date' },
            {
                type: 'verb_select',
                key: 'operator',
                value: 'in',
                options: ['in', 'not in']
            },
            {
                type: 'verb_select',
                key: 'range',
                value: 'this week',
                options: ['this week', 'next week', 'this month', 'next month']
            },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'custom_field_date_relative_changed',
        category: 'fields',
        text: 'when custom field {field} is set to a date {date} {filter} {user}',
        parts: [
            { type: 'static', value: 'when custom field', tooltip: 'Supports: Date' },
            { type: 'custom_field_select', key: 'field_id', filterType: 'date' },
            { type: 'static', value: 'is set to a date' },
            { type: 'date_comparison', key: 'date' }, // Reusing date comparison part!
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
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

    // --- CARD CHANGES ---
    {
        id: 'card_status_changed',
        category: 'card_changes',
        text: 'when the card is marked as {verb} in a card {filter} {user}',
        parts: [
            { type: 'static', value: 'when the card is marked as' },
            {
                type: 'verb_select',
                key: 'status',
                value: 'complete',
                options: ['complete', 'incomplete']
            },
            { type: 'static', value: 'in a card' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'label_changed',
        category: 'card_changes',
        text: 'when the {label} label is {verb} a card {filter} {user}',
        parts: [
            { type: 'static', value: 'when the' },
            { type: 'label_select', key: 'label_id' },
            { type: 'static', value: 'label is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'added to',
                options: ['added to', 'removed from']
            },
            { type: 'static', value: 'a card' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'attachment_changed',
        category: 'card_changes',
        text: 'when an attachment {match} is {verb} a card {filter} {user}',
        parts: [
            { type: 'static', value: 'when an attachment' },
            { type: 'text_match', key: 'attachment_name' },
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'added to',
                options: ['added to', 'removed from']
            },
            { type: 'static', value: 'a card' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'member_me_changed',
        category: 'card_changes',
        text: 'when {subject} {verb} a card {filter} {user}',
        parts: [
            { type: 'static', value: 'when' },
            {
                type: 'verb_select',
                key: 'subject',
                value: 'I am',
                options: ['I am', 'someone is']
            },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'added to',
                options: ['added to', 'removed from']
            },
            { type: 'static', value: 'a card' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'member_changed',
        category: 'card_changes',
        text: 'when {member} is {verb} a card {filter} {user}',
        parts: [
            { type: 'static', value: 'when' },
            { type: 'member_select', key: 'member_id' },
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'added to',
                options: ['added to', 'removed from']
            },
            { type: 'static', value: 'a card' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'vote_changed',
        category: 'card_changes',
        text: 'when a vote is {verb} a card {filter} {user}',
        parts: [
            { type: 'static', value: 'when a vote is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'added to',
                options: ['added to', 'removed from']
            },
            { type: 'static', value: 'a card' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    // --- DATES ---
    {
        id: 'date_changed',
        category: 'dates',
        text: 'when a {date_field} date {comparison} is {verb} a card {filter} {user}',
        parts: [
            { type: 'static', value: 'when a' },
            {
                type: 'verb_select',
                key: 'date_field',
                value: 'due',
                options: ['due', 'start']
            },
            { type: 'static', value: 'date' },
            { type: 'date_comparison', key: 'comparison' },
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'set on',
                options: ['set on', 'moved on', 'removed from']
            },
            { type: 'static', value: 'a card' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    // --- CHECKLISTS ---
    {
        id: 'checklist_added_to_card',
        category: 'checklists',
        text: 'when checklist {name} is {verb} a card {filter} {user}',
        parts: [
            { type: 'static', value: 'when checklist' },
            { type: 'input_text', key: 'checklist_name', placeholder: 'Checklist name' },
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'added to',
                options: ['added to', 'removed from']
            },
            { type: 'static', value: 'a card' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'checklist_completed',
        category: 'checklists',
        text: 'when {scope} {name} is {verb} in a card {filter} {user}',
        parts: [
            { type: 'static', value: 'when' },
            {
                type: 'verb_select',
                key: 'scope',
                value: 'checklist',
                options: ['checklist', 'a checklist', 'all checklists']
            },
            { type: 'input_text', key: 'checklist_name', placeholder: 'Checklist name' }, // Hide if scope != 'checklist'
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'completed',
                options: ['completed', 'made incomplete']
            },
            { type: 'static', value: 'in a card' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'checklist_item_state_changed',
        category: 'checklists',
        text: 'when {scope} {item_name} item is {verb} {checklist_source} {filter} {user}',
        parts: [
            { type: 'static', value: 'when' },
            {
                type: 'verb_select',
                key: 'scope',
                value: 'the',
                options: ['the', 'an']
            },
            { type: 'input_text', key: 'item_name', placeholder: 'Item name' },
            { type: 'static', value: 'item is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'checked',
                options: ['checked', 'unchecked']
            },
            { type: 'input_text', key: 'checklist_name', icon: 'list', placeholder: 'Checklist name' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'checklist_item_due_date',
        category: 'checklists',
        text: 'when a due date {date} is {verb} a checklist item',
        parts: [
            { type: 'static', value: 'when a due date' },
            { type: 'date_comparison', key: 'date' },
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'set on',
                options: ['set on', 'removed from']
            },
            { type: 'static', value: 'a checklist item' }
        ]
    },
    {
        id: 'checklist_item_added',
        category: 'checklists',
        text: 'when an item {item_name} is {verb} {scope} {checklist_name} {filter} {user}',
        parts: [
            { type: 'static', value: 'when an item' },
            { type: 'text_match', key: 'item_name' },
            { type: 'static', value: 'is' },
            {
                type: 'verb_select',
                key: 'verb',
                value: 'added to',
                options: ['added to', 'removed from']
            },
            {
                type: 'verb_select',
                key: 'scope',
                value: 'checklist',
                options: ['checklist', 'a checklist']
            },
            { type: 'input_text', key: 'checklist_name', placeholder: 'Checklist name' }, // Hide if scope is 'a checklist'
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    // --- CARD CONTENT ---
    {
        id: 'card_content_changed',
        category: 'content',
        text: 'when {content_type} of a card {filter} {condition} {text}',
        parts: [
            { type: 'static', value: 'when' },
            {
                type: 'verb_select',
                key: 'content_type',
                value: 'the name',
                options: ['the name', 'the description', 'the name or the description']
            },
            { type: 'static', value: 'of a card' },
            { type: 'filter', key: 'filter' },
            {
                type: 'verb_select',
                key: 'condition',
                value: 'starts with',
                options: ['starts with', 'ends with', 'contains', 'does not start with', 'does not end with', 'does not contain']
            },
            { type: 'input_text', key: 'text', placeholder: 'text' }
        ]
    },
    {
        id: 'comment_added',
        category: 'content',
        text: 'when a comment {text_match} is posted to a card {filter} {user}',
        parts: [
            { type: 'static', value: 'when a comment' },
            { type: 'text_match', key: 'text_match' },
            { type: 'static', value: 'is posted to a card' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    },
    {
        id: 'member_mentioned',
        category: 'content',
        text: 'when {subject} mentioned {location} a card {filter} {user}',
        parts: [
            { type: 'static', value: 'when' },
            {
                type: 'verb_select',
                key: 'subject',
                value: 'someone is',
                options: ['someone is', 'I am']
            },
            { type: 'static', value: 'mentioned' },
            {
                type: 'verb_select',
                key: 'location',
                value: 'in a checklist on',
                options: ['in a checklist on', 'in a comment on', 'in the description of']
            },
            { type: 'static', value: 'a card' },
            { type: 'filter', key: 'filter' },
            { type: 'user', key: 'user' }
        ]
    }
];
