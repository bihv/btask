# Automation System

This directory contains the refactored automation system for Mello, inspired by Trello Butler's architecture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTOMATION ENGINE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐  │
│  │  TRIGGERS   │    │ CONDITIONS  │    │          ACTIONS            │  │
│  │  Registry   │───▶│   Engine    │───▶│         Registry            │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────────┘  │
│         │                  │                        │                   │
│         ▼                  ▼                        ▼                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      JOB QUEUE                                  │    │
│  │   Async execution with retry, rate limiting, worker pool        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Actions (`/actions`)

Actions are operations executed when automation rules trigger.

#### Key Types:
- `ActionExecutor` - Interface that all actions implement
- `ActionContext` - Context passed to action execution
- `ActionResult` - Result returned from execution
- `ActionSchema` - Schema for UI generation

#### Built-in Actions:
| Action ID | Description | Required Config |
|-----------|-------------|-----------------|
| `move_card` | Move card to another list | `list_id` |
| `add_label` | Add a label to the card | `label_id` |
| `remove_label` | Remove a label from the card | `label_id` |
| `add_member` | Assign a member to the card | `user_id` |
| `remove_member` | Unassign a member from the card | `user_id` |
| `archive_card` | Archive the card | - |
| `unarchive_card` | Unarchive the card | - |
| `set_due_date` | Set due date | `due_date` (ISO or relative like "+7d") |

#### Creating Custom Actions:

```go
type MyAction struct{}

func (a *MyAction) ID() string { return "my_action" }
func (a *MyAction) Name() string { return "My Custom Action" }
func (a *MyAction) Description() string { return "Does something cool" }
func (a *MyAction) Category() string { return actions.CategoryCard }
func (a *MyAction) Schema() actions.ActionSchema {
    return actions.ActionSchema{
        Properties: []actions.PropertySchema{
            {Name: "value", Type: "string", Required: true},
        },
    }
}
func (a *MyAction) Execute(ctx actions.ActionContext) actions.ActionResult {
    // Implementation
    return actions.ActionResult{Success: true}
}

// Register
actions.Registry().Register(&MyAction{})
```

### 2. Triggers (`/triggers`)

Triggers detect events that should activate automation rules.

#### Key Types:
- `TriggerMatcher` - Interface for matching events
- `TriggerContext` - Event context for matching
- `TriggerSchema` - Schema for UI generation

#### Built-in Triggers:
| Trigger ID | Description | Events |
|------------|-------------|--------|
| `card_created` | When a card is created | `card.created` |
| `card_added_to_list` | When a card is added to a specific list | `card.created`, `card.moved` |
| `card_moved` | When a card is moved between lists | `card.moved` |
| `card_archived` | When a card is archived/unarchived | `card.archived`, `card.unarchived` |
| `card_status_changed` | When a card is completed/incomplete | `card.completed`, `card.incomplete` |
| `label_changed` | When a label is added/removed | `card.label_added`, `card.label_removed` |
| `member_changed` | When a member is assigned/unassigned | `card.member_added`, `card.member_removed` |
| `member_me_changed` | When I am assigned/unassigned | `card.member_added`, `card.member_removed` |
| `date_changed` | When due date changes | `card.due_date_changed` |

### 3. Conditions (`/conditions`)

Conditions allow filtering when rules should execute.

#### Operators:
| Operator | Description | Accepts Value |
|----------|-------------|---------------|
| `equals` | Field equals value | Yes |
| `not_equals` | Field does not equal value | Yes |
| `contains` | String/array contains value | Yes |
| `not_contains` | Does not contain value | Yes |
| `starts_with` | String starts with value | Yes |
| `ends_with` | String ends with value | Yes |
| `matches` | Regex match | Yes |
| `gt`, `gte`, `lt`, `lte` | Numeric comparisons | Yes |
| `in`, `not_in` | Value in/not in list | Yes |
| `is_empty`, `not_empty` | Check for empty | No |
| `exists`, `not_exists` | Check field existence | No |
| `is_true`, `is_false` | Boolean checks | No |

#### Field Resolution:
Supports dot notation and array access:
- `card.name` - Card name
- `card.list.name` - List name of the card
- `card.labels[0].color` - First label's color

### 4. Queue (`/queue`)

Async job processing with reliability features.

#### Features:
- Worker pool with configurable concurrency
- Exponential backoff retry
- Rate limiting
- Job priority
- Stats tracking

#### Configuration:
```go
config := queue.QueueConfig{
    WorkerCount:    5,        // Concurrent workers
    QueueSize:      1000,     // Max queued jobs
    RetryBaseDelay: 1*time.Second,
    RetryMaxDelay:  5*time.Minute,
    JobTimeout:     30*time.Second,
    RateLimit:      100,      // Jobs per second (0 = unlimited)
}
```

## API Endpoints

### Schema API (for UI Builder)

```
GET /api/automation/schema
```
Returns complete automation schema including triggers, actions, and conditions.

```
GET /api/automation/triggers
```
Returns all available triggers with their schemas.

```
GET /api/automation/actions
```
Returns all available actions with their schemas.

```
GET /api/automation/conditions/operators
```
Returns all condition operators.

```
GET /api/automation/conditions/fields?context=card
```
Returns available fields for conditions (card, list, board, user).

```
POST /api/automation/validate
```
Validates a rule configuration before saving.

### Rule Management

```
POST /api/automation/rules
GET /api/boards/:boardId/automation/rules
PUT /api/automation/rules/:id
DELETE /api/automation/rules/:id
```

## Usage Example

### Creating an Automation Rule (API)

```json
POST /api/automation/rules
{
  "name": "Move completed cards to Done",
  "description": "When a card is marked complete, move it to Done list",
  "trigger_type": "event",
  "trigger_config": {
    "id": "card_status_changed",
    "verb": "completed",
    "conditions": [
      {
        "field": "card.list.name",
        "operator": "not_equals",
        "value": "Done"
      }
    ]
  },
  "actions": [
    {
      "id": "move_card",
      "list_id": "done-list-uuid"
    }
  ],
  "board_id": "board-uuid"
}
```

### Processing Events (Internal)

```go
// In CardHandler after card update:
automationService.ProcessEvent("card.completed", boardID, map[string]interface{}{
    "card_id":   card.ID.String(),
    "board_id":  card.BoardID.String(),
    "list_id":   card.ListID.String(),
    "user_id":   userID.String(),
})
```

## Testing

```bash
go test ./internal/automation/... -v
```

## Future Improvements

1. **Plugin Actions** - Allow plugins to register custom actions
2. **Scheduled Triggers** - Cron-based automation (like Trello Butler calendar)
3. **Action Chaining** - Actions that depend on previous action results
4. **Rate Limiting per Board** - Board-level quotas
5. **Audit Logging** - Detailed automation execution logs
6. **UI Templates** - Pre-built automation templates
