/**
 * Plugin Modal Handler
 * Handles modal display requests from plugins
 */

'use client';

import { useEffect, useState } from 'react';

interface ModalContent {
  title: string;
  url?: string;
  content?: any;
  width?: number;
  height?: number;
  onClose?: () => void;
}

export function PluginModalHandler() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);

  useEffect(() => {
    const handleShow = (event: Event) => {
      const customEvent = event as CustomEvent<ModalContent>;
      setModalContent(customEvent.detail);
      setIsOpen(true);
    };

    const handleClose = () => {
      setIsOpen(false);
      modalContent?.onClose?.();
      // Clear content after animation
      setTimeout(() => setModalContent(null), 300);
    };

    window.addEventListener('plugin:modal:show', handleShow);
    window.addEventListener('plugin:modal:close', handleClose);

    return () => {
      window.removeEventListener('plugin:modal:show', handleShow);
      window.removeEventListener('plugin:modal:close', handleClose);
    };
  }, [modalContent]);

  if (!isOpen || !modalContent) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          style={{
            width: modalContent.width ? `${modalContent.width}px` : undefined,
            maxHeight: modalContent.height ? `${modalContent.height}px` : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{modalContent.title}</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-auto" style={{ 
            maxHeight: modalContent.height ? `${modalContent.height - 100}px` : '70vh' 
          }}>
            {modalContent.url ? (
              <iframe
                src={modalContent.url}
                className="w-full h-full border-0"
                style={{
                  minHeight: modalContent.height ? `${modalContent.height - 100}px` : '400px',
                }}
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              modalContent.content
            )}
          </div>
        </div>
      </div>
    </>
  );
}
