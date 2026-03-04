import api from '@/lib/api';
import type {
    ActionsByCategory,
    ActionSchema,
    AutomationRule,
    AutomationSchema,
    ConditionFieldSchema,
    OperatorSchema,
    PropertySchema,
    TriggersByCategory,
    TriggerSchema,
    ValidationResult,
} from '@/types/automation';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// Automation Schema Hooks
// Fetch schema from the new registry-based API
// ============================================================================

// Transform backend TriggerInfo to frontend TriggerSchema
function transformTrigger(raw: any): TriggerSchema {
    const properties: PropertySchema[] = [];
    if (raw.schema?.properties) {
        const order = raw.schema.order || Object.keys(raw.schema.properties);
        for (const key of order) {
            const prop = raw.schema.properties[key];
            if (prop) {
                properties.push({
                    name: key,
                    type: prop.type || 'string',
                    label: prop.label || key,
                    description: prop.description,
                    required: prop.required,
                    default: prop.default,
                    options: prop.options,
                    widget: prop.ui_widget as any,
                });
            }
        }
    }

    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        category: raw.metadata?.category || 'card',
        events: raw.events || [],
        properties,
        sentence_template: raw.sentence_template,
    };
}

// Transform backend ActionInfo to frontend ActionSchema
function transformAction(raw: any): ActionSchema {
    const properties: PropertySchema[] = [];
    if (raw.schema?.properties) {
        const order = raw.schema.order || Object.keys(raw.schema.properties);
        for (const key of order) {
            const prop = raw.schema.properties[key];
            if (prop) {
                properties.push({
                    name: key,
                    type: prop.type || 'string',
                    label: prop.label || key,
                    description: prop.description,
                    required: prop.required,
                    default: prop.default,
                    options: prop.options,
                    widget: prop.ui_widget as any,
                });
            }
        }
    }

    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        category: raw.metadata?.category || 'card',
        properties,
        sentence_template: raw.sentence_template,
    };
}

const SCHEMA_STALE_TIME = 1000 * 60 * 30; // 30 minutes - schema rarely changes

/**
 * Fetch full automation schema (triggers, actions, operators, fields)
 */
export const useAutomationSchema = () => {
    return useQuery<AutomationSchema>({
        queryKey: ['automation', 'schema'],
        queryFn: async () => {
            const { data } = await api.get('/automation/schema');
            return data.data || data;
        },
        staleTime: SCHEMA_STALE_TIME,
        gcTime: 1000 * 60 * 60, // Cache for 1 hour
    });
};

/**
 * Fetch available triggers
 */
export const useAvailableTriggers = () => {
    return useQuery<TriggerSchema[]>({
        queryKey: ['automation', 'triggers'],
        queryFn: async () => {
            const { data } = await api.get('/automation/triggers');
            const rawTriggers = data.data || data.triggers || [];
            return rawTriggers.map(transformTrigger);
        },
        staleTime: SCHEMA_STALE_TIME,
    });
};

/**
 * Fetch available actions
 */
export const useAvailableActions = () => {
    return useQuery<ActionSchema[]>({
        queryKey: ['automation', 'actions'],
        queryFn: async () => {
            const { data } = await api.get('/automation/actions');
            const rawActions = data.data || data.actions || [];
            return rawActions.map(transformAction);
        },
        staleTime: SCHEMA_STALE_TIME,
    });
};

/**
 * Fetch condition operators
 */
export const useConditionOperators = () => {
    return useQuery<OperatorSchema[]>({
        queryKey: ['automation', 'operators'],
        queryFn: async () => {
            const { data } = await api.get('/automation/conditions/operators');
            return data.data?.operators || data.data || [];
        },
        staleTime: SCHEMA_STALE_TIME,
    });
};

/**
 * Fetch condition fields
 */
export const useConditionFields = () => {
    return useQuery<ConditionFieldSchema[]>({
        queryKey: ['automation', 'fields'],
        queryFn: async () => {
            const { data } = await api.get('/automation/conditions/fields');
            return data.data?.fields || data.data || [];
        },
        staleTime: SCHEMA_STALE_TIME,
    });
};

/**
 * Get triggers grouped by category
 */
export const useTriggersByCategory = () => {
    const { data: triggers, ...rest } = useAvailableTriggers();

    const grouped: TriggersByCategory = triggers?.reduce((acc, trigger) => {
        if (!acc[trigger.category]) {
            acc[trigger.category] = [];
        }
        acc[trigger.category].push(trigger);
        return acc;
    }, {} as TriggersByCategory) || {};

    return { data: grouped, triggers, ...rest };
};

/**
 * Get actions grouped by category
 */
export const useActionsByCategory = () => {
    const { data: actions, ...rest } = useAvailableActions();

    const grouped: ActionsByCategory = actions?.reduce((acc, action) => {
        if (!acc[action.category]) {
            acc[action.category] = [];
        }
        acc[action.category].push(action);
        return acc;
    }, {} as ActionsByCategory) || {};

    return { data: grouped, actions, ...rest };
};

// ============================================================================
// Validation Hook
// ============================================================================

export interface ValidateRuleInput {
    board_id: string;
    trigger_type: string;
    trigger_config: any;
    conditions?: any[];
    actions: any[];
}

/**
 * Validate a rule before saving
 */
