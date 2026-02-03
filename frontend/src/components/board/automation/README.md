# Automation System - Frontend

This directory contains the frontend components for the automation system, integrated with the backend's Registry Pattern-based automation engine.

## Architecture Overview

The frontend automation system uses a **Hybrid Approach**:
- **Schema from Backend**: Triggers, actions, and their properties are fetched from the API
- **Sentence Templates**: Backend provides `sentence_template` strings with placeholders
- **Inline Widgets**: Frontend parses templates and renders inline form widgets

## Key Components

### RuleBuilder (`RuleBuilder.tsx`)

The main component for creating/editing automation rules. Features:
- 3-step wizard: Trigger → Actions → Review
- Dynamic trigger/action selection from API schema
- Uses `SentenceTemplateRenderer` for inline configuration
- Supports editing existing rules

### SentenceTemplateRenderer (`SentenceTemplateRenderer.tsx`)

Renders sentence templates with inline form widgets:
- Parses templates like `"when a card is {verb} to {list_id}"`
- Renders appropriate widget for each placeholder (select, list_picker, label_picker, etc.)
- `SentenceDisplay` variant for read-only display

### AutomationRules (`AutomationRules.tsx`)

Lists and manages automation rules for a board:
- Displays trigger and action descriptions using schema templates
- Toggle enable/disable rules
- View, edit, delete rules
- Shows conditions summary

### AutomationModal (`AutomationModal.tsx`)

Modal wrapper with tabs for:
- Rules (event-triggered)
- Due Date automations
- Scheduled automations

## Types

All automation types are defined in `/types/automation.ts`:
- `TriggerSchema`, `ActionSchema` - Schema definitions from API
- `PropertySchema` - Property definitions with widget types
- `AutomationRule` - Rule data model
- `UIWidgetType` - Supported widget types

## Hooks

Located in `/hooks/useAutomationSchema.ts`:
- `useAvailableTriggers()` - Fetch triggers with transform
- `useAvailableActions()` - Fetch actions with transform
- `useTriggersByCategory()` - Group triggers by category
- `useActionsByCategory()` - Group actions by category
- `useBoardRules(boardId)` - Fetch rules for a board
- `useCreateRule()`, `useUpdateRule()`, `useDeleteRule()` - CRUD mutations
- `buildDescription()` - Build display text from template

## API Endpoints

```
GET  /api/automation/triggers    - List available triggers
GET  /api/automation/actions     - List available actions
GET  /api/automation/schema      - Full schema (triggers, actions, operators, fields)

GET  /api/boards/:id/automation/rules  - List rules for board
POST /api/automation/rules             - Create rule
PUT  /api/automation/rules/:id         - Update rule
DELETE /api/automation/rules/:id       - Delete rule
```

## Real-time Updates

When automation actions execute, the backend broadcasts an `invalidate` message via WebSocket.
Frontend listens in `useWebSocket.ts` and automatically invalidates board/card queries.

## i18n Support

The sentence templates are designed for future internationalization:
- Templates come from backend, can be translated server-side
- Frontend renders templates with placeholders, no hardcoded text
