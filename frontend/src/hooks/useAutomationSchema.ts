import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import api from '@/lib/api';
import type {
    AutomationSchema,
    TriggerSchema,
    ActionSchema,
    OperatorSchema,
    ConditionFieldSchema,
    ValidationResult,
    AutomationRule,
    TriggersByCategory,
    ActionsByCategory,
    PropertySchema,
} from '@/types/automation';

// ============================================================================
// Automation Schema Hooks
// Fetch schema from the new registry-based API
// ============================================================================

// Transform backend TriggerInfo to frontend TriggerSchema
function transformTrigger(raw: any): TriggerSchema {
    // Backend returns: { id, name, description, events, schema: { properties: {...}, order: [...] }, metadata: { category, icon } }
    // Frontend expects: { id, name, description, category, events, properties: [...], sentence_template }
    
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
    // Backend returns: { id, name, description, schema: { properties: {...}, ... }, metadata: { category, icon } }
    // Frontend expects: { id, name, description, category, properties: [...], sentence_template }
    
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
            // API returns { data: [...] } - transform each trigger
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
            // API returns { data: [...] } - transform each action
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
            // API returns { data: { operators: [...] } }
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
            // API returns { data: { fields: [...] } }
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
    const { message } = App.useApp();

    return useMutation<ValidationResult, Error, ValidateRuleInput>({
        mutationFn: async (rule) => {
            const { data } = await api.post('/automation/validate', rule);
            return data.data || data;
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Validation failed');
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
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateRuleInput) => {
            const { data } = await api.post('/automation/rules', input);
            return data.data || data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['automation', 'rules', variables.board_id] });
            queryClient.invalidateQueries({ queryKey: ['rules'] }); // Legacy
            message.success('Rule created successfully');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to create rule');
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
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: UpdateRuleInput) => {
            const response = await api.put(`/automation/rules/${id}`, data);
            return response.data.data || response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation', 'rules'] });
            queryClient.invalidateQueries({ queryKey: ['rules'] }); // Legacy
            message.success('Rule updated successfully');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to update rule');
        },
    });
};

/**
 * Delete a rule
 */
export const useDeleteRule = () => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/automation/rules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation', 'rules'] });
            queryClient.invalidateQueries({ queryKey: ['rules'] }); // Legacy
            message.success('Rule deleted successfully');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to delete rule');
        },
    });
};

/**
 * Toggle rule enabled/disabled
 */
export const useToggleRule = () => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
            const { data } = await api.put(`/automation/rules/${id}`, { is_enabled: enabled });
            return data.data || data;
        },
        onSuccess: (_, { enabled }) => {
            queryClient.invalidateQueries({ queryKey: ['automation', 'rules'] });
            queryClient.invalidateQueries({ queryKey: ['rules'] }); // Legacy
            message.success(enabled ? 'Rule enabled' : 'Rule disabled');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to toggle rule');
        },
    });
};

/**
 * Run a rule manually
 */
export const useRunRule = () => {
    const { message } = App.useApp();

    return useMutation({
        mutationFn: async ({ ruleId, cardId }: { ruleId: string; cardId?: string }) => {
            const { data } = await api.post(`/automation/rules/${ruleId}/run`, { card_id: cardId });
            return data.data || data;
        },
        onSuccess: () => {
            message.success('Rule executed successfully');
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to run rule');
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
    
    // Replace {property} placeholders with values
    const placeholders = template.match(/\{(\w+)\}/g) || [];
    
    for (const placeholder of placeholders) {
        const key = placeholder.slice(1, -1);
        let value = config[key];
        
        // Use custom resolver if provided
        if (resolvers && resolvers[key]) {
            value = resolvers[key](value);
        }
        
        // Convert value to display string
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
