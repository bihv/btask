'use client';

import { useState } from 'react';
import { Steps, Form, Input, Select, Button, Space, Card, Typography, Divider, Tabs, List, Tag, Popover, Switch, Tooltip, theme } from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, UnorderedListOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useCreateRule, useUpdateRule } from '@/hooks/useAutomation';
import { useBoard, useAllBoards } from '@/hooks/useBoards';
import api from '@/lib/api';
import { TRIGGER_CATEGORIES, TRIGGER_TEMPLATES, ACTION_CATEGORIES, ACTION_TEMPLATES, TriggerOption, TriggerPart } from './automationTypes';
import { TriggerFilterModal } from './TriggerFilterModal';
import { TriggerUserModal } from './TriggerUserModal';
import { TriggerDateModal } from './TriggerDateModal';
import { TriggerTextMatchModal } from './TriggerTextMatchModal';

const { Text, Title, Paragraph } = Typography;

interface RuleBuilderProps {
    boardId: string;
    onCancel: () => void;
    onSuccess: () => void;
    ruleToEdit?: any;
}

export default function RuleBuilder({ boardId, onCancel, onSuccess, ruleToEdit }: RuleBuilderProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const { token } = theme.useToken();
    const createRule = useCreateRule();
    const updateRule = useUpdateRule();
    const { data: board } = useBoard(boardId);
    const { data: allBoards } = useAllBoards();

    // Data for popovers
    const lists = board?.lists || [];
    const labels = board?.labels || [];
    const members = (board as any)?.members || [];

    // Mocking fields since we don't have them in props yet properly
    const customFields = [
        { id: 'f1', name: 'Priority', type: 'number' },
        { id: 'f2', name: 'Status', type: 'text' },
        { id: 'f3', name: 'Start Date', type: 'date' },
        { id: 'f4', name: 'Verified', type: 'checkbox' },
        { id: 'f5', name: 'Story Points', type: 'number' },
        { id: 'f6', name: 'Location', type: 'text' },
    ];

    // State for Trigger Builder
    const [activeCategory, setActiveCategory] = useState<string>('card_move');
    const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(() => {
        if (ruleToEdit && ruleToEdit.trigger_config) {
            return ruleToEdit.trigger_config.id;
        }
        return null;
    });
    const [triggerConfig, setTriggerConfig] = useState<any>(() => {
        if (ruleToEdit && ruleToEdit.trigger_config) {
            return { [ruleToEdit.trigger_config.id]: ruleToEdit.trigger_config };
        }
        return {};
    }); // Store configurations for each trigger ID
    const [isAdvanced, setIsAdvanced] = useState(true);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

    // State for Action Builder (Step 2)
    const [activeActionCategory, setActiveActionCategory] = useState<string>('move');
    const [actions, setActions] = useState<any[]>(() => {
        if (ruleToEdit && ruleToEdit.actions) {
            // Need to reconstruct action config for validation?
            return ruleToEdit.actions;
        }
        return [];
    }); // List of added actions [{ id: 'move_card', ...config }]
    const [actionConfig, setActionConfig] = useState<any>(() => {
        if (ruleToEdit && ruleToEdit.actions) {
            const config: any = {};
            ruleToEdit.actions.forEach((act: any) => {
                config[act.id] = act;
            });
            return config;
        }
        return {};
    }); // Configuration for current editing action inputs
    const [remoteLists, setRemoteLists] = useState<Record<string, any[]>>({}); // Cache for lists of other boards
    const [actionValidationErrors, setActionValidationErrors] = useState<Record<string, string[]>>({});

    // State for Rule Name
    const [ruleName, setRuleName] = useState(() => ruleToEdit ? ruleToEdit.name : 'New Automation Rule');
    const [isNameEdited, setIsNameEdited] = useState(false);

    // Helper to generate text description
    // Helper to generate text description
    const getTriggerDescription = () => {
        if (!selectedTriggerId) return '';
        const template = TRIGGER_TEMPLATES.find(t => t.id === selectedTriggerId);
        if (!template) return '';
        const config = triggerConfig[selectedTriggerId] || {};

        return template.parts.map(part => {
            if (part.type === 'static') return part.value;
            if (part.key) {
                let val = config[part.key];

                // Handle special types mapping
                if (part.type === 'list_select' && val) {
                    const list = lists.find((l: any) => l.id === val);
                    if (list) val = list.title;
                }

                if ((part.type === 'board_select') && val) {
                    const board = allBoards?.find((b: any) => b.id === val);
                    if (board) val = board.title;
                }

                if (part.type === 'user' && val && typeof val === 'object') {
                    val = val.text || val.username || val.name;
                }

                // Handle Label objects if any
                if (part.type === 'label_select' && val) {
                    if (typeof val === 'object') val = val.name;
                    else {
                        const label = labels.find((l: any) => l.id === val);
                        if (label) val = label.name;
                    }
                }

                if (part.type === 'member_select' && val) {
                    const member = members.find((m: any) => m.id === val);
                    if (member) val = member.username || member.fullName;
                }

                // Check if val is still an object (fallback)
                if (typeof val === 'object' && val !== null) {
                    return JSON.stringify(val);
                }

                return val !== undefined ? val : (part.value || '');
            }
            return '';
        }).join(' ').replace(/\s+/g, ' ').trim();
    };

    const getActionDescription = (action: any) => {
        const template = ACTION_TEMPLATES.find(t => t.id === action.id);
        if (!template) return action.id;

        return template.parts.map(part => {
            if (part.type === 'static') return part.value;

            if (part.key) {
                let val = action[part.key];

                if (part.type === 'list_select' && val) {
                    // Check local lists first
                    let list = lists.find((l: any) => l.id === val);

                    // Check remote lists if board_id is present in action
                    if (!list && action.board_id) {
                        const remote = remoteLists[action.board_id];
                        if (remote) {
                            list = remote.find((l: any) => l.id === val);
                        }
                    }
                    if (list) val = list.title;
                }

                if (part.type === 'board_select') {
                    if (val) {
                        const board = allBoards?.find((b: any) => b.id === val);
                        if (board) val = board.title;
                    } else if (board) {
                        val = board.title;
                    }
                }

                // Fallback for missing values or objects
                if (val === undefined || val === null) return part.value || '';
                if (typeof val === 'object') return JSON.stringify(val);

                return val;
            }
            return '';
        }).join(' ').replace(/\s+/g, ' ').trim();
    };

    const validateTrigger = (triggerId: string, template: TriggerOption, config: any) => {
        const errors: string[] = [];

        template.parts.forEach(part => {
            // 1. Check Visibility (Copy of render logic)
            if (template.id === 'date_changed' && part.key === 'comparison') {
                const currentVerb = config['verb'] || 'set on';
                if (currentVerb === 'removed from') return;
            }
            if ((template.id === 'checklist_completed' || template.id === 'checklist_item_added') && part.key === 'checklist_name') {
                const currentScope = config['scope'] || 'checklist';
                if (currentScope !== 'checklist') return;
            }
            if (template.id === 'checklist_item_state_changed' && part.key === 'item_name') {
                const currentScope = config['scope'] || 'the';
                if (currentScope === 'an') return;
            }

            // 2. Validate based on type
            if (!part.key) return; // Static parts or no key

            // Use config value if present, otherwise fallback to default value from template
            const val = config[part.key] !== undefined ? config[part.key] : part.value;

            switch (part.type) {
                case 'static':
                case 'filter':
                case 'user':
                    return; // Ignore

                case 'custom_field_multi_select':
                    if (!val || val.length === 0) errors.push(part.key);
                    break;

                case 'input_text':
                    if (part.icon === 'list') {
                        if (!val) errors.push(part.key);
                    } else {
                        if (!val) errors.push(part.key);
                    }
                    break;

                case 'number_comparison':
                    if (!val) {
                    }
                    break;

                default:
                    // Selects, etc.
                    if (val === undefined || val === null || val === '') {
                        errors.push(part.key);
                    }
            }
        });

        return errors;
    };

    const validateAction = (templateId: string, template: any, config: any) => {
        const errors: string[] = [];
        template.parts.forEach((part: any) => {
            if (part.type === 'static') return;
            if (!part.key) return;

            const val = config[part.key] !== undefined ? config[part.key] : part.value;
            // Check required fields
            if (['list_select', 'board_select', 'verb_select', 'member_select', 'label_select'].includes(part.type)) {

                // board_select is optional (defaults to current board)
                if (part.type === 'board_select') return;

                if (val === undefined || val === null || val === '') {
                    errors.push(part.key);
                }
            }
            // Add other types if needed
        });
        return errors;
    };


    const handleUpdateTrigger = (triggerId: string, key: string, value: any) => {
        setTriggerConfig((prev: any) => ({
            ...prev,
            [triggerId]: {
                ...prev[triggerId],
                [key]: value
            }
        }));
        // Clear error for this field if exists
        if (validationErrors[triggerId]?.includes(key)) {
            setValidationErrors(prev => ({
                ...prev,
                [triggerId]: prev[triggerId].filter(k => k !== key)
            }));
        }
    };

    // Helper to fetch lists for a board
    const fetchBoardLists = async (targetBoardId: string) => {
        if (!targetBoardId || targetBoardId === boardId) return; // Current board already has lists
        if (remoteLists[targetBoardId]) return; // Already cached

        try {
            const res = await api.get(`/boards/${targetBoardId}`);
            const data = res.data.data;
            if (data && data.lists) {
                setRemoteLists(prev => ({ ...prev, [targetBoardId]: data.lists }));
            }
        } catch (err) {
            console.error('Failed to fetch lists for board', targetBoardId, err);
        }
    };

    const handleUpdateAction = (templateId: string, key: string, value: any) => {
        setActionConfig((prev: any) => {
            const newConfig = {
                ...prev,
                [templateId]: {
                    ...prev[templateId],
                    [key]: value
                }
            };

            // If board_id changed, fetch lists
            if (key === 'board_id' && value) {
                fetchBoardLists(value);
                // Optionally clear list_name if board changed?
                // newConfig[templateId].list_name = null; 
            }
            return newConfig;
        });
        // Clear error for this field if exists
        if (actionValidationErrors[templateId]?.includes(key)) {
            setActionValidationErrors(prev => ({
                ...prev,
                [templateId]: prev[templateId].filter(k => k !== key)
            }));
        }
    };

    const renderTriggerSummary = () => {
        if (!selectedTriggerId) return 'No trigger selected';
        const template = TRIGGER_TEMPLATES.find(t => t.id === selectedTriggerId);
        if (!template) return selectedTriggerId;

        return (
            <Space wrap size={4}>
                {template.parts.map((part, index) => {
                    const config = triggerConfig[selectedTriggerId] || {};

                    if (part.type === 'static') {
                        return <Text key={index} style={{ color: token.colorTextSecondary }}>{part.value}</Text>;
                    }

                    if (part.type === 'filter') {
                        const filters = config.filters || [];
                        if (filters.length === 0) return null;
                        return (
                            <Space key={index} size={2}>
                                {filters.map((f: any, i: number) => (
                                    <Tag key={i} style={{ margin: 0 }}>{f.text}</Tag>
                                ))}
                            </Space>
                        );
                    }

                    if (part.type === 'user') {
                        if (!config.user) return null;
                        return <Tag key={index} style={{ margin: 0 }}>{config.user.text}</Tag>;
                    }

                    if (part.key) {
                        let val = config[part.key];
                        // List select lookup
                        if (part.type === 'list_select' && val) {
                            const list = lists.find((l: any) => l.id === val);
                            if (list) val = list.title;
                        }

                        // Default fallback
                        const displayVal = val !== undefined ? val : (part.value || '...');

                        // Highlight dynamic parts slightly
                        return <Text key={index} strong style={{ color: token.colorText }}>{displayVal}</Text>;
                    }
                    return null;
                })}
            </Space>
        );
    };

    const renderActionRow = (part: TriggerPart, templateId: string) => {
        const config = actionConfig[templateId] || {};
        const errors = actionValidationErrors[templateId] || [];
        const hasError = part.key ? errors.includes(part.key) : false;
        const update = (k: string, v: any) => handleUpdateAction(templateId, k, v);

        switch (part.type) {
            case 'static': return <Text>{part.value}</Text>;
            case 'verb_select':
                return (
                    <Select
                        value={config[part.key!] || part.value}
                        style={{ width: 'auto', minWidth: 100 }}
                        bordered={false}
                        className="trigger-select"
                        onChange={v => update(part.key!, v)}
                        status={hasError ? 'error' : ''}
                    >
                        {part.options?.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
                    </Select>
                );
            case 'board_select':
                return (
                    <Select
                        showSearch
                        filterOption={(input, option) =>
                            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                        placeholder={board?.title || "Current Board"}
                        value={config[part.key!]} // undefined/null means current board
                        style={{ width: 160 }}
                        onChange={v => update(part.key!, v)}
                        allowClear
                        status={hasError ? 'error' : ''}
                    >
                        {/* Option for Current Board explicitly? Or just clear to default? Let's add explicit option if helpful, but placeholder works */}
                        {allBoards?.map((b: any) => <Select.Option key={b.id} value={b.id}>{b.title}</Select.Option>)}
                    </Select>
                );
            case 'list_select':
                // Determine which lists to show
                const targetBoardId = config['board_id'];
                const targetLists = targetBoardId && targetBoardId !== boardId
                    ? (remoteLists[targetBoardId] || [])
                    : lists;

                return (
                    <Select
                        showSearch
                        filterOption={(input, option) =>
                            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                        placeholder={targetLists.length === 0 && targetBoardId ? "Loading..." : "List name"}
                        value={config[part.key!]}
                        style={{ width: 150 }}
                        onChange={v => update(part.key!, v)}
                        status={hasError ? 'error' : ''}
                    >
                        {targetLists.map((l: any) => <Select.Option key={l.id} value={l.id}>{l.title}</Select.Option>)}
                    </Select>
                );
            // Add other action types as needed (members, fields, etc.)
            default: return null;
        }
    };

    const renderTriggerPart = (part: TriggerPart, triggerId: string) => {
        const config = triggerConfig[triggerId] || {};
        const errors = validationErrors[triggerId] || [];
        const hasError = part.key ? errors.includes(part.key) : false;

        switch (part.type) {
            case 'custom_field_multi_select':
                const selectedIds = config[part.key!] || [];
                const handleAddField = (id: string) => {
                    const newIds = [...selectedIds, id];
                    handleUpdateTrigger(triggerId, part.key!, newIds);
                };
                const handleRemoveField = (id: string) => {
                    handleUpdateTrigger(triggerId, part.key!, selectedIds.filter((sid: string) => sid !== id));
                };

                const availableFields = customFields.filter(f => !selectedIds.includes(f.id));

                return (
                    <Space>
                        {selectedIds.map((id: string) => {
                            const field = customFields.find(f => f.id === id);
                            return (
                                <Tag key={id} closable onClose={() => handleRemoveField(id)}>
                                    {field?.name || id}
                                </Tag>
                            );
                        })}
                        <Popover
                            trigger="click"
                            content={
                                <List
                                    size="small"
                                    dataSource={availableFields}
                                    renderItem={(f: any) => (
                                        <List.Item
                                            onClick={() => handleAddField(f.id)}
                                            style={{ cursor: 'pointer', padding: '4px 8px' }}
                                        >
                                            {f.name}
                                        </List.Item>
                                    )}
                                    style={{ width: 200, maxHeight: 300, overflow: 'auto' }}
                                />
                            }
                        >
                            <Button size="small" icon={<PlusOutlined />} danger={hasError} />
                        </Popover>
                    </Space>
                );

            case 'number_comparison':
                const compConfig = config[part.key!] || { condition: 'greater than', value: '0' };
                const updateComp = (key: string, val: any) => {
                    const newConfig = { ...compConfig, [key]: val };
                    if (key === 'hasSecondary' && !val) {
                        delete newConfig.secondaryCondition;
                        delete newConfig.secondaryValue;
                    }
                    handleUpdateTrigger(triggerId, part.key!, newConfig);
                };

                return (
                    <Space>
                        <Select
                            value={compConfig.condition}
                            style={{ width: 140 }}
                            onChange={(val) => updateComp('condition', val)}
                        >
                            {['greater than', 'greater or equal to', 'less than', 'less or equal to', 'equal to'].map(opt => (
                                <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                            ))}
                        </Select>
                        <Input
                            value={compConfig.value}
                            style={{ width: 60 }}
                            onChange={(e) => updateComp('value', e.target.value)}
                        />
                        {compConfig.hasSecondary ? (
                            <>
                                <Text>and</Text>
                                <Select
                                    value={compConfig.secondaryCondition || 'less than'}
                                    style={{ width: 140 }}
                                    onChange={(val) => updateComp('secondaryCondition', val)}
                                >
                                    {['greater than', 'greater or equal to', 'less than', 'less or equal to', 'equal to'].map(opt => (
                                        <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                                    ))}
                                </Select>
                                <Input
                                    value={compConfig.secondaryValue || '0'}
                                    style={{ width: 60 }}
                                    onChange={(e) => updateComp('secondaryValue', e.target.value)}
                                />
                                <Button
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={() => updateComp('hasSecondary', false)}
                                />
                            </>
                        ) : (
                            <Button
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() => updateComp('hasSecondary', true)}
                            />
                        )}
                    </Space>
                );

            case 'custom_field_select':
                const filteredFields = customFields.filter(f => !part.filterType || f.type === part.filterType || (part.filterType === 'text' && f.type === 'number'));
                return (
                    <Select
                        placeholder="Field"
                        value={config[part.key!]}
                        style={{ width: 150 }}
                        onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        dropdownMatchSelectWidth={false}
                        status={hasError ? 'error' : ''}
                    >
                        {filteredFields.map((f: any) => (
                            <Select.Option key={f.id} value={f.id}>
                                {f.name}
                            </Select.Option>
                        ))}
                    </Select>
                );

            case 'static':
                return (
                    <Text>
                        {part.value}
                        {part.tooltip && (
                            <Tooltip title={part.tooltip}>
                                <InfoCircleOutlined style={{ color: token.colorTextQuaternary, fontSize: 12, marginLeft: 6 }} />
                            </Tooltip>
                        )}
                    </Text>
                );

            case 'filter':
                return (
                    <Space size={2}>
                        {config.filters?.map((f: any, i: number) => (
                            <Tag
                                key={i}
                                closable
                                onClose={() => {
                                    const newFilters = [...config.filters];
                                    newFilters.splice(i, 1);
                                    handleUpdateTrigger(triggerId, 'filters', newFilters);
                                }}
                            >
                                {f.text}
                            </Tag>
                        ))}
                        {isAdvanced && (
                            <TriggerFilterModal
                                value={config.filters}
                                onChange={(val) => handleUpdateTrigger(triggerId, 'filters', val)}
                                lists={lists}
                                labels={labels}
                                members={members}
                                showInactive={activeCategory !== 'card_move'}
                            />
                        )}
                    </Space>
                );

            case 'user':
                return (
                    <Space size={2}>
                        {config.user && (
                            <Tag
                                closable
                                onClose={() => handleUpdateTrigger(triggerId, 'user', null)}
                            >
                                {config.user.text}
                            </Tag>
                        )}
                        <TriggerUserModal
                            value={config.user}
                            onChange={(val) => handleUpdateTrigger(triggerId, 'user', val)}
                            members={members}
                            hasValue={!!config.user}
                        />
                    </Space>
                );

            case 'verb_select':
                return (
                    <Select
                        value={config[part.key!] || part.value}
                        style={{ width: 140 }}
                        bordered={false}
                        className="trigger-select"
                        onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        status={hasError ? 'error' : ''}
                    >
                        {part.options?.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                    </Select>
                );

            case 'list_select':
                return (
                    <Select
                        showSearch={{
                            filterOption: (input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                        }}
                        placeholder="List name"
                        value={config[part.key!]}
                        style={{ width: 150 }}
                        onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        status={hasError ? 'error' : ''}
                    >
                        {lists.map((l: any) => <Select.Option key={l.id} value={l.id}>{l.title}</Select.Option>)}
                    </Select>
                );

            case 'input_number':
                return <Input style={{ width: 60 }} defaultValue={part.value} status={hasError ? 'error' : ''} />;

            case 'input_text':
                if (part.icon === 'list') {
                    const hasValue = config[part.key!] !== undefined && config[part.key!] !== null;
                    if (!hasValue) {
                        return (
                            <Button
                                size="small"
                                icon={<UnorderedListOutlined />}
                                onClick={() => handleUpdateTrigger(triggerId, part.key!, '')}
                                danger={hasError}
                            />
                        );
                    }

                    return (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            backgroundColor: token.colorFillSecondary,
                            border: `1px solid ${token.colorBorder}`,
                            borderRadius: token.borderRadius,
                            padding: '2px 8px',
                            gap: 8
                        }}>
                            <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>in a checklist named</Text>
                            <Input
                                placeholder={part.placeholder}
                                value={config[part.key!]}
                                style={{ width: 140, border: 'none', padding: '0 4px', background: 'transparent' }}
                                onChange={(e) => handleUpdateTrigger(triggerId, part.key!, e.target.value)}
                                status={hasError ? 'error' : ''}
                            />
                            <Button
                                type="text"
                                size="small"
                                icon={<span style={{ fontSize: 10 }}>✕</span>}
                                onClick={() => handleUpdateTrigger(triggerId, part.key!, null)}
                                style={{ color: token.colorTextSecondary, minWidth: 20, height: 20, padding: 0 }}
                            />
                        </div>
                    );
                }

                return (
                    <Input
                        placeholder={part.placeholder}
                        value={config[part.key!]}
                        style={{ width: 140 }}
                        onChange={(e) => handleUpdateTrigger(triggerId, part.key!, e.target.value)}
                        status={hasError ? 'error' : ''}
                    />
                );

            case 'condition_group':
                return <Button size="small" icon={<PlusOutlined />} />;

            case 'label_select':
                return (
                    <Select
                        placeholder="Label"
                        value={config[part.key!]}
                        style={{ width: 150 }}
                        onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        dropdownMatchSelectWidth={false}
                        status={hasError ? 'error' : ''}
                    >
                        {labels.map((l: any) => (
                            <Select.Option key={l.id} value={l.id}>
                                <Space>
                                    <div style={{ width: 16, height: 16, backgroundColor: l.color, borderRadius: 2 }} />
                                    {l.name}
                                </Space>
                            </Select.Option>
                        ))}
                    </Select>
                );

            case 'member_select':
                return (
                    <Select
                        showSearch={{
                            filterOption: (input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                        }}
                        placeholder="@username"
                        value={config[part.key!]}
                        style={{ width: 150 }}
                        onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        status={hasError ? 'error' : ''}
                    >
                        {members.map((m: any) => <Select.Option key={m.id} value={m.id}>{m.username}</Select.Option>)}
                    </Select>
                );

            case 'text_match':
                const matchConfig = config[part.key!] || { condition: 'starting_with', text: '' };
                const hasValue = matchConfig.text && matchConfig.text.length > 0;

                const iconNode = part.icon === 'list' ? <span style={{ fontWeight: 'bold' }}>≣</span> : <span style={{ fontWeight: 600 }}>T</span>;

                return (
                    <Space size={2}>
                        {hasValue && (
                            <Tag
                                closable
                                onClose={() => handleUpdateTrigger(triggerId, part.key!, { ...matchConfig, text: '' })}
                            >
                                {matchConfig.condition.replace(/_/g, ' ')} "{matchConfig.text}"
                            </Tag>
                        )}
                        <TriggerTextMatchModal
                            value={matchConfig}
                            hasValue={hasValue}
                            onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                            customIcon={iconNode}
                        />
                    </Space>
                );

            case 'date_comparison':
                const dateConfig = config[part.key!] || null;
                const hasDateValue = !!dateConfig;

                return (
                    <Space size={2}>
                        {hasDateValue && (
                            <Tag
                                closable
                                onClose={() => handleUpdateTrigger(triggerId, part.key!, null)}
                            >
                                {dateConfig.text}
                            </Tag>
                        )}
                        <TriggerDateModal
                            value={dateConfig}
                            hasValue={hasDateValue}
                            onChange={(val) => handleUpdateTrigger(triggerId, part.key!, val)}
                        />
                    </Space>
                );
            default:
                return null;
        }
    };

    const renderActionSummary = (action: any) => {
        const template = ACTION_TEMPLATES.find(t => t.id === action.id);
        if (!template) return action.id;

        return (
            <Space wrap size={4}>
                {template.parts.map((part, index) => {
                    if (part.type === 'static') {
                        return <Text key={index} style={{ color: token.colorTextSecondary }}>{part.value}</Text>;
                    }

                    if (part.key) {
                        let val = action[part.key];

                        // Resolve values
                        if (part.type === 'list_select' && val) {
                            // Check current board lists
                            let list = lists.find((l: any) => l.id === val);

                            // If not found, check remote lists if board_id is present
                            if (!list && action.board_id) {
                                const remote = remoteLists[action.board_id];
                                if (remote) {
                                    list = remote.find((l: any) => l.id === val);
                                }
                            }

                            if (list) val = list.title;
                        }

                        if (part.type === 'board_select') {
                            if (val) {
                                const board = allBoards?.find((b: any) => b.id === val);
                                if (board) val = board.title;
                            } else if (board) {
                                val = board.title;
                            }
                        }

                        if (part.type === 'verb_select' && val) {
                            // Just use the value
                        }

                        const displayVal = val !== undefined ? val : (part.value || '...');
                        return <Text key={index} strong style={{ color: token.colorText }}>{displayVal}</Text>;
                    }
                    return null;
                })}
            </Space>
        );
    };



    // Update name when entering Step 3
    const handleNext = () => {
        if (currentStep === 1) {
            // Moving to Review
            if (!isNameEdited) {
                const triggerDesc = getTriggerDescription();
                // Join all actions with ' & '
                const actionDesc = actions.map(a => getActionDescription(a)).join(' & ');
                setRuleName(`${triggerDesc} → ${actionDesc}`);
            }
        }
        setCurrentStep(currentStep + 1);
    };

    const handleFinish = async () => {
        // Construct payload
        if (!selectedTriggerId) return;
        const triggerPayload = {
            id: selectedTriggerId,
            ...triggerConfig[selectedTriggerId]
        };

        // Flatten board_id from actions if needed (handled in getActionDescription but payload needs to be clean)
        // Ensure actions are an object array

        // Final name logic check
        let finalName = ruleName;
        if (!isNameEdited && ruleToEdit) {
            // Keep existing name if not edited, logic below handles auto-gen for new rules mostly
            // But if we want to regen based on edited trigger/actions?
            // Let's rely on handleNext updating it
        }

        const payload = {
            name: finalName,
            board_id: boardId,
            trigger_type: 'event', // hardcoded for now
            trigger_config: triggerPayload,
            actions: actions,
            is_enabled: true
        };

        try {
            if (ruleToEdit) {
                await updateRule.mutateAsync({ id: ruleToEdit.id, data: payload });
            } else {
                await createRule.mutateAsync(payload);
            }
            onSuccess();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ paddingTop: 10 }}>
            <Steps
                current={currentStep}
                items={[
                    { title: 'Trigger', icon: <ThunderboltOutlined /> },
                    { title: 'Actions', icon: <PlayCircleOutlined /> },
                    { title: 'Review', icon: <SaveOutlined /> },
                ]}
                onChange={(step) => {
                    // Allow navigating back
                    if (step < currentStep) {
                        setCurrentStep(step);
                    }
                    // Allow navigating forward only if valid?
                    // For now, let's just allow clicking existing headers if we are at step 2
                    if (currentStep === 2) {
                        setCurrentStep(step);
                    }
                    // If at step 0, can't jump to 2 directly usually unless validated.
                    // But simpler: just allow setStep if we have data.
                    if (step === 1 && selectedTriggerId) setCurrentStep(1);
                    if (step === 2 && selectedTriggerId && actions.length > 0) setCurrentStep(2);
                }}
                style={{ marginBottom: 24, cursor: 'pointer' }}
            />

            <Form form={form} layout="vertical" onFinish={handleFinish}>

                {/* STEP 1: TRIGGER */}
                <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>

                    {/* Categories */}
                    <Space style={{ marginBottom: 16 }}>
                        {TRIGGER_CATEGORIES.map(cat => (
                            <Button
                                key={cat.id}
                                type={activeCategory === cat.id ? 'primary' : 'default'}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </Space>

                    <Space style={{ float: 'right' }}>
                        <Switch
                            checkedChildren="Advanced"
                            unCheckedChildren="Basic"
                            checked={isAdvanced}
                            onChange={setIsAdvanced}
                        />
                    </Space>

                    {/* Trigger List */}
                    <List
                        dataSource={TRIGGER_TEMPLATES.filter(t => t.category === activeCategory)}
                        renderItem={item => (
                            <List.Item>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <Space wrap style={{ flex: 1, marginRight: 16 }}>
                                        {item.parts.map((part, index) => {
                                            const currentConfig = triggerConfig[item.id] || {};

                                            // Special Condition: Hide 'comparison' if verb is 'removed from' for date_changed
                                            if (item.id === 'date_changed' && part.key === 'comparison') {
                                                const currentVerb = currentConfig['verb'] || 'set on';
                                                if (currentVerb === 'removed from') return null;
                                            }

                                            // Special Condition: Hide 'checklist_name' if scope is 'a checklist' or 'all checklists'
                                            if ((item.id === 'checklist_completed' || item.id === 'checklist_item_added') && part.key === 'checklist_name') {
                                                const currentScope = currentConfig['scope'] || 'checklist';
                                                if (currentScope !== 'checklist') return null;
                                            }

                                            // Special Condition: Hide 'item_name' if scope is 'an' for checklist_item_state_changed
                                            if (item.id === 'checklist_item_state_changed' && part.key === 'item_name') {
                                                const currentScope = currentConfig['scope'] || 'the';
                                                if (currentScope === 'an') return null;
                                            }

                                            return (
                                                <div key={index}>
                                                    {renderTriggerPart(part, item.id)}
                                                </div>
                                            );
                                        })}
                                    </Space>
                                    <Button
                                        type="primary"
                                        shape="circle"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            // Handle add rule
                                            const errors = validateTrigger(item.id, item, triggerConfig[item.id] || {});
                                            if (errors.length > 0) {
                                                setValidationErrors(prev => ({ ...prev, [item.id]: errors }));
                                            } else {
                                                // Proceed
                                                setSelectedTriggerId(item.id);
                                                setCurrentStep(1);
                                            }
                                        }}
                                    />
                                </div>
                            </List.Item>
                        )}
                        style={{ background: token.colorFillAlter, borderRadius: token.borderRadius, padding: 8 }}
                        className="trigger-list"
                    />
                </div>

                {/* STEP 2: ACTIONS */}
                <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                    {/* Selected Trigger Display (Read-only) */}
                    <Card style={{ marginBottom: 24, background: token.colorFillSecondary, borderColor: token.colorBorder }} bodyStyle={{ padding: 12 }}>
                        <Space style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Space>
                                <Text strong style={{ color: token.colorText }}>Trigger:</Text>
                                <Text style={{ color: token.colorTextSecondary }}>
                                    {renderTriggerSummary()}
                                </Text>
                            </Space>
                            <Button type="text" icon={<DeleteOutlined />} onClick={() => setCurrentStep(0)} />
                        </Space>
                    </Card>

                    <Title level={5}>Select Action</Title>

                    <Space style={{ marginBottom: 16 }} wrap>
                        {ACTION_CATEGORIES?.map(cat => (
                            <Button
                                key={cat.id}
                                type={activeActionCategory === cat.id ? 'primary' : 'default'}
                                onClick={() => setActiveActionCategory(cat.id)}
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </Space>

                    <List
                        dataSource={ACTION_TEMPLATES?.filter(t => t.category === activeActionCategory)}
                        renderItem={item => (
                            <List.Item>
                                <Space wrap style={{ flex: 1, marginRight: 16 }}>
                                    {item.parts.map((part, idx) => (
                                        <div key={idx}>{renderActionRow(part, item.id)}</div>
                                    ))}
                                </Space>
                                <Button
                                    type="primary"
                                    shape="circle"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                        const errors = validateAction(item.id, item, actionConfig[item.id] || {});
                                        if (errors.length > 0) {
                                            setActionValidationErrors(prev => ({ ...prev, [item.id]: errors }));
                                        } else {
                                            setActions(prev => [...prev, { id: item.id, ...actionConfig[item.id] }]);
                                            // Optional: Clear config for this item after adding? 
                                            // setActionConfig(prev => ({ ...prev, [item.id]: {} }));
                                        }
                                    }}
                                />
                            </List.Item>
                        )}
                        style={{ background: token.colorFillAlter, borderRadius: token.borderRadius, padding: 8 }}
                    />

                    {actions.length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <Title level={5}>Actions to perform</Title>
                            <List
                                dataSource={actions}
                                renderItem={(action, idx) => (
                                    <List.Item>
                                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                            <Space>
                                                <Text strong>Action {idx + 1}:</Text>
                                                {renderActionSummary(action)}
                                            </Space>
                                            <Button
                                                type="text"
                                                icon={<CloseOutlined />}
                                                onClick={() => setActions(prev => prev.filter((_, i) => i !== idx))}
                                            />
                                        </Space>
                                    </List.Item>
                                )}
                                style={{ background: token.colorFillAlter, borderRadius: token.borderRadius, padding: 8 }}
                            />
                        </div>
                    )}
                </div>

                {/* STEP 3: REVIEW */}
                <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>

                    <div style={{ marginBottom: 24 }}>
                        <Title level={5}>Rule Name</Title>
                        <Input
                            value={ruleName}
                            onChange={(e) => {
                                setRuleName(e.target.value);
                                setIsNameEdited(true);
                            }}
                            size="large"
                            placeholder="e.g., Move newly added cards to To Do"
                        />
                    </div>

                    <Card style={{ marginBottom: 24 }} bodyStyle={{ padding: 12 }}>
                        <Space style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Space>
                                <Text strong>Trigger:</Text>
                                <Text>
                                    {renderTriggerSummary()}
                                </Text>
                            </Space>
                            <Button type="link" size="small" onClick={() => setCurrentStep(0)}>Edit</Button>
                        </Space>
                    </Card>

                    <Title level={5}>Actions</Title>
                    <List
                        dataSource={actions}
                        renderItem={(action, idx) => (
                            <List.Item>
                                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                    <Space>
                                        <Text strong>Action {idx + 1}:</Text>
                                        {renderActionSummary(action)}
                                    </Space>
                                    <Space>
                                        <Button type="link" size="small" onClick={() => setCurrentStep(1)}>Edit</Button>
                                        <Button
                                            type="text"
                                            icon={<CloseOutlined />}
                                            onClick={() => setActions(prev => prev.filter((_, i) => i !== idx))}
                                        />
                                    </Space>
                                </Space>
                            </List.Item>
                        )}
                        style={{ borderRadius: 8, padding: 8, marginBottom: 24 }}
                    />

                    <Button
                        type="primary"
                        size="large"
                        icon={<SaveOutlined />}
                        block
                        onClick={() => form.submit()}
                        disabled={!selectedTriggerId || actions.length === 0}
                    >
                        {ruleToEdit ? 'Save Automation' : 'Create Automation'}
                    </Button>
                </div>

                <div style={{ marginTop: 24, textAlign: 'right', display: currentStep === 2 ? 'none' : 'block' }}>
                    {currentStep > 0 && <Button style={{ margin: '0 8px' }} onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>}
                    {currentStep > 0 && currentStep < 2 && actions.length > 0 && <Button type="primary" onClick={handleNext}>Next</Button>}
                </div>
            </Form>
        </div>
    );
}
