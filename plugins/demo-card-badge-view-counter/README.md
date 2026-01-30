# Card View Counter Plugin

Example Mello plugin that tracks how many times each card has been viewed.

## Features

- 📊 **View Count Badge** - Shows total views on card front
- 📈 **Statistics in Card Back** - Example of rendering custom UI in card details
- ⚙️ **Configurable** - Toggle "Show view count badge on card front" in settings

## Installation & Development

Since this plugin runs in a sandboxed environment within Mello, you don't need to run a local server to use it. Instead, you build a bundle and upload it.

### 1. Setup

Install dependencies:
```bash
npm install
```

### 2. Build & Bundle

Run the bundle command to generate the plugin package:
```bash
npm run bundle
```
This will create a `plugin-bundle.zip` file in the project root containing:
- `manifest.json`
- `client.js` (Compiled plugin code)

### 3. Upload to Mello

1. Go to **My Plugins** page in Mello
2. Click **Submit Plugin** (or **Update** if already exists)
3. Drag & drop the `plugin-bundle.zip` file
4. The system will automatically extract info from `manifest.json`
5. Click **Submit**

6. The plugin will be submitted for review (Status: `Review`).
7. Once approved and published by an administrator, you can install it on your boards from the Marketplace.

Note: You can update your plugin at any time by uploading a new bundle. Updates also require approval before being live for all users.

## Project Structure

```
src/
├── api.ts                 # API wrapper for Mello communication
├── index.tsx              # Main plugin entry point
└── components/
    ├── CardBadge.tsx      # Badge on card front
    └── ViewStats.tsx      # Statistics panel in card back
```

## Key Concepts

**Data Storage:**
- Stores view data per card using `plugin.setData()`
- Scoped to 'card' scope with card ID as entity

**Hook Registration:**
- `registerCardBadge` - Badge on card front
- `registerCardBackSection` - Statistics panel

**Settings:**
- `showBadgeOnCard` - Toggle front badge

## Permissions

This plugin requires:
- `read:cards` - To display card information
- `read:board` - To access board context

## License

MIT - Feel free to use as template for your own plugins!
