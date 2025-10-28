console.log("🎯 Magic Button content script loaded - Enhanced UX");let a={isEnabled:!0,isVisible:!1,selectedText:""},n=null,e=null,m=!1;document.addEventListener("DOMContentLoaded",u);document.readyState==="loading"?document.addEventListener("DOMContentLoaded",u):u();function u(){k(),q(),L(),P()}function k(){if(m)return;const t=document.createElement("style");t.id="magic-button-styles",t.textContent=`
    @keyframes magicSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes magicSlideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes magicPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    @keyframes magicFadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,document.head.appendChild(t),m=!0}function q(){if(n)return;n=document.createElement("div"),n.id="magic-floating-btn",n.innerHTML=`
    <div class="magic-btn-icon">✨</div>
    <div class="magic-btn-status"></div>
  `,n.style.cssText=`
    position: fixed;
    top: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    cursor: pointer;
    z-index: 999999;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;const t=n.querySelector(".magic-btn-icon"),i=n.querySelector(".magic-btn-status");t.style.cssText=`
    font-size: 24px;
    transition: transform 0.3s ease;
  `,i.style.cssText=`
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #10b981;
    border: 2px solid white;
    transition: all 0.3s ease;
  `,n.addEventListener("click",z),n.addEventListener("mouseenter",()=>{a.isEnabled&&(n.style.transform="scale(1.1)",n.style.boxShadow="0 8px 30px rgba(102, 126, 234, 0.6)")}),n.addEventListener("mouseleave",()=>{n.style.transform="scale(1)",n.style.boxShadow="0 4px 20px rgba(102, 126, 234, 0.4)"}),f(),document.body.appendChild(n)}function w(){e||(e=document.createElement("div"),e.id="magic-panel",e.innerHTML=`
    <div class="magic-panel-header">
      <div class="magic-panel-title">
        <span class="magic-icon">✨</span>
        Magic Button
      </div>
      <div class="magic-panel-controls">
        <button id="magic-toggle-btn" class="magic-control-btn" title="Activer/Désactiver">
          <span id="magic-toggle-icon">⚡</span>
        </button>
        <button id="magic-minimize-btn" class="magic-control-btn" title="Réduire">×</button>
      </div>
    </div>
    
    <div class="magic-panel-content">
      <div class="magic-text-section">
        <div class="magic-selected-text" id="magic-selected-text">
          <span class="magic-placeholder">Sélectionnez du texte sur la page...</span>
        </div>
      </div>
      
      <div class="magic-actions">
        <button class="magic-action-btn" data-action="correct">
          <span class="magic-action-icon">✏️</span>
          Corriger
        </button>
        <button class="magic-action-btn" data-action="summarize">
          <span class="magic-action-icon">📝</span>
          Résumer
        </button>
        <button class="magic-action-btn" data-action="translate">
          <span class="magic-action-icon">🌍</span>
          Traduire
        </button>
        <button class="magic-action-btn" data-action="optimize">
          <span class="magic-action-icon">🎯</span>
          Optimiser
        </button>
      </div>
      
      <div class="magic-status" id="magic-status">
        <span class="magic-status-indicator"></span>
        <span id="magic-status-text">Prêt</span>
      </div>
    </div>
  `,e.style.cssText=`
    position: fixed;
    top: 90px;
    right: 20px;
    width: 320px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid rgba(0, 0, 0, 0.1);
    animation: magicFadeIn 0.3s ease-out;
    max-height: 500px;
    overflow: hidden;
  `,C(),B(),document.body.appendChild(e))}function C(){if(!e)return;const t=e.querySelector(".magic-panel-header"),i=e.querySelector(".magic-panel-title"),c=e.querySelector(".magic-panel-controls"),o=e.querySelector(".magic-panel-content"),s=e.querySelector(".magic-text-section"),v=e.querySelector(".magic-selected-text"),S=e.querySelector(".magic-actions"),E=e.querySelector(".magic-status");t.style.cssText=`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px 16px 0 0;
  `,i.style.cssText=`
    font-weight: 600;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  `,c.style.cssText=`
    display: flex;
    gap: 8px;
  `,e.querySelectorAll(".magic-control-btn").forEach(d=>{d.style.cssText=`
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.2s ease;
    `}),o.style.cssText=`
    padding: 20px;
  `,s.style.cssText=`
    margin-bottom: 16px;
  `,v.style.cssText=`
    background: #f8fafc;
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    min-height: 60px;
    font-size: 14px;
    line-height: 1.5;
    color: #64748b;
    transition: all 0.3s ease;
  `,S.style.cssText=`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
  `,e.querySelectorAll(".magic-action-btn").forEach(d=>{d.style.cssText=`
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      color: #475569;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `}),E.style.cssText=`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    font-size: 12px;
    color: #15803d;
  `;const T=e.querySelector(".magic-status-indicator");T.style.cssText=`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
  `}function B(){if(!e)return;const t=e.querySelector("#magic-minimize-btn");t==null||t.addEventListener("click",()=>{a.isVisible=!1,p(),l()});const i=e.querySelector("#magic-toggle-btn");i==null||i.addEventListener("click",()=>{a.isEnabled=!a.isEnabled,f(),h(),l()}),e.querySelectorAll(".magic-action-btn").forEach(s=>{s.addEventListener("click",M),s.addEventListener("mouseenter",()=>{a.isEnabled&&a.selectedText&&(s.style.background="#e2e8f0",s.style.transform="translateY(-1px)")}),s.addEventListener("mouseleave",()=>{s.style.background="#f1f5f9",s.style.transform="translateY(0)"})}),e.querySelectorAll(".magic-control-btn").forEach(s=>{s.addEventListener("mouseenter",()=>{s.style.background="rgba(255, 255, 255, 0.3)"}),s.addEventListener("mouseleave",()=>{s.style.background="rgba(255, 255, 255, 0.2)"})})}function L(){document.addEventListener("mouseup",y),document.addEventListener("keyup",y),document.addEventListener("keydown",t=>{t.key==="Escape"&&a.isVisible&&(a.isVisible=!1,p(),l())})}function y(){if(!a.isEnabled)return;const t=window.getSelection(),i=(t==null?void 0:t.toString().trim())||"";i&&i.length>3?(a.selectedText=i,g(),n&&(n.style.animation="magicPulse 0.6s ease-in-out",setTimeout(()=>{n&&(n.style.animation="")},600))):(a.selectedText="",g())}function z(){a.isEnabled&&(a.isVisible=!a.isVisible,a.isVisible?b():p(),l())}function b(){e||w(),e&&(e.style.display="block",e.style.animation="magicFadeIn 0.3s ease-out",g(),h())}function p(){e&&(e.style.animation="magicSlideOut 0.3s ease-in",setTimeout(()=>{e&&(e.style.display="none")},300))}function f(){if(!n)return;const t=n.querySelector(".magic-btn-icon"),i=n.querySelector(".magic-btn-status");a.isEnabled?(n.style.opacity="1",n.style.cursor="pointer",t.textContent="✨",i.style.background="#10b981",n.title="Magic Button (Activé) - Cliquez pour ouvrir"):(n.style.opacity="0.5",n.style.cursor="default",t.textContent="😴",i.style.background="#ef4444",n.title="Magic Button (Désactivé) - Cliquez pour ouvrir")}function g(){if(!e)return;const t=e.querySelector("#magic-selected-text");a.selectedText?(t.innerHTML=a.selectedText,t.style.background="#ecfdf5",t.style.borderColor="#10b981",t.style.color="#064e3b"):(t.innerHTML='<span class="magic-placeholder">Sélectionnez du texte sur la page...</span>',t.style.background="#f8fafc",t.style.borderColor="#e2e8f0",t.style.color="#64748b"),x()}function x(){if(!e)return;const t=e.querySelectorAll(".magic-action-btn"),i=a.selectedText.length>0,c=a.isEnabled;t.forEach(o=>{const s=o;i&&c?(s.style.opacity="1",s.style.cursor="pointer",s.style.pointerEvents="auto"):(s.style.opacity="0.5",s.style.cursor="not-allowed",s.style.pointerEvents="none")})}function h(){if(!e)return;const t=e.querySelector("#magic-toggle-btn"),i=e.querySelector("#magic-toggle-icon"),c=e.querySelector("#magic-status-text"),o=e.querySelector(".magic-status-indicator"),s=e.querySelector(".magic-status");a.isEnabled?(i.textContent="⚡",t.title="Désactiver Magic Button",c.textContent="Activé",o.style.background="#22c55e",s.style.background="#f0fdf4",s.style.borderColor="#bbf7d0",s.style.color="#15803d"):(i.textContent="💤",t.title="Activer Magic Button",c.textContent="Désactivé",o.style.background="#ef4444",s.style.background="#fef2f2",s.style.borderColor="#fecaca",s.style.color="#dc2626"),x()}function M(t){const c=t.currentTarget.getAttribute("data-action");!c||!a.selectedText||!a.isEnabled||(r("Traitement...","loading"),chrome.runtime.sendMessage({type:"PROCESS_TEXT",action:c,text:a.selectedText},o=>{o&&o.success?(r("Terminé","success"),navigator.clipboard.writeText(o.result).then(()=>{r("Copié dans le presse-papiers","success"),setTimeout(()=>r("Prêt","ready"),2e3)})):(r("Erreur","error"),setTimeout(()=>r("Prêt","ready"),3e3))}))}function r(t,i){if(!e)return;const c=e.querySelector("#magic-status-text"),o=e.querySelector(".magic-status-indicator"),s=e.querySelector(".magic-status");switch(c.textContent=t,i){case"loading":o.style.background="#f59e0b",s.style.background="#fffbeb",s.style.borderColor="#fed7aa",s.style.color="#92400e";break;case"success":o.style.background="#10b981",s.style.background="#ecfdf5",s.style.borderColor="#a7f3d0",s.style.color="#047857";break;case"error":o.style.background="#ef4444",s.style.background="#fef2f2",s.style.borderColor="#fecaca",s.style.color="#dc2626";break;default:o.style.background="#22c55e",s.style.background="#f0fdf4",s.style.borderColor="#bbf7d0",s.style.color="#15803d"}}function l(){chrome.storage.local.set({magicButtonState:a})}function P(){chrome.storage.local.get(["magicButtonState"],t=>{t.magicButtonState&&(a={...a,...t.magicButtonState},f(),a.isVisible&&b())})}window.addEventListener("beforeunload",()=>{n&&n.remove(),e&&e.remove()});
