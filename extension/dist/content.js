console.log("Magic Button content script loaded");let e=null;document.addEventListener("mouseup",()=>{const t=window.getSelection(),n=t==null?void 0:t.toString().trim();n&&n.length>3?i():o()});function i(){o(),e=document.createElement("div"),e.id="magic-button-indicator",e.innerHTML="✨ Magic Button ready",e.style.cssText=`
    position: fixed;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
    cursor: pointer;
  `;const t=document.createElement("style");t.textContent=`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `,document.head.appendChild(t),e.addEventListener("click",()=>{var n;chrome.runtime.sendMessage({type:"OPEN_POPUP",selectedText:((n=window.getSelection())==null?void 0:n.toString())||""})}),document.body.appendChild(e),setTimeout(o,5e3)}function o(){e&&(e.remove(),e=null)}window.addEventListener("beforeunload",()=>{o()});
