/**
 * Vote Plugin Entry Point
 */

// import React from 'react'; // Not needed with react-jsx
import '@mantine/core/styles.css';
import { createRoot } from 'react-dom/client';
import { VoteButton } from './components/VoteButton';
import manifest from '../manifest.json';

// Render function for 'card-button' capability
function renderCardButton(root: HTMLElement, context: any) {
  const { card, theme } = context;
  if (!card?.id) return;

  const reactRoot = createRoot(root);
  reactRoot.render(<VoteButton card={card} initialTheme={theme} />);

  // Notify Host ready
  setTimeout(() => (window as any).notifyResize && (window as any).notifyResize(), 100);
}

// Register Plugin
(window as any).MelloPlugin = {
  manifest,
  render: {
    'card-button': renderCardButton,
  },
};

console.log('[Vote Plugin] Loaded');
