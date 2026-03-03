/**
 * Card View Counter Plugin
 * Tracks and displays card view counts
 * 
 * Uses iframe-based rendering - renders UI directly in the iframe
 */

// Helper to communicate with Mello Host
import '@mantine/core/styles.css';
import { melloApi, STORAGE_KEY } from './api';
import { ViewStats } from './components/ViewStats';
import { CardBadge } from './components/CardBadge';

import manifest from '../manifest.json';

import { createRoot } from 'react-dom/client';

// ============================================
// Render Functions
// ============================================

// Render function for 'card-badge' capability
async function renderCardBadge(root: HTMLElement, context: any) {
  const { card, theme } = context;
  if (!card?.id) return;

  // Check settings
  const settings = context.settings || {};
  console.log('[ViewCounter] Render settings:', settings);

  if (settings.showBadgeOnCard === false) {
    console.log('[ViewCounter] Badge disabled by settings');
    // Resize to 0 to hide placeholder
    setTimeout(() => (window as any).notifyResize && (window as any).notifyResize({ height: 0 }), 0);
    return;
  }

  const reactRoot = createRoot(root);
  reactRoot.render(<CardBadge card={card} initialTheme={theme} />);

  // IMPORTANT: Notify Host that we are ready to be resized/shown
  setTimeout(() => (window as any).notifyResize && (window as any).notifyResize(), 100);
}

async function renderCardBackSection(root: HTMLElement, context: any) {
  const { card, theme } = context;
  if (!card?.id) return;

  const reactRoot = createRoot(root);
  reactRoot.render(<ViewStats card={card} initialTheme={theme} />);

  // Notify ready to resize
  setTimeout(() => (window as any).notifyResize && (window as any).notifyResize(), 1000);
}

// ============================================
// Background Event Handlers (for hidden iframe)
// ============================================

// ============================================
// Background Logic
// This runs even if the plugin has no UI (headless mode) or in the background
// ============================================

// Listen for card open events (only in background mode)
if (!(window as any).isRenderMode) {
  window.addEventListener('message', async (event) => {
    // Check for 'card:opened' event from Host
    if (event.data?.type === 'card:opened') {
      const { cardId } = event.data.data || {};

      if (!cardId) {
        console.error('[ViewCounter] card:opened received but no cardId in data:', event.data);
        return;
      }

      console.log('[ViewCounter] Card opened, cardId:', cardId);

      try {
        // 1. Get current count
        const data: any = await melloApi.get('card', cardId, STORAGE_KEY);
        const currentCount = data?.count || 0;
        const newCount = currentCount + 1;

        // 2. Update count in storage
        await melloApi.set('card', cardId, STORAGE_KEY, { count: newCount });
        console.log('[ViewCounter] Updated count to:', newCount);

        // 3. Broadcast update event so UI components (Badges) can refresh
        window.parent.postMessage({
          type: 'mello:data:updated',
          scope: 'card',
          entityId: cardId,
          key: STORAGE_KEY
        }, '*');
      } catch (err) {
        console.error('[ViewCounter] Failed to update count:', err);
      }
    }
  });
}

// ============================================
// Plugin Export
// ============================================

(window as any).MelloPlugin = {
  manifest,

  // Render functions for each slot type
  render: {
    'card-badge': renderCardBadge,
    'card-back-section': renderCardBackSection,
  },
};

console.log('[Card View Counter] Plugin loaded v2.1.0 (iframe rendering + full stats)');