export const useValidateRule = () => {
    return useMutation<ValidationResult, Error, ValidateRuleInput>({
        mutationFn: async (rule) => {
            const { data } = await api.post('/automation/validate', rule);
            return data.data || data;
        },
        onError: (error: any) => {
            notifications.show({ title: 'Error', message: error.response?.data?.error || 'Validation failed', color: 'red' });
        },
    });
};

// ============================================================================
// CRUD Hooks (migrated from useAutomation.ts with improved types)
// ============================================================================

/**
 * Fetch rules for a board
 */
export const useBoardRules = (boardId: string) => {
    return useQuery<AutomationRule[]>({
        queryKey: ['automation', 'rules', boardId],
        queryFn: async () => {
            const { data } = await api.get(`/boards/${boardId}/automation/rules`);
            return data.data || [];
        },
        enabled: !!boardId,
    });
};

/**
 * Fetch a single rule
 */
export const useRule = (ruleId: string) => {
    return useQuery<AutomationRule>({
        queryKey: ['automation', 'rule', ruleId],
        queryFn: async () => {
            const { data } = await api.get(`/automation/rules/${ruleId}`);
            return data.data || data;
        },
        enabled: !!ruleId,
    });
};

export interface CreateRuleInput {
    board_id: string;
    name: string;
    description?: string;
    trigger_type: 'event' | 'schedule' | 'manual';
    trigger_config: any;
    conditions?: any[];
    actions: any[];
    is_enabled?: boolean;
}

/**
 * Create a new rule
 */
export const useCreateRule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateRuleInput) => {
            const { data } = await api.post('/automation/rules', input);
            return data.data || data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['automation', 'rules', variables.board_id] });
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            notifications.show({ message: 'Rule created successfully', color: 'green' });
        },
        onError: (error: any) => {
            notifications.show({ title: 'Error', message: error.response?.data?.error || 'Failed to create rule', color: 'red' });
        },
    });
};

export interface UpdateRuleInput {
    id: string;
    data: Partial<CreateRuleInput>;
}

/**
 * Update an existing rule
 */
export const useUpdateRule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: UpdateRuleInput) => {
            const response = await api.put(`/automation/rules/${id}`, data);
            return response.data.data || response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation', 'rules'] });
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            notifications.show({ message: 'Rule updated successfully', color: 'green' });
        },
        onError: (error: any) => {
            notifications.show({ title: 'Error', message: error.response?.data?.error || 'Failed to update rule', color: 'red' });
        },
    });
};

/**
 * Delete a rule
 */
export const useDeleteRule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/automation/rules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation', 'rules'] });
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            notifications.show({ message: 'Rule deleted successfully', color: 'green' });
        },
        onError: (error: any) => {
            notifications.show({ title: 'Error', message: error.response?.data?.error || 'Failed to delete rule', color: 'red' });
        },
    });
};

/**
 * Toggle rule enabled/disabled
 */
export const useToggleRule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
            const { data } = await api.put(`/automation/rules/${id}`, { is_enabled: enabled });
            return data.data || data;
        },
        onSuccess: (_, { enabled }) => {
            queryClient.invalidateQueries({ queryKey: ['automation', 'rules'] });
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            notifications.show({ message: enabled ? 'Rule enabled' : 'Rule disabled', color: 'green' });
        },
        onError: (error: any) => {
            notifications.show({ title: 'Error', message: error.response?.data?.error || 'Failed to toggle rule', color: 'red' });
        },
    });
};

/**
 * Run a rule manually
 */
export const useRunRule = () => {
    return useMutation({
        mutationFn: async ({ ruleId, cardId }: { ruleId: string; cardId?: string }) => {
            const { data } = await api.post(`/automation/rules/${ruleId}/run`, { card_id: cardId });
            return data.data || data;
        },
        onSuccess: () => {
            notifications.show({ message: 'Rule executed successfully', color: 'green' });
        },
        onError: (error: any) => {
            notifications.show({ title: 'Error', message: error.response?.data?.error || 'Failed to run rule', color: 'red' });
        },
    });
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a trigger schema by ID
 */
export const findTriggerById = (triggers: TriggerSchema[], id: string): TriggerSchema | undefined => {
    return triggers.find(t => t.id === id);
};

/**
 * Find an action schema by ID
 */
export const findActionById = (actions: ActionSchema[], id: string): ActionSchema | undefined => {
    return actions.find(a => a.id === id);
};

/**
 * Get operators compatible with a field type
 */
export const getOperatorsForFieldType = (
    operators: OperatorSchema[],
    fieldType: string
): OperatorSchema[] => {
    return operators.filter(op => op.supported_types.includes(fieldType));
};

/**
 * Build a human-readable description from a trigger/action config
 */
export const buildDescription = (
    template: string | undefined,
    config: Record<string, any>,
    resolvers?: Record<string, (value: any) => string>
): string => {
    if (!template) return '';

    let result = template;

    const placeholders = template.match(/\{(\w+)\}/g) || [];

    for (const placeholder of placeholders) {
        const key = placeholder.slice(1, -1);
        let value = config[key];

        if (resolvers && resolvers[key]) {
            value = resolvers[key](value);
        }

        if (value === undefined || value === null) {
            value = `{${key}}`;
        } else if (typeof value === 'boolean') {
            value = value ? 'yes' : 'no';
        } else if (Array.isArray(value)) {
            value = value.join(', ');
        }

        result = result.replace(placeholder, String(value));
    }

    return result;
};
