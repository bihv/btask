# @mello/plugin-sdk

Official TypeScript SDK for building Mello plugins.

## Installation

```bash
npm install @mello/plugin-sdk
```

## Quick Start

```typescript
import { MelloPlugin } from '@mello/plugin-sdk';

const plugin = new MelloPlugin();

// Initialize with token
await plugin.initialize(YOUR_PLUGIN_TOKEN);

// Register card badge
plugin.registerCardBadge({
  id: 'my-badge',
  getBadge: async (card, context) => {
    const count = await plugin.getData('card', card.id, 'count');
    return {
      icon: 'eye',
      text: count?.value || '0',
      tooltip: 'View count',
    };
  },
});
```

## React Hooks

```typescript
import { PluginProvider, usePlugin, usePluginData } from '@mello/plugin-sdk/react';

function App() {
  return (
    <PluginProvider plugin={plugin}>
      <MyComponent />
    </PluginProvider>
  );
}

function MyComponent() {
  const plugin = usePlugin();
  const [count, setCount, loading] = usePluginData('card', cardId, 'views');
  
  return <div>Views: {count}</div>;
}
```

## API

### Plugin Methods

- `initialize(token, apiUrl?)` - Initialize plugin
- `getData(scope, entityId, key)` - Get stored data
- `setData(scope, entityId, key, value)` - Store data
- `deleteData(scope, entityId, key)` - Delete data
- `api.getCard(cardId)` - Get card from Mello
- `api.updateCard(cardId, data)` - Update card
- `showSnackbar(message, type)` - Show notification
- `showModal(options)` - Show modal dialog

### Hook Registration

- `registerCardBadge(badge)` - Add badge to card front
- `registerCardButton(button)` - Add button to card detail
- `registerCardBackSection(section)` - Add section to card detail
- `registerBoardButton(button)` - Add button to board header

### React Hooks

- `usePlugin()` - Access plugin instance
- `usePluginData(scope, entityId, key)` - Reactive data storage
- `useCard(cardId)` - Load card data
- `useSnackbar()` - Show notifications
- `useModal()` - Show modals
- `usePermission(permission)` - Check permissions

## Documentation

Full documentation: https://docs.mello.app/plugins

## License

MIT
