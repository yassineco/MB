console.log("🎯 Magic Button Suite loaded - Integrated Vertical Panel");let l={isEnabled:!0,isVisible:!1,activeTab:"actions",selectedText:"",userSettings:{defaultLanguage:"fr",autoTranslate:!1,emailSignature:""}},r=null,t=null,S=!1;const L={actions:{icon:"✨",title:"Magic Actions",description:"Corriger, résumer, optimiser du texte"},mail:{icon:"✉️",title:"Magic Mail",description:"Rédaction et optimisation d'emails"},translator:{icon:"🌍",title:"Magic Translator",description:"Traduction intelligente multilingue"},rag:{icon:"🤖",title:"Assistant RAG",description:"Recherche dans vos documents"},settings:{icon:"⚙️",title:"Paramètres",description:"Configuration et préférences"}};document.addEventListener("DOMContentLoaded",y);document.readyState==="loading"?document.addEventListener("DOMContentLoaded",y):y();function y(){A(),M(),F(),K()}function A(){if(S)return;const e=document.createElement("style");e.id="magic-suite-styles",e.textContent=`
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
    
    @keyframes magicGlow {
      0% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
      50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.8); }
      100% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
    }
  `,document.head.appendChild(e),S=!0}function M(){if(r)return;r=document.createElement("div"),r.id="magic-floating-btn",r.innerHTML=`
    <div class="magic-btn-icon">🎯</div>
    <div class="magic-btn-status"></div>
  `,r.style.cssText=`
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
  `;const e=r.querySelector(".magic-btn-icon"),i=r.querySelector(".magic-btn-status");e.style.cssText=`
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
  `,r.addEventListener("click",O),r.addEventListener("mouseenter",()=>{l.isEnabled&&(r.style.transform="scale(1.1)",r.style.boxShadow="0 8px 30px rgba(102, 126, 234, 0.6)")}),r.addEventListener("mouseleave",()=>{r.style.transform="scale(1)",r.style.boxShadow="0 4px 20px rgba(102, 126, 234, 0.4)"}),h(),document.body.appendChild(r)}function $(){t||(t=document.createElement("div"),t.id="magic-suite",t.innerHTML=`
    <div class="magic-suite-header">
      <div class="magic-suite-title">
        <span class="magic-icon">🎯</span>
        Magic Button Suite
      </div>
      <div class="magic-suite-controls">
        <button id="magic-toggle-btn" class="magic-control-btn" title="Activer/Désactiver">
          <span id="magic-toggle-icon">⚡</span>
        </button>
        <button id="magic-minimize-btn" class="magic-control-btn" title="Réduire">×</button>
      </div>
    </div>
    
    <div class="magic-suite-tabs">
      ${Object.entries(L).map(([e,i])=>`
        <button class="magic-tab-btn ${e===l.activeTab?"active":""}" data-tab="${e}">
          <span class="magic-tab-icon">${i.icon}</span>
          <span class="magic-tab-label">${i.title}</span>
        </button>
      `).join("")}
    </div>
    
    <div class="magic-suite-content">
      <div class="magic-tab-content" data-tab="actions">
        ${R()}
      </div>
      <div class="magic-tab-content" data-tab="mail" style="display: none;">
        ${z()}
      </div>
      <div class="magic-tab-content" data-tab="translator" style="display: none;">
        ${D()}
      </div>
      <div class="magic-tab-content" data-tab="rag" style="display: none;">
        ${P()}
      </div>
      <div class="magic-tab-content" data-tab="settings" style="display: none;">
        ${j()}
      </div>
    </div>
    
    <div class="magic-suite-status" id="magic-status">
      <span class="magic-status-indicator"></span>
      <span id="magic-status-text">Prêt</span>
    </div>
  `,t.style.cssText=`
    position: fixed;
    top: 20px;
    right: 90px;
    width: 380px;
    max-height: calc(100vh - 40px);
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid rgba(0, 0, 0, 0.1);
    animation: magicFadeIn 0.3s ease-out;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `,B(),I(),document.body.appendChild(t))}function R(){return`
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
    
    <div class="magic-result-zone" id="actions-result">
      <div class="magic-result-header">
        <span>Résultat</span>
        <button class="magic-result-copy" onclick="copyToClipboard('actions-result-content')">📋 Copier</button>
      </div>
      <div class="magic-result-content" id="actions-result-content"></div>
    </div>
  `}function z(){return`
    <div class="magic-mail-section">
      <div class="magic-mail-input">
        <label>Destinataire:</label>
        <input type="email" id="mail-recipient" placeholder="nom@exemple.com">
      </div>
      <div class="magic-mail-input">
        <label>Sujet:</label>
        <input type="text" id="mail-subject" placeholder="Sujet de l'email">
      </div>
      <div class="magic-mail-input">
        <label>Ton:</label>
        <select id="mail-tone">
          <option value="professionnel">Professionnel</option>
          <option value="amical">Amical</option>
          <option value="formel">Formel</option>
          <option value="décontracté">Décontracté</option>
        </select>
      </div>
      <div class="magic-mail-content">
        <textarea id="mail-content" placeholder="Décrivez brièvement le contenu souhaité..."></textarea>
      </div>
      <div class="magic-mail-actions">
        <button class="magic-btn primary" data-action="generate-email">
          <span>✨</span> Générer Email
        </button>
        <button class="magic-btn secondary" data-action="improve-email">
          <span>🎯</span> Améliorer
        </button>
      </div>
      
      <div class="magic-result-zone" id="mail-result">
        <div class="magic-result-header">
          <span>Email généré</span>
          <button class="magic-result-copy" onclick="copyToClipboard('mail-result-content')">📋 Copier</button>
        </div>
        <div class="magic-result-content" id="mail-result-content"></div>
      </div>
    </div>
  `}function D(){return`
    <div class="magic-translator-section">
      <div class="magic-lang-selector">
        <div class="magic-lang-input">
          <label>De:</label>
          <select id="lang-from">
            <option value="auto">Détection automatique</option>
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
            <option value="es">Espagnol</option>
            <option value="de">Allemand</option>
            <option value="it">Italien</option>
          </select>
        </div>
        <button class="magic-lang-swap" data-action="swap-languages">⇄</button>
        <div class="magic-lang-input">
          <label>Vers:</label>
          <select id="lang-to">
            <option value="en">Anglais</option>
            <option value="fr">Français</option>
            <option value="es">Espagnol</option>
            <option value="de">Allemand</option>
            <option value="it">Italien</option>
          </select>
        </div>
      </div>
      <div class="magic-translator-content">
        <div class="magic-text-input">
          <textarea id="text-to-translate" placeholder="Texte à traduire..."></textarea>
        </div>
        <div class="magic-text-output">
          <div id="translated-text" class="magic-result-box">
            Traduction apparaîtra ici...
          </div>
        </div>
      </div>
      <div class="magic-translator-actions">
        <button class="magic-btn primary" data-action="translate-text">
          <span>🌍</span> Traduire
        </button>
        <button class="magic-btn secondary" data-action="copy-translation">
          <span>📋</span> Copier
        </button>
      </div>
    </div>
  `}function P(){return`
    <div class="magic-rag-section">
      <div class="magic-rag-upload">
        <button class="magic-btn primary" data-action="upload-document">
          <span>📄</span> Ajouter Document
        </button>
        <div class="magic-doc-count">
          <span id="doc-count">0 document(s)</span>
        </div>
      </div>
      <div class="magic-rag-search">
        <div class="magic-search-input">
          <input type="text" id="rag-query" placeholder="Posez votre question...">
          <button class="magic-search-btn" data-action="search-rag">🔍</button>
        </div>
      </div>
      <div class="magic-rag-results">
        <div id="rag-results" class="magic-results-container">
          <div class="magic-empty-state">
            <span>🤖</span>
            <p>Ajoutez des documents et posez vos questions</p>
          </div>
        </div>
      </div>
    </div>
  `}function j(){return`
    <div class="magic-settings-section">
      <div class="magic-setting-group">
        <h4>Général</h4>
        <div class="magic-setting-item">
          <label>Langue par défaut:</label>
          <select id="default-language">
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
            <option value="es">Espagnol</option>
          </select>
        </div>
        <div class="magic-setting-item">
          <label>
            <input type="checkbox" id="auto-translate"> 
            Traduction automatique
          </label>
        </div>
      </div>
      
      <div class="magic-setting-group">
        <h4>Email</h4>
        <div class="magic-setting-item">
          <label>Signature par défaut:</label>
          <textarea id="email-signature" placeholder="Votre signature..."></textarea>
        </div>
      </div>
      
      <div class="magic-setting-group">
        <h4>Interface</h4>
        <div class="magic-setting-item">
          <label>
            <input type="checkbox" id="stay-open"> 
            Garder ouvert après action
          </label>
        </div>
      </div>
      
      <div class="magic-settings-actions">
        <button class="magic-btn primary" data-action="save-settings">
          <span>💾</span> Sauvegarder
        </button>
        <button class="magic-btn secondary" data-action="reset-settings">
          <span>🔄</span> Réinitialiser
        </button>
      </div>
    </div>
  `}function B(){if(!t)return;const e=t.querySelector(".magic-suite-header");e.style.cssText=`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px 16px 0 0;
    flex-shrink: 0;
  `;const i=t.querySelector(".magic-suite-tabs");i.style.cssText=`
    display: flex;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    overflow-x: auto;
    flex-shrink: 0;
  `;const s=t.querySelector(".magic-suite-content");s.style.cssText=`
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    min-height: 0;
  `;const n=t.querySelector(".magic-suite-status");n.style.cssText=`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 0 0 16px 16px;
    font-size: 12px;
    color: #15803d;
    flex-shrink: 0;
  `,t.querySelectorAll(".magic-tab-btn").forEach(d=>{d.style.cssText=`
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #64748b;
      font-size: 11px;
      font-weight: 500;
      min-width: 70px;
      transition: all 0.2s ease;
      border-bottom: 3px solid transparent;
    `});const c=t.querySelector(".magic-tab-btn.active");c&&(c.style.color="#667eea",c.style.borderBottomColor="#667eea",c.style.background="white")}function I(){if(!t)return;const e=t.querySelector("#magic-minimize-btn");e==null||e.addEventListener("click",()=>{l.isVisible=!1,x(),p()});const i=t.querySelector("#magic-toggle-btn");i==null||i.addEventListener("click",()=>{l.isEnabled=!l.isEnabled,h(),q(),p()}),t.querySelectorAll(".magic-tab-btn").forEach(n=>{n.addEventListener("click",a=>{const d=a.currentTarget.getAttribute("data-tab");d&&V(d)})}),G()}function V(e){l.activeTab=e;const i=t==null?void 0:t.querySelectorAll(".magic-tab-btn");i==null||i.forEach(n=>{const a=n;a.getAttribute("data-tab")===e?(a.classList.add("active"),a.style.color="#667eea",a.style.borderBottomColor="#667eea",a.style.background="white"):(a.classList.remove("active"),a.style.color="#64748b",a.style.borderBottomColor="transparent",a.style.background="transparent")});const s=t==null?void 0:t.querySelectorAll(".magic-tab-content");s==null||s.forEach(n=>{const a=n;a.getAttribute("data-tab")===e?a.style.display="block":a.style.display="none"}),e==="actions"&&f(),p()}function G(){if(!t)return;t.querySelectorAll(".magic-action-btn").forEach(d=>{d.addEventListener("click",H)});const i=t.querySelector('[data-action="generate-email"]');i==null||i.addEventListener("click",U);const s=t.querySelector('[data-action="translate-text"]');s==null||s.addEventListener("click",X);const n=t.querySelector('[data-action="search-rag"]');n==null||n.addEventListener("click",_);const a=t.querySelector('[data-action="upload-document"]');a==null||a.addEventListener("click",W);const c=t.querySelector('[data-action="save-settings"]');c==null||c.addEventListener("click",Y)}function F(){document.addEventListener("mouseup",C),document.addEventListener("keyup",C),document.addEventListener("keydown",e=>{e.key==="Escape"&&l.isVisible&&(l.isVisible=!1,x(),p())})}function C(){if(!l.isEnabled)return;const e=window.getSelection(),i=(e==null?void 0:e.toString().trim())||"";i&&i.length>3?(l.selectedText=i,f(),r&&(r.style.animation="magicPulse 0.6s ease-in-out",setTimeout(()=>{r&&(r.style.animation="")},600))):(l.selectedText="",f())}function O(){l.isEnabled&&(l.isVisible=!l.isVisible,l.isVisible?k():x(),p())}function k(){t||$(),t&&(t.style.display="flex",t.style.animation="magicFadeIn 0.3s ease-out",f(),q())}function x(){t&&(t.style.animation="magicSlideOut 0.3s ease-in",setTimeout(()=>{t&&(t.style.display="none")},300))}function h(){if(!r)return;const e=r.querySelector(".magic-btn-icon"),i=r.querySelector(".magic-btn-status");l.isEnabled?(r.style.opacity="1",r.style.cursor="pointer",e.textContent="🎯",i.style.background="#10b981",r.title="Magic Button Suite (Activé) - Cliquez pour ouvrir"):(r.style.opacity="0.5",r.style.cursor="default",e.textContent="😴",i.style.background="#ef4444",r.title="Magic Button Suite (Désactivé) - Cliquez pour ouvrir")}function f(){if(!t||l.activeTab!=="actions")return;const e=t.querySelector("#magic-selected-text");e&&(l.selectedText?(e.innerHTML=l.selectedText,e.style.background="#ecfdf5",e.style.borderColor="#10b981",e.style.color="#064e3b"):(e.innerHTML='<span class="magic-placeholder">Sélectionnez du texte sur la page...</span>',e.style.background="#f8fafc",e.style.borderColor="#e2e8f0",e.style.color="#64748b"))}function q(){if(!t)return;const e=t.querySelector("#magic-toggle-btn"),i=t.querySelector("#magic-toggle-icon"),s=t.querySelector("#magic-status-text");l.isEnabled?(i.textContent="⚡",e.title="Désactiver Magic Button Suite",s.textContent="Activé"):(i.textContent="💤",e.title="Activer Magic Button Suite",s.textContent="Désactivé")}function H(e){const s=e.currentTarget.getAttribute("data-action");!s||!l.selectedText||!l.isEnabled||(o("Traitement...","loading"),g("actions-result","Traitement en cours...","loading"),chrome.runtime.sendMessage({type:"PROCESS_TEXT",action:s,text:l.selectedText},n=>{n&&n.success?(o("Terminé","success"),g("actions-result",n.result,"success"),navigator.clipboard.writeText(n.result).then(()=>{o("Résultat affiché et copié","success"),setTimeout(()=>o("Prêt","ready"),2e3)})):(o("Erreur","error"),g("actions-result","Erreur lors du traitement","error"),setTimeout(()=>o("Prêt","ready"),3e3))}))}function U(){var c,d,b,m;const e=(c=t==null?void 0:t.querySelector("#mail-recipient"))==null?void 0:c.value,i=(d=t==null?void 0:t.querySelector("#mail-subject"))==null?void 0:d.value,s=(b=t==null?void 0:t.querySelector("#mail-tone"))==null?void 0:b.value,n=(m=t==null?void 0:t.querySelector("#mail-content"))==null?void 0:m.value;if(!n){o("Veuillez décrire le contenu de l'email","error");return}o("Génération de l'email...","loading"),g("mail-result","Génération en cours...","loading");const a=`Rédigez un email ${s} avec le sujet "${i}" pour ${e}. Contenu: ${n}`;chrome.runtime.sendMessage({type:"PROCESS_TEXT",action:"optimize",text:a},u=>{u&&u.success?(o("Email généré","success"),g("mail-result",u.result,"success")):(o("Erreur lors de la génération","error"),g("mail-result","Erreur lors de la génération","error"))})}function X(){var s,n;const e=(s=t==null?void 0:t.querySelector("#text-to-translate"))==null?void 0:s.value,i=(n=t==null?void 0:t.querySelector("#lang-to"))==null?void 0:n.value;if(!e){o("Veuillez saisir du texte à traduire","error");return}o("Traduction en cours...","loading"),chrome.runtime.sendMessage({type:"PROCESS_TEXT",action:"translate",text:e,options:{targetLanguage:i}},a=>{if(a&&a.success){const c=t==null?void 0:t.querySelector("#translated-text");c&&(c.textContent=a.result,c.style.background="#ecfdf5",c.style.color="#064e3b"),o("Traduction terminée","success")}else o("Erreur lors de la traduction","error")})}function _(){var n;const e=(n=t==null?void 0:t.querySelector("#rag-query"))==null?void 0:n.value;if(!e){o("Veuillez saisir une question","error");return}o("Recherche en cours...","loading");const i=Date.now(),s=setTimeout(()=>{o("Timeout - Recherche trop longue","error")},1e4);chrome.runtime.sendMessage({type:"RAG_SEARCH",query:e,limit:5},a=>{clearTimeout(s);const c=Date.now()-i;if(chrome.runtime.lastError){console.error("Chrome runtime error:",chrome.runtime.lastError),o("Erreur de connexion","error");return}if(!a){o("Pas de réponse du service","error");return}a.success&&a.results?(N(a.results),o(`${a.results.length} résultat(s) trouvé(s) (${c}ms)`,"success")):(console.error("RAG Search error:",a.error),o(a.error||"Aucun résultat trouvé","error"))})}function N(e){const i=t==null?void 0:t.querySelector("#rag-results");if(i){if(e.length===0){i.innerHTML=`
      <div class="p-4 text-center text-gray-500">
        <Database class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Aucun document trouvé</p>
      </div>
    `;return}i.innerHTML=e.map((s,n)=>{var m;const a=s.document||s,c=a.content||s.content||"",d=s.similarity||0;return`
      <div class="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600">${((m=a.metadata)==null?void 0:m.fileName)||a.fileName||`Document ${n+1}`}</span>
          <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            ${Math.round(d*100)}% pertinence
          </span>
        </div>
        <p class="text-sm text-gray-700 line-clamp-3">${c.substring(0,200)}${c.length>200?"...":""}</p>
      </div>
    `}).join("")}}function W(){const e=document.createElement("input");e.type="file",e.accept=".pdf,.txt,.doc,.docx,.md",e.style.display="none",e.onchange=i=>{var c;const n=(c=i.target.files)==null?void 0:c[0];if(!n)return;o("Upload du document en cours...","loading");const a=new FileReader;a.onload=d=>{var m;const b=(m=d.target)==null?void 0:m.result;chrome.runtime.sendMessage({type:"UPLOAD_DOCUMENT",filename:n.name,content:b,fileType:n.type},u=>{var T,E;if(u&&u.success){o("Document ajouté avec succès","success");const v=t==null?void 0:t.querySelector("#doc-count");if(v){const w=parseInt(((E=(T=v.textContent)==null?void 0:T.match(/\d+/))==null?void 0:E[0])||"0");v.textContent=`${w+1} document(s)`}g("rag-results",`Document "${n.name}" ajouté avec succès !`,"success"),setTimeout(()=>o("Prêt","ready"),2e3)}else o("Erreur lors de l'upload","error"),g("rag-results",`Erreur lors de l'ajout du document: ${(u==null?void 0:u.error)||"Erreur inconnue"}`,"error"),setTimeout(()=>o("Prêt","ready"),3e3)})},a.onerror=()=>{o("Erreur lors de la lecture du fichier","error"),setTimeout(()=>o("Prêt","ready"),3e3)},n.type.includes("text")||n.name.endsWith(".md")||n.name.endsWith(".txt")?a.readAsText(n):a.readAsDataURL(n),document.body.removeChild(e)},document.body.appendChild(e),e.click()}function Y(){var n,a,c;const e=(n=t==null?void 0:t.querySelector("#default-language"))==null?void 0:n.value,i=(a=t==null?void 0:t.querySelector("#auto-translate"))==null?void 0:a.checked,s=(c=t==null?void 0:t.querySelector("#email-signature"))==null?void 0:c.value;l.userSettings={defaultLanguage:e||"fr",autoTranslate:i||!1,emailSignature:s||""},p(),o("Paramètres sauvegardés","success"),setTimeout(()=>o("Prêt","ready"),2e3)}function g(e,i,s){const n=t==null?void 0:t.querySelector(`#${e}`),a=t==null?void 0:t.querySelector(`#${e}-content`);!n||!a||(n.classList.add("show"),n.classList.remove("loading","success","error"),n.classList.add(s),a.textContent=i,n.scrollIntoView({behavior:"smooth",block:"nearest"}))}function J(e){var s;const i=(s=t==null?void 0:t.querySelector(`#${e}`))==null?void 0:s.textContent;i&&navigator.clipboard.writeText(i).then(()=>{o("Copié dans le presse-papiers","success"),setTimeout(()=>o("Prêt","ready"),1500)})}window.copyToClipboard=J;function o(e,i){if(!t)return;const s=t.querySelector("#magic-status-text"),n=t.querySelector(".magic-status-indicator"),a=t.querySelector(".magic-suite-status");switch(s.textContent=e,i){case"loading":n.style.background="#f59e0b",a.style.background="#fffbeb",a.style.borderColor="#fed7aa",a.style.color="#92400e";break;case"success":n.style.background="#10b981",a.style.background="#ecfdf5",a.style.borderColor="#a7f3d0",a.style.color="#047857";break;case"error":n.style.background="#ef4444",a.style.background="#fef2f2",a.style.borderColor="#fecaca",a.style.color="#dc2626";break;default:n.style.background="#22c55e",a.style.background="#f0fdf4",a.style.borderColor="#bbf7d0",a.style.color="#15803d"}}function p(){chrome.storage.local.set({magicButtonState:l})}function K(){chrome.storage.local.get(["magicButtonState"],e=>{e.magicButtonState&&(l={...l,...e.magicButtonState},h(),l.isVisible&&k())})}window.addEventListener("beforeunload",()=>{r&&r.remove(),t&&t.remove()});
