/**
 * HTML template generation for preview iframe
 */

export interface PreviewHTMLOptions {
  entryPoint: string;
  importMap: string;
  styles?: string;
  errors?: Array<{ path: string; error: string }>;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function generateErrorDisplay(errors: Array<{ path: string; error: string }>): string {
  if (errors.length === 0) return "";

  const errorItems = errors.map(e => {
    const locationMatch = e.error.match(/\((\d+:\d+)\)/);
    const location = locationMatch ? locationMatch[1] : "";
    const cleanError = e.error.replace(/\(\d+:\d+\)/, "").trim();
    
    return `
      <div class="error-item">
        <div class="error-path">
          ${escapeHtml(e.path)}
          ${location ? `<span class="error-location">${escapeHtml(location)}</span>` : ""}
        </div>
        <div class="error-message">${escapeHtml(cleanError)}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="syntax-errors">
      <h3>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0;">
          <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15h-2v-2h2v2zm0-4h-2V5h2v6z" fill="#dc2626"/>
        </svg>
        Syntax Error${errors.length > 1 ? 's' : ''} (${errors.length})
      </h3>
      ${errorItems}
    </div>
  `;
}

function generateAppScript(entryPointUrl: string, entryPoint: string, importMap: string): string {
  return `
    <script type="module">
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      
      class ErrorBoundary extends React.Component {
        constructor(props) {
          super(props);
          this.state = { hasError: false, error: null };
        }

        static getDerivedStateFromError(error) {
          return { hasError: true, error };
        }

        componentDidCatch(error, errorInfo) {
          console.error('Error caught by boundary:', error, errorInfo);
        }

        render() {
          if (this.state.hasError) {
            return React.createElement('div', { className: 'error-boundary' },
              React.createElement('h2', null, 'Something went wrong'),
              React.createElement('pre', null, this.state.error?.toString())
            );
          }

          return this.props.children;
        }
      }

      async function loadApp() {
        try {
          if (!('${entryPointUrl}'.startsWith('blob:') || '${entryPointUrl}'.startsWith('https://esm.sh/'))) {
            throw new Error('Invalid entry point URL: Only blob URLs and esm.sh URLs are allowed');
          }
          
          const module = await import('${entryPointUrl}');
          const App = module.default || module.App;
          
          if (!App) {
            throw new Error('No default export or App export found in ${entryPoint}');
          }

          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(
            React.createElement(ErrorBoundary, null,
              React.createElement(App)
            )
          );
        } catch (error) {
          console.error('Failed to load app:', error);
          console.error('Import map:', ${JSON.stringify(importMap)});
          
          const rootElement = document.getElementById('root');
          if (rootElement) {
            rootElement.textContent = '';
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-boundary';
            
            const heading = document.createElement('h2');
            heading.textContent = 'Failed to load app';
            
            const pre = document.createElement('pre');
            pre.textContent = error.toString();
            
            errorDiv.appendChild(heading);
            errorDiv.appendChild(pre);
            rootElement.appendChild(errorDiv);
          }
        }
      }

      loadApp();
    </script>
  `;
}

const BASE_STYLES = `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  #root {
    width: 100vw;
    height: 100vh;
  }
  .error-boundary {
    color: red;
    padding: 1rem;
    border: 2px solid red;
    margin: 1rem;
    border-radius: 4px;
    background: #fee;
  }
  .syntax-errors {
    background: #fef5f5;
    border: 2px solid #ff6b6b;
    border-radius: 12px;
    padding: 32px;
    margin: 24px;
    font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .syntax-errors h3 {
    color: #dc2626;
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .syntax-errors .error-item {
    margin: 16px 0;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    border-left: 4px solid #ff6b6b;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  .syntax-errors .error-path {
    font-weight: 600;
    color: #991b1b;
    font-size: 15px;
    margin-bottom: 8px;
  }
  .syntax-errors .error-message {
    color: #7c2d12;
    margin-top: 8px;
    white-space: pre-wrap;
    line-height: 1.5;
    font-size: 13px;
  }
  .syntax-errors .error-location {
    display: inline-block;
    background: #fee0e0;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    margin-left: 8px;
    color: #991b1b;
  }
`;

export function createPreviewHTML(options: PreviewHTMLOptions): string {
  const { entryPoint, importMap, styles = "", errors = [] } = options;
  
  // Parse the import map to get the blob URL for the entry point
  let entryPointUrl = entryPoint;
  try {
    const importMapObj = JSON.parse(importMap);
    if (importMapObj.imports && importMapObj.imports[entryPoint]) {
      entryPointUrl = importMapObj.imports[entryPoint];
    }
  } catch (e) {
    console.error("Failed to parse import map:", e);
  }

  const hasErrors = errors.length > 0;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${BASE_STYLES}
  </style>
  ${styles ? `<style>\n${styles}</style>` : ''}
  <script type="importmap">
    ${importMap}
  </script>
</head>
<body>
  ${hasErrors ? generateErrorDisplay(errors) : ''}
  <div id="root"></div>
  ${!hasErrors ? generateAppScript(entryPointUrl, entryPoint, importMap) : ''}
</body>
</html>`;
}