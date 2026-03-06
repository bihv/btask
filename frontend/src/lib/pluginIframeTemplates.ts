/**
 * Plugin Iframe Templates
 * 
 * Separated template functions for better code organization.
 * Uses template literals (compatible with Turbopack, no raw imports needed).
 */

import type { PluginSlotType } from './pluginIframeManager';

// ============================================================================
// CSP Builders
// ============================================================================

export function buildBackgroundCSP(pluginOrigin: string, hostOrigin: string): string {
  return `
    default-src 'none';
    script-src 'unsafe-inline' 'unsafe-eval' ${pluginOrigin};
    style-src 'unsafe-inline';
    connect-src ${hostOrigin} ${pluginOrigin};
  `.replace(/\s+/g, ' ').trim();
}

export function buildRenderCSP(pluginOrigin: string, hostOrigin: string): string {
  return `
    default-src 'none';
    script-src 'unsafe-inline' 'unsafe-eval' ${pluginOrigin};
    style-src 'unsafe-inline';
    img-src * data: blob:;
    font-src * data:;
    connect-src ${hostOrigin} ${pluginOrigin};
  `.replace(/\s+/g, ' ').trim();
}

// ============================================================================
// Runtime Script Builders
// ============================================================================

export function buildBackgroundRuntimeScript(installationId: string): string {
  return `
    window.installationId = "${installationId}";
    window.isRenderMode = false;
    
    window.onload = function() {
      console.log("[Mello Runtime] Background iframe loaded for:", "${installationId}");
      if (window.MelloPlugin) {
        console.log("[Mello Runtime] Found plugin:", window.MelloPlugin.manifest?.name);
        try {
          window.parent.postMessage({
            type: 'mello:plugin:ready',
            installationId: "${installationId}"
          }, '*');
        } catch (e) {
          console.error("[Mello Runtime] Failed to send ready message:", e);
        }
      } else {
        console.error("[Mello Runtime] No MelloPlugin found on window");
      }
    };
  `;
}

export function buildRenderRuntimeScript(
  installationId: string,
  slotType: PluginSlotType,
  context: any
): string {
  const contextJson = JSON.stringify(context);

  return `
    window.installationId = "${installationId}";
    window.slotType = "${slotType}";
    window.renderContext = ${contextJson};
    window.isRenderMode = true;
    
    window.notifyResize = function() {
      var root = document.getElementById('plugin-root');
      if (root) {
        var height = root.offsetHeight || root.scrollHeight;
        var width = root.offsetWidth || root.scrollWidth;
        window.parent.postMessage({
          type: 'mello:render:resize',
          installationId: "${installationId}",
          slotType: "${slotType}",
          height: height,
          width: width
        }, '*');
      }
    };
    
    window.addEventListener('load', function() {
      var observer = new MutationObserver(function() {
        window.notifyResize();
      });
      
      var root = document.getElementById('plugin-root');
      if (root) {
        observer.observe(root, { childList: true, subtree: true, attributes: true });
      }
      
      setTimeout(window.notifyResize, 100);
    });
    
    window.onload = function() {
      console.log("[Mello Runtime] Render iframe loaded for:", "${slotType}");
      
      var checkPlugin = setInterval(function() {
        if (window.MelloPlugin) {
          clearInterval(checkPlugin);
          
          if (window.MelloPlugin.render && window.MelloPlugin.render["${slotType}"]) {
            try {
              var root = document.getElementById('plugin-root');
              window.MelloPlugin.render["${slotType}"](root, window.renderContext);
              setTimeout(window.notifyResize, 50);
            } catch (e) {
              console.error("[Mello Runtime] Render failed:", e);
            }
          } else {
            console.warn("[Mello Runtime] No render function for slot:", "${slotType}");
          }
        }
      }, 50);
      
      setTimeout(function() {
        clearInterval(checkPlugin);
      }, 5000);
    };
  `;
}

// ============================================================================
// HTML Builders
// ============================================================================

interface BackgroundHtmlParams {
  cspPolicy: string;
  pluginName: string;
  runtimeScript: string;
  pluginUrl: string;
}

export function buildBackgroundHtml(params: BackgroundHtmlParams): string {
  const { cspPolicy, pluginName, runtimeScript, pluginUrl } = params;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="${cspPolicy}">
    <title>Plugin: ${pluginName}</title>
  </head>
  <body>
    <script>${runtimeScript}<\/script>
    <script src="${pluginUrl}"><\/script>
  </body>
</html>`;
}

interface RenderHtmlParams {
  cspPolicy: string;
  runtimeScript: string;
  pluginUrl: string;
}

export function buildRenderHtml(params: RenderHtmlParams): string {
  const { cspPolicy, runtimeScript, pluginUrl } = params;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="${cspPolicy}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { 
        background: transparent; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16px;
      }
    </style>
  </head>
  <body>
    <div id="plugin-root"></div>
    <script>${runtimeScript}<\/script>
    <script src="${pluginUrl}"><\/script>
  </body>
</html>`;
}
