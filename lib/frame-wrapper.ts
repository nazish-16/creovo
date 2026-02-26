import { BASE_VARIABLES, OCEAN_BREEZE_THEME } from "./themes";

export function getHTMLWrapper(
  html: string,
  title = "Untitled",
  theme_style?: string,
  frameId?: string,
  isEditable = false
) {
  const finalTheme = theme_style || OCEAN_BREEZE_THEME;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style type="text/tailwindcss">
    :root {${BASE_VARIABLES}${finalTheme}}
    *, *::before, *::after {margin:0;padding:0;box-sizing:border-box;}
    html, body {width:100%; height:100%; overflow:hidden;}
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background:var(--background);
      color:var(--foreground);
      -webkit-font-smoothing:antialiased;
    }
    #root {width:100%; height:100%;}
    
    /* Plain White Scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.8);
      border-radius: 10px;
    }
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.8) transparent;
    }

    .font-heading { font-family: 'Space Grotesk', sans-serif !important; }
    .font-serif { font-family: 'Playfair Display', serif !important; }
    .font-mono { font-family: 'JetBrains Mono', monospace !important; }
    .font-sans { font-family: 'Inter', sans-serif !important; }

    ${isEditable
      ? `
      /* Force everything to be visible during editing to prevent clipping dragged elements */
      #root, #root > div, .relative, .absolute, .flex, .grid { 
        overflow: visible !important; 
      }
      
      .creovo-selected {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
        cursor: move !important;
        z-index: 50 !important;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.3) !important;
      }
      .creovo-hover {
        outline: 1px dashed #3b82f6 !important;
        outline-offset: 1px !important;
      }
      .creovo-dragging {
        opacity: 0.8 !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        filter: brightness(1.1);
      }
      #creovo-resize-handle {
        position: absolute;
        right: -6px;
        bottom: -6px;
        width: 12px;
        height: 12px;
        background: #3b82f6;
        border: 2px solid white;
        border-radius: 50%;
        cursor: nwse-resize;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        pointer-events: auto !important;
      }
    `
      : ""
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="relative h-full">
      ${html}
    </div>
  </div>
  <script>
    (()=> {
      const fid='${frameId}';
      
      const sendHeight = () => {
        const height = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight,
          document.body.clientHeight,
          document.documentElement.clientHeight
        );
        parent.postMessage({ type: 'FRAME_HEIGHT', frameId: fid, height }, '*');
      };

      window.addEventListener('load', sendHeight);
      const resizeObserver = new ResizeObserver(sendHeight);
      resizeObserver.observe(document.body);

      // Save handler
      window.addEventListener('message', (event) => {
        if (event.data.type === 'GET_HTML_CONTENT') {
          // Remove editor specific stuff before saving
          const root = document.getElementById('root').firstElementChild;
          const clone = root.cloneNode(true);
          
          const handle = clone.querySelector('#creovo-resize-handle');
          if (handle) handle.remove();

          const allEls = clone.querySelectorAll('*');
          allEls.forEach(el => {
            el.classList.remove('creovo-selected', 'creovo-hover', 'creovo-dragging');
            if (!el.classList.length) el.removeAttribute('class');
          });
          
          parent.postMessage({ 
            type: 'HTML_CONTENT_RESPONSE', 
            frameId: fid, 
            html: clone.innerHTML 
          }, '*');
        }
      });

      ${isEditable
      ? `
        let selectedEl = null;
        let isDragging = false;
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        let cumulativeDX = 0;
        let cumulativeDY = 0;

        const removeHandle = () => {
          const oldHandle = document.getElementById('creovo-resize-handle');
          if (oldHandle) oldHandle.remove();
        };

        const addHandle = (el) => {
          removeHandle();
          if (el.tagName.toLowerCase() === 'img') return; // Cannot append to img
          const handle = document.createElement('div');
          handle.id = 'creovo-resize-handle';
          el.appendChild(handle);
        };

        document.addEventListener('mouseover', (e) => {
          if (isDragging || isResizing) return;
          let target = e.target.closest('*');
          if (target && target.tagName.toLowerCase() === 'img' && target.parentElement?.classList.contains('creovo-img-container')) {
            target = target.parentElement;
          }
          if (target && target !== document.body && target !== document.documentElement && !target.id.includes('root') && target.id !== 'creovo-resize-handle') {
            target.classList.add('creovo-hover');
          }
        });

        document.addEventListener('mouseout', (e) => {
          let target = e.target.closest('*');
          if (target && target.tagName.toLowerCase() === 'img' && target.parentElement?.classList.contains('creovo-img-container')) {
            target = target.parentElement;
          }
          if (target) target.classList.remove('creovo-hover');
        });

        let hasMoved = false;

        document.addEventListener('mousedown', (e) => {
          if (e.target.id === 'creovo-resize-handle') {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = selectedEl.offsetWidth;
            startHeight = selectedEl.offsetHeight;
            e.stopPropagation();
            e.preventDefault();
            return;
          }

          let target = e.target.closest('*');
          
          // If we click an image inside our special container, select the container instead
          if (target && target.tagName.toLowerCase() === 'img' && target.parentElement?.classList.contains('creovo-img-container')) {
            target = target.parentElement;
          }
          
          // Don't select the iframe root or body
          if (!target || target === document.body || target === document.documentElement || target.id === 'root' || target.parentElement?.id === 'root') {
             if (selectedEl) {
                selectedEl.classList.remove('creovo-selected');
                removeHandle();
                selectedEl = null;
                parent.postMessage({ type: 'ELEMENT_DESELECTED', frameId: fid }, '*');
             }
             return;
          }
          
          if (selectedEl && selectedEl !== target) {
            selectedEl.classList.remove('creovo-selected');
            removeHandle();
          }
          
          selectedEl = target;
          selectedEl.classList.add('creovo-selected');
          addHandle(selectedEl);
          
          isDragging = true;
          hasMoved = false;
          startX = e.clientX;
          startY = e.clientY;
          
          const transform = selectedEl.style.transform || '';
          const match = transform.match(/translate\(([-+]?\d*\.?\d+)px,\s*([-+]?\d*\.?\d+)px\)/);
          if (match) {
            cumulativeDX = parseFloat(match[1]);
            cumulativeDY = parseFloat(match[2]);
          } else {
            cumulativeDX = 0;
            cumulativeDY = 0;
          }

          const style = window.getComputedStyle(selectedEl);
          const properties = {
            tagName: selectedEl.tagName,
            classes: Array.from(selectedEl.classList).filter(c => !c.startsWith('creovo-')),
            innerText: selectedEl.innerText,
            style: {
              padding: style.padding,
              margin: style.margin,
              fontSize: style.fontSize,
              backgroundColor: style.backgroundColor,
              color: style.color,
              fontFamily: style.fontFamily
            }
          };

          parent.postMessage({ type: 'ELEMENT_SELECTED', frameId: fid, properties }, '*');
        });

        document.addEventListener('mousemove', (e) => {
          if (isResizing && selectedEl) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            selectedEl.style.width = (startWidth + dx) + 'px';
            selectedEl.style.height = (startHeight + dy) + 'px';
            hasMoved = true;
            return;
          }

          if (isDragging && selectedEl) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) hasMoved = true;

            let nextDX = cumulativeDX + dx;
            let nextDY = cumulativeDY + dy;

            if (Math.abs(nextDX) > 1000) nextDX = 1000 * Math.sign(nextDX);
            if (Math.abs(nextDY) > 1000) nextDY = 1000 * Math.sign(nextDY);

            selectedEl.style.transform = \`translate(\${nextDX}px, \${nextDY}px)\`;
            selectedEl.classList.add('creovo-dragging');
          }
        });

        const notifyChange = () => {
          const root = document.getElementById('root').firstElementChild;
          const clone = root.cloneNode(true);
          
          const handle = clone.querySelector('#creovo-resize-handle');
          if (handle) handle.remove();

          const allEls = clone.querySelectorAll('*');
          allEls.forEach(el => {
            el.classList.remove('creovo-selected', 'creovo-hover', 'creovo-dragging');
            if (!el.classList.length) el.removeAttribute('class');
          });
          
          parent.postMessage({ 
            type: 'HTML_CONTENT_AUTO_SAVE', 
            frameId: fid, 
            html: clone.innerHTML 
          }, '*');
        };

        window.addEventListener('message', (event) => {
          if (event.data.type === 'UPDATE_ELEMENT' && selectedEl) {
            if (event.data.text !== undefined) {
              selectedEl.innerText = event.data.text;
            }
            if (event.data.classes !== undefined) {
              const currentCreovoClasses = Array.from(selectedEl.classList).filter(c => c.startsWith('creovo-'));
              selectedEl.className = [...event.data.classes, ...currentCreovoClasses].join(' ');
            }
            notifyChange();
          }

          if (event.data.type === 'DELETE_ELEMENT' && selectedEl) {
            selectedEl.remove();
            selectedEl = null;
            parent.postMessage({ type: 'ELEMENT_DESELECTED', frameId: fid }, '*');
            notifyChange();
          }

          if (event.data.type === 'INSERT_IMAGE') {
            const root = document.getElementById('root').firstElementChild;
            const container = document.createElement('div');
            container.className = 'creovo-img-container cursor-move';
            container.style.position = 'absolute';
            container.style.top = '100px';
            container.style.left = '100px';
            container.style.width = '200px';
            container.style.height = 'auto';
            container.style.zIndex = '100';
            
            const img = document.createElement('img');
            img.src = event.data.url;
            img.className = 'w-full h-auto object-contain rounded-lg shadow-xl';
            img.style.pointerEvents = 'none';
            
            container.appendChild(img);
            root.appendChild(container);
            notifyChange();
          }
        });

        document.addEventListener('mouseup', (e) => {
          if (isResizing) {
            isResizing = false;
            if (hasMoved) notifyChange();
            return;
          }
          if (!isDragging) return;
          isDragging = false;
          if (selectedEl) {
             selectedEl.classList.remove('creovo-dragging');
             const transform = selectedEl.style.transform;
             const match = transform.match(/translate\(([-+]?\d*\.?\d+)px,\s*([-+]?\d*\.?\d+)px\)/);
             if (match) {
               cumulativeDX = parseFloat(match[1]);
               cumulativeDY = parseFloat(match[2]);
             }
             if (hasMoved) notifyChange();
          }
        });
      `
      : ""
    }
    })();
  </script>
</body>
</html>`;
}
