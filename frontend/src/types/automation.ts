// ============================================================================
// Automation Schema Types
// Types for the new automation registry system API
// ============================================================================

// --- Property Schema (for dynamic form generation) ---

export type UIWidgetType =
    | 'select'
    | 'multi_select'
    | 'input'
    | 'number'
    | 'checkbox'
    | 'date'
    | 'datetime'
    | 'textarea'
    | 'color'
    | 'user_select'
    | 'label_select'
    | 'list_select'
    | 'board_select'
    | 'member_select'
    | 'custom_field_select'
    // Picker variants (aliases from backend)
    | 'user_picker'
    | 'label_picker'
    | 'list_picker'
    | 'board_picker'
    | 'member_picker';

export interface SelectOption {
    value: string;
    label: string;
}

export interface PropertySchema {
    name: string;
    type: string;
    label: string;
    description?: string;
    required?: boolean;
    default?: any;
    options?: SelectOption[];
    widget?: UIWidgetType;
    placeholder?: string;
    min?: number;
    max?: number;
    validation?: {
        pattern?: string;
        message?: string;
    };
}

// --- Trigger Schema ---

export interface TriggerSchema {
    id: string;
    name: string;
    description: string;
    category: string;
    events: string[];
    properties: PropertySchema[];
    sentence_template?: string;
}

// --- Action Schema ---

export interface ActionSchema {
    id: string;
    name: string;
    description: string;
    category: string;
    properties: PropertySchema[];
    sentence_template?: string;
}

// --- Condition Types ---

export type OperatorType =
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'starts_with'
    | 'ends_with'
    | 'greater_than'
    | 'greater_than_or_equal'
    | 'less_than'
    | 'less_than_or_equal'
    | 'in'
    | 'not_in'
    | 'is_empty'
    | 'is_not_empty'
    | 'before'
    | 'after'
    | 'between'
    | 'regex';

export interface ConditionFieldSchema {
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'array';
    description?: string;
    operators: OperatorType[];
}

export interface OperatorSchema {
    id: OperatorType;
    name: string;
    description: string;
    value_required: boolean;
    supported_types: string[];
}

export interface RuleCondition {
    field: string;
    operator: OperatorType;
    value?: any;
    logic?: 'and' | 'or';
    conditions?: RuleCondition[]; // For nested conditions
}

// --- Full Automation Schema Response ---

export interface AutomationSchema {
    triggers: TriggerSchema[];
    actions: ActionSchema[];
    operators: OperatorSchema[];
    fields: ConditionFieldSchema[];
}

// --- Category Info ---

export interface CategoryInfo {
    id: string;
    label: string;
    icon?: string;
    order?: number;
}

// --- Validation ---

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

// --- Automation Rule (extended) ---

export interface AutomationRuleConfig {
    id: string;
    [key: string]: any;
}

export interface AutomationAction {
    id: string;
    [key: string]: any;
}

export interface AutomationRule {
    id: string;
    board_id: string;
    name: string;
    description?: string;
    trigger_type: 'event' | 'schedule' | 'manual';
    trigger_config: AutomationRuleConfig;
    conditions?: RuleCondition[];
    actions: AutomationAction[];
    is_enabled: boolean;
    run_count?: number;
    last_run_at?: string;
    created_at: string;
    updated_at: string;
}

// --- Event Payload Types (for context) ---

export interface CardEventPayload {
    card_id: string;
    list_id: string;
    board_id: string;
    title?: string;
    old_list_id?: string;
    new_list_id?: string;
    label_id?: string;
    member_id?: string;
    user_id?: string;
    due_date?: string;
    is_completed?: boolean;
    is_archived?: boolean;
}

// --- API Response Types ---

export interface ApiResponse<T> {
    data: T;
    success?: boolean;
    message?: string;
}

export interface SchemaApiResponse {
    triggers: TriggerSchema[];
    actions: ActionSchema[];
}

export interface TriggersApiResponse {
    triggers: TriggerSchema[];
}

export interface ActionsApiResponse {
    actions: ActionSchema[];
}

export interface OperatorsApiResponse {
    operators: OperatorSchema[];
}

export interface FieldsApiResponse {
    fields: ConditionFieldSchema[];
}

// --- Utility types for building UI ---

export type TriggersByCategory = Record<string, TriggerSchema[]>;
export type ActionsByCategory = Record<string, ActionSchema[]>;

export function groupByCategory<T extends { category: string }>(items: T[]): Record<string, T[]> {
    return items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, T[]>);
}

// --- Category definitions ---
// Only categories that have backend implementations

export const TRIGGER_CATEGORY_INFO: CategoryInfo[] = [
    { id: 'card', label: 'Card', order: 1 },
    { id: 'label', label: 'Labels', order: 2 },
    { id: 'member', label: 'Members', order: 3 },
    { id: 'date', label: 'Dates', order: 4 },
];

export const ACTION_CATEGORY_INFO: CategoryInfo[] = [
    { id: 'card', label: 'Card', order: 1 },
    { id: 'label', label: 'Labels', order: 2 },
    { id: 'member', label: 'Members', order: 3 },
    { id: 'date', label: 'Dates', order: 4 },
];
