// Crown Hotel Closing Checklist App - Core Logic
// Configurable WhatsApp Phone Number (International format, no '+' or leading zeros)
const WHATSAPP_PHONE_NUMBER = "447000000000"; // Replace with manager's actual phone number

// Checklist Data Structure representing the handwritten закрытие sheets
const CHECKLIST_DATA = [
  {
    phaseId: 1,
    title: "Phase 1: Pre-Closing & Stock",
    subtitle: "30 Mins Before Closing",
    ref: "Ref: 20260623_103006.jpg & 20260623_103017.jpg",
    items: [
      { id: "p1_1", text: "Start putting back bar items through the dishwasher (including trays, bar runners, and tap ends)." },
      { id: "p1_2", text: "Wipe down the back bar." },
      { id: "p1_3", text: "Wipe restaurant tables." },
      { id: "p1_4", text: "Turn off restaurant lights and TVs." },
      { id: "p1_5", text: "Lock restaurant doors." },
      { id: "p1_6", text: "Clean coffee area: wash mugs and spoons, put them away on shelves, wash the coffee machine tray, wipe sides down (to prevent ants), and turn the machine off." },
      { id: "p1_7", text: "Make a stock list behind the bar while serving the last few customers.", note: "Collect stock after closing time, not while customers are inside." }
    ]
  },
  {
    phaseId: 2,
    title: "Phase 2: Last Orders & Clearing",
    subtitle: "Approx. 15 Mins After Ringing Bell",
    ref: "Ref: 20260623_103006.jpg & 20260623_103013.jpg",
    items: [
      { id: "p2_1", text: "Start putting the front bar through the dishwasher (including trays, bar runners, and beer tap ends)." },
      { id: "p2_2", text: "After ringing the bell for last orders, start walking around, converting drinks to plastics, and wiping tables in the bar area." },
      { id: "p2_3", text: "Turn off fairy lights and outdoor lights." },
      { id: "p2_4", text: "Get stock, put it away, and shuffle everyone out." }
    ]
  },
  {
    phaseId: 3,
    title: "Phase 3: Cashing Up & Financials",
    subtitle: "Till & Office Procedures",
    ref: "Ref: 20260623_103013.jpg",
    items: [
      { id: "p3_1", text: "Take the till to the office. Place old notes, receipts, and bags of money into the black box on the desk by the computer." },
      { id: "p3_2", text: "Put the black box inside the safe." },
      { id: "p3_3", text: "Place the till tray (with loose change inside) into the cabinet to the left of the desk." }
    ]
  },
  {
    phaseId: 4,
    title: "Phase 4: Cleaning & Final Bar Lockdown",
    subtitle: "Bar Closure & Hygiene Checks",
    ref: "Ref: 20260623_103017.jpg",
    items: [
      { id: "p4_1", text: "Put the bar back together." },
      { id: "p4_2", text: "Clean/separate the glass washer." },
      { id: "p4_3", text: "Rinse out any glasses left and the jug.", critical: true, note: "CRITICAL: We have a fly problem, so no drinks are to be left out and no dirty cloths left on sides." },
      { id: "p4_4", text: "Mop floors (Kitchen and Bar area)." },
      { id: "p4_5", text: "Put dirty cloths in the laundry room and lock the door behind you." },
      { id: "p4_6", text: "Lock the bar door." }
    ]
  },
  {
    phaseId: 5,
    title: "Phase 5: Security Walkthrough Checklists",
    subtitle: "Perimeter & Locking Procedures",
    ref: "Ref: 20260623_103013.jpg & 20260623_103017.jpg",
    subsections: [
      {
        title: "Hotel Way Check",
        items: [
          { id: "p5_h1", text: "Vic's cupboard", state: "Locked", critical: true },
          { id: "p5_h2", text: "Garden door", state: "Locked", critical: true },
          { id: "p5_h3", text: "Red fire door", state: "Locked & Alarmed", critical: true }
        ]
      },
      {
        title: "Final Building Perimeter Check",
        items: [
          { id: "p5_p1", text: "Pool room fire exit", state: "Locked & Alarmed", critical: true },
          { id: "p5_p2", text: "Upstairs room door", state: "Closed" },
          { id: "p5_p3a", text: "Front doors secured: Top lock checked", critical: true },
          { id: "p5_p3b", text: "Front doors secured: Middle bolt checked", critical: true },
          { id: "p5_p3c", text: "Front doors secured: Bottom bolts checked", critical: true },
          { id: "p5_p4", text: "Restaurant doors", state: "Locked", critical: true },
          { id: "p5_p5", text: "Stock room", state: "Locked", critical: true },
          { id: "p5_p6", text: "Door at the back of the kitchen", state: "Locked", critical: true },
          { id: "p5_p7", text: "Cellar door", state: "Locked", critical: true },
          { id: "p5_p8", text: "Bar door", state: "Locked", critical: true }
        ]
      }
    ]
  }
];

// Quick-tap Restock Inventory configuration
const RESTOCK_ITEMS_CONFIG = [
  {
    category: "Mixers & Softs",
    items: [
      "Thatchers Zero",
      "Doom Bar Zero",
      "Old Mout Cider",
      "Diet Coke",
      "Coca-Cola",
      "Fanta",
      "Schweppes Tonic/Slimline",
      "Monster Energy (Punch)",
      "Monster Energy (Mango)",
      "Monster Energy (Original)",
      "Monster Energy (Ultra)"
    ]
  },
  {
    category: "Bottled Beers & Alcopops",
    items: [
      "VK (Blue)",
      "VK (Ice)",
      "VK (Orange)",
      "Stella Artois",
      "Birra Moretti",
      "Desperados",
      "Old Speckled Hen",
      "Magners"
    ]
  }
];

// Quick-tap Restock Inventory state
let restockCounts = {};

// Flat list helper for calculations and PDF printing
function getAllItems() {
  const all = [];
  CHECKLIST_DATA.forEach(phase => {
    if (phase.items) {
      phase.items.forEach(item => {
        all.push({ ...item, phaseTitle: phase.title });
      });
    } else if (phase.subsections) {
      phase.subsections.forEach(sub => {
        sub.items.forEach(item => {
          all.push({ ...item, phaseTitle: phase.title, subsectionTitle: sub.title });
        });
      });
    }
  });
  return all;
}

// App State
let checkedState = {};
let isSigned = false;

// DOM Elements
const checklistContainer = document.getElementById("checklist-container");
const headerProgress = document.getElementById("header-progress");
const progressPercent = document.getElementById("progress-percent");
const headerDate = document.getElementById("header-date");
const staffNameInput = document.getElementById("staff-name");
const btnSubmit = document.getElementById("btn-submit");
const btnReset = document.getElementById("btn-reset");
const clearSignatureBtn = document.getElementById("clear-signature");
const canvas = document.getElementById("signature-canvas");
const ctx = canvas.getContext("2d");
const signaturePlaceholder = document.getElementById("signature-placeholder");
const modalOverlay = document.getElementById("modal-overlay");
const modalSpinner = document.getElementById("modal-spinner");
const modalSuccessIcon = document.getElementById("modal-success-icon");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");

// Canvas Drawing Coordinates Utility
let drawing = false;

function getMousePos(canvasDom, event) {
  const rect = canvasDom.getBoundingClientRect();
  const scaleX = canvasDom.width / rect.width;
  const scaleY = canvasDom.height / rect.height;
  
  if (event.touches && event.touches.length > 0) {
    return {
      x: (event.touches[0].clientX - rect.left) * scaleX,
      y: (event.touches[0].clientY - rect.top) * scaleY
    };
  }
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

// Draw Functions
function startDrawing(e) {
  drawing = true;
  isSigned = true;
  signaturePlaceholder.classList.add("hidden");
  const pos = getMousePos(canvas, e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  e.preventDefault();
}

function draw(e) {
  if (!drawing) return;
  const pos = getMousePos(canvas, e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  e.preventDefault();
}

function stopDrawing() {
  drawing = false;
  validateForm();
}

// Setup Canvas size
function initCanvas() {
  const rect = canvas.parentNode.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  
  canvas.width = rect.width * ratio;
  canvas.height = 144 * ratio;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `144px`;
  
  ctx.scale(ratio, ratio);
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#b89047"; // Warm brass drawing color
  
  // Track pointer movements
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", stopDrawing);
  
  // Mobile touch support
  canvas.addEventListener("touchstart", startDrawing);
  canvas.addEventListener("touchmove", draw);
  canvas.addEventListener("touchend", stopDrawing);
  canvas.addEventListener("touchcancel", stopDrawing);
}

// Clear signature pad
function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  isSigned = false;
  signaturePlaceholder.classList.remove("hidden");
  validateForm();
}

// Render dynamic checklist items
function renderChecklist() {
  checklistContainer.innerHTML = "";
  
  CHECKLIST_DATA.forEach(phase => {
    // Create Phase Accordion Wrapper
    const phaseWrapper = document.createElement("div");
    phaseWrapper.className = "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col";
    
    // Accordion Header
    const accordionHeader = document.createElement("button");
    accordionHeader.className = "w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none transition-colors hover:bg-slate-800/40";
    accordionHeader.setAttribute("type", "button");
    
    // Check if this phase is completed to show visual indication in heading
    const isPhaseCompleted = checkPhaseCompleted(phase);
    
    accordionHeader.innerHTML = `
      <div class="flex-1 pr-4">
        <div class="flex items-center gap-2">
          <span class="text-xs uppercase font-bold tracking-widest text-brass select-none">Phase ${phase.phaseId}</span>
          ${isPhaseCompleted ? `
            <span class="bg-brass/20 text-brass text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Done</span>
          ` : ""}
        </div>
        <h3 class="text-base font-bold text-slate-100 mt-0.5">${phase.title}</h3>
        <p class="text-xs text-slate-400 font-medium">${phase.subtitle}</p>
      </div>
      <div class="flex-none text-slate-400 accordion-chevron transition-transform duration-300">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    `;
    
    // Accordion Content Panel
    const accordionContent = document.createElement("div");
    accordionContent.className = "accordion-content open px-5 pb-5 border-t border-slate-800/50 pt-4 flex flex-col gap-3.5";
    
    // Render Phase items
    if (phase.items) {
      phase.items.forEach(item => {
        const itemRow = createChecklistItem(item);
        accordionContent.appendChild(itemRow);
      });
      
      // Inject Fridge Stock & Photo Capture Component inside Phase 1
      if (phase.phaseId === 1) {
        const stockContainer = document.createElement("div");
        stockContainer.className = "mt-5 flex flex-col gap-5";
        stockContainer.innerHTML = `
          <!-- Photo capture boxes stack vertically, taking up 100% width with strict height h-40 relative -->
          <div class="flex flex-col gap-4">
            <!-- Top/Mixer Fridge Photo -->
            <div id="preview-top-fridge" class="w-full h-40 bg-slate-900 border border-slate-800 hover:border-brass/50 rounded-xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all duration-300">
              <div class="flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                <svg class="w-8 h-8 text-slate-500 group-hover:text-brass transition-colors duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
                </svg>
                <span class="text-xs font-bold tracking-wider uppercase text-slate-300 group-hover:text-brass transition-colors duration-300">Capture Top/Mixer Fridge</span>
              </div>
              <input type="file" id="input-top-fridge" accept="image/*" capture="environment" class="absolute inset-0 opacity-0 cursor-pointer z-20">
              <img id="img-top-fridge" class="absolute inset-0 w-full h-full object-cover opacity-0 scale-95 pointer-events-none z-10 transition-all duration-300 ease-out">
              <button type="button" id="btn-del-top-fridge" class="absolute top-3 right-3 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full p-2.5 opacity-0 scale-90 pointer-events-none z-30 transition-all duration-300 ease-out active:scale-95 shadow-md">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <!-- Lower/Beer Fridge Photo -->
            <div id="preview-beer-fridge" class="w-full h-40 bg-slate-900 border border-slate-800 hover:border-brass/50 rounded-xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all duration-300">
              <div class="flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                <svg class="w-8 h-8 text-slate-500 group-hover:text-brass transition-colors duration-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
                </svg>
                <span class="text-xs font-bold tracking-wider uppercase text-slate-300 group-hover:text-brass transition-colors duration-300">Capture Lower/Beer Fridge</span>
              </div>
              <input type="file" id="input-beer-fridge" accept="image/*" capture="environment" class="absolute inset-0 opacity-0 cursor-pointer z-20">
              <img id="img-beer-fridge" class="absolute inset-0 w-full h-full object-cover opacity-0 scale-95 pointer-events-none z-10 transition-all duration-300 ease-out">
              <button type="button" id="btn-del-beer-fridge" class="absolute top-3 right-3 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full p-2.5 opacity-0 scale-90 pointer-events-none z-30 transition-all duration-300 ease-out active:scale-95 shadow-md">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Action Button to Auto-Generate Stock Needed from Captured Images -->
          <div class="flex flex-col gap-1.5 mt-1">
            <button type="button" id="btn-generate-stock" class="w-full bg-gradient-to-r from-brass-dark via-brass to-brass-light hover:brightness-110 active:scale-[0.98] text-slate-950 font-bold py-4 px-6 rounded-xl shadow-lg shadow-brass-soft transition-all flex items-center justify-center gap-2 cursor-pointer">
              <svg class="w-5 h-5 text-slate-950 flex-none animate-pulse" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096L3 15.187m6 5.813a2 2 0 01-2-2m2 2a2 2 0 002-2m-2 2h-.059M21 3c.969 0 1.371 1.24.588 1.81l-3.96 2.876a1 1 0 00-.374 1.13l1.513 4.654c.299.922-.755 1.688-1.538 1.118l-3.96-2.876a1 1 0 00-1.18 0l-3.96 2.876c-.783.57-1.837-.196-1.538-1.118l1.513-4.654a1 1 0 00-.374-1.13L3.588 4.81C2.805 4.24 3.207 3 4.176 3H21z"/>
              </svg>
              <span>Generate Stock Needed</span>
            </button>
            <div id="scan-message" class="text-xs text-center text-slate-400 font-medium hidden"></div>
          </div>

          <!-- Stock Needed Summary Panel (Live Updating) -->
          <div id="stock-summary-panel" class="p-5 bg-brass-soft border border-brass/30 rounded-xl flex flex-col gap-3 transition-all duration-300 hidden">
            <h5 class="text-xs font-black uppercase tracking-widest text-brass flex items-center gap-1.5 border-b border-brass/25 pb-1">
              <svg class="w-4 h-4 text-brass" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
              Stock Needed Summary
            </h5>
            <ul id="stock-summary-list" class="flex flex-col gap-1"></ul>
          </div>

          <!-- Quick-Tap Restock Grid -->
          <div id="restock-grid-container" class="flex flex-col gap-6 mt-2"></div>
          
          <!-- Textarea shortages -->
          <div class="flex flex-col gap-2 mt-2">
            <label for="restock-shortages" class="text-xs font-bold uppercase tracking-wider text-slate-300">Other Shortages / Miscellaneous Notes</label>
            <textarea id="restock-shortages" rows="3" placeholder="e.g. Low on lemons, order lime cordial..."
              class="w-full bg-slate-900 border border-slate-800 focus:border-brass rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-brass transition-all resize-none"></textarea>
          </div>
        `;
        accordionContent.appendChild(stockContainer);
        
        // Setup handlers dynamically
        setTimeout(() => {
          setupStockAndPhotoHandlers();
        }, 0);
      }
    } else if (phase.subsections) {
      phase.subsections.forEach(sub => {
        const subHeading = document.createElement("h4");
        subHeading.className = "text-xs font-bold uppercase tracking-wider text-brass mt-2 mb-1 border-l-2 border-brass pl-2";
        subHeading.innerText = sub.title;
        accordionContent.appendChild(subHeading);
        
        sub.items.forEach(item => {
          const itemRow = createChecklistItem(item);
          accordionContent.appendChild(itemRow);
        });
      });
    }
    
    // Toggle accordion state
    accordionHeader.addEventListener("click", () => {
      const chevron = accordionHeader.querySelector(".accordion-chevron");
      accordionContent.classList.toggle("open");
      if (accordionContent.classList.contains("open")) {
        chevron.classList.remove("-rotate-90");
      } else {
        chevron.classList.add("-rotate-90");
      }
    });

    phaseWrapper.appendChild(accordionHeader);
    phaseWrapper.appendChild(accordionContent);
    checklistContainer.appendChild(phaseWrapper);
  });
}

// Generate Checkbox Row Elements
function createChecklistItem(item) {
  const row = document.createElement("div");
  const isChecked = !!checkedState[item.id];
  
  row.className = `checklist-item flex gap-3.5 items-start p-3 rounded-lg border border-slate-800 bg-slate-950/50 cursor-pointer select-none ${isChecked ? "checked" : ""}`;
  row.dataset.itemId = item.id;
  
  // Custom critical tag
  let criticalBadge = "";
  if (item.critical) {
    criticalBadge = `<span class="bg-rose-500/10 text-rose-400 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider border border-rose-500/20">Critical</span>`;
  }
  
  // Checkbox detail/state text
  let detailBadge = "";
  if (item.state) {
    detailBadge = `<span class="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-700 ml-1 font-medium font-mono">${item.state}</span>`;
  }
  
  // Extra notes (collect stock, flies etc)
  let extraNote = "";
  if (item.note) {
    extraNote = `<p class="text-xs text-amber-500 mt-1 select-none font-medium flex items-center gap-1">
      <svg class="w-3.5 h-3.5 flex-none" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
      ${item.note}
    </p>`;
  }

  row.innerHTML = `
    <div class="flex items-center h-5 mt-0.5">
      <input type="checkbox" id="chk-${item.id}" class="check-pop w-5.5 h-5.5 rounded border-slate-700 bg-slate-900 text-brass focus:ring-brass focus:ring-offset-slate-950 focus:ring-2 accent-brass cursor-pointer" ${isChecked ? "checked" : ""}>
    </div>
    <div class="flex-1 leading-tight">
      <div class="flex flex-wrap items-center gap-1.5 mb-0.5">
        <label for="chk-${item.id}" class="text-sm font-medium text-slate-200 cursor-pointer block">${item.text}</label>
        ${detailBadge}
        ${criticalBadge}
      </div>
      ${extraNote}
    </div>
  `;
  
  // Click on row to toggle checkbox
  row.addEventListener("click", (e) => {
    if (e.target.tagName !== "INPUT" && e.target.tagName !== "LABEL") {
      const checkbox = row.querySelector('input[type="checkbox"]');
      checkbox.checked = !checkbox.checked;
      toggleItem(item.id, checkbox.checked);
    }
  });
  
  // Explicitly listen to checkbox inputs
  row.querySelector("input").addEventListener("change", (e) => {
    toggleItem(item.id, e.target.checked);
  });
  
  return row;
}

// Toggle checklist items status
function toggleItem(id, isChecked) {
  checkedState[id] = isChecked;
  localStorage.setItem("crown_closedown_checked_state", JSON.stringify(checkedState));
  
  // Find row on page and update class
  const row = document.querySelector(`[data-item-id="${id}"]`);
  if (row) {
    if (isChecked) {
      row.classList.add("checked");
    } else {
      row.classList.remove("checked");
    }
  }
  
  updateProgress();
  validateForm();
  
  // Update phase header badges dynamically
  updatePhaseBadges();
}

// Check if a phase is fully completed
function checkPhaseCompleted(phase) {
  if (phase.items) {
    return phase.items.every(item => !!checkedState[item.id]);
  } else if (phase.subsections) {
    return phase.subsections.every(sub => 
      sub.items.every(item => !!checkedState[item.id])
    );
  }
  return false;
}

// Update phase header completed status badges
function updatePhaseBadges() {
  CHECKLIST_DATA.forEach(phase => {
    // Find phase button
    const headers = Array.from(document.querySelectorAll("button"));
    const phaseHeader = headers.find(h => h.querySelector("h3") && h.querySelector("h3").innerText === phase.title);
    if (phaseHeader) {
      const badgeContainer = phaseHeader.querySelector(".bg-brass\\/20, .badge-injected");
      const isPhaseCompleted = checkPhaseCompleted(phase);
      
      // Remove existing badge if present
      const existingBadge = phaseHeader.querySelector(".bg-brass\\/20");
      if (existingBadge) existingBadge.remove();
      
      if (isPhaseCompleted) {
        const badgeSpan = document.createElement("span");
        badgeSpan.className = "bg-brass/20 text-brass text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ml-2";
        badgeSpan.innerText = "Done";
        phaseHeader.querySelector("h3").parentNode.querySelector(".flex").appendChild(badgeSpan);
      }
    }
  });
}

// Refresh top progress bar state
function updateProgress() {
  const allItems = getAllItems();
  const total = allItems.length;
  const completed = allItems.filter(item => !!checkedState[item.id]).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  headerProgress.style.width = `${pct}%`;
  progressPercent.innerText = `${pct}% Complete`;
}

// Form fields validator
function validateForm() {
  const allItems = getAllItems();
  const allChecked = allItems.every(item => !!checkedState[item.id]);
  const nameEntered = staffNameInput.value.trim().length > 0;
  const signatureDrawn = isSigned;
  
  const chkDisclaimer = document.getElementById("chk-disclaimer");
  const disclaimerChecked = chkDisclaimer ? chkDisclaimer.checked : false;
  
  const isValid = allChecked && nameEntered && signatureDrawn && disclaimerChecked;
  
  btnSubmit.disabled = !isValid;
  
  // Visual tweaks for button status
  const arrow = document.getElementById("btn-arrow");
  if (isValid) {
    btnSubmit.classList.add("shadow-brass/40");
    arrow.classList.add("translate-x-1");
  } else {
    btnSubmit.classList.remove("shadow-brass/40");
    arrow.classList.remove("translate-x-1");
  }
}

// Reset entire checklist data
function resetChecklist() {
  const confirmed = confirm("Are you sure you want to reset the checklist? This will clear all checked items, staff name, and signature.");
  if (confirmed) {
    checkedState = {};
    localStorage.removeItem("crown_closedown_checked_state");
    
    staffNameInput.value = "";
    localStorage.removeItem("crown_closedown_staff_name");
    
    // Clear stocks & photos & quick-tap counts
    localStorage.removeItem("crown_closedown_top_fridge_img");
    localStorage.removeItem("crown_closedown_beer_fridge_img");
    localStorage.removeItem("crown_closedown_back_bar_img");
    localStorage.removeItem("crown_closedown_cellar_img");
    localStorage.removeItem("crown_closedown_shortages");
    localStorage.removeItem("crown_closedown_restock_counts");
    restockCounts = {};
    
    // Clear compliance checkbox
    const chkDisclaimer = document.getElementById("chk-disclaimer");
    if (chkDisclaimer) {
      chkDisclaimer.checked = false;
    }
    
    clearSignature();
    renderChecklist();
    updateProgress();
    validateForm();
  }
}

// Trigger browser PDF download using jsPDF client-side
function generatePDFAndRedirect() {
  // Show progress modal
  modalOverlay.classList.remove("hidden");
  modalOverlay.classList.add("opacity-100");
  modalSpinner.classList.remove("hidden");
  modalSuccessIcon.classList.add("hidden");
  modalTitle.innerText = "Generating Report...";
  modalDesc.innerText = "Compiling checklist details and encoding digital signature. PDF download starting shortly.";

  setTimeout(() => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const today = new Date();
      const dateString = today.toLocaleDateString("en-GB", {
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
      const timeString = today.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
      const filenameDate = today.toISOString().split('T')[0];

      // Page parameters
      const margin = 15;
      const pageWidth = 210;
      const pageHeight = 297;
      let y = 20;

      // Helper function for drawing horizontal divider line
      function drawDivider(color = [184, 144, 71], thickness = 0.5) {
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(thickness);
        doc.line(margin, y, pageWidth - margin, y);
        y += thickness + 4;
      }

      // Helper function to check if page break is needed
      function ensureSpace(heightNeeded) {
        const bottomMargin = 20;
        if (y + heightNeeded > pageHeight - bottomMargin) {
          doc.addPage();
          // Draw standard page header on subsequent pages
          doc.setFillColor(15, 23, 42);
          doc.rect(0, 0, pageWidth, 12, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(184, 144, 71);
          doc.text("CROWN HOTEL - NIGHTLY CLOSEDOWN REPORT (CONTINUED)", margin, 8);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(120, 120, 120);
          doc.text(`Generated: ${dateString} ${timeString}`, pageWidth - margin - 50, 8);
          
          y = 20; // reset y to top margin on new page
        }
      }

      // Title Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 28, "F");
      
      // Gold accent bar
      doc.setFillColor(184, 144, 71); // brass gold
      doc.rect(0, 28, pageWidth, 2, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(184, 144, 71); // brass gold
      doc.text("CROWN HOTEL", margin, 14);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(241, 245, 249); // white-ish
      doc.text("NIGHTLY CLOSEDOWN COMPLIANCE REPORT", margin, 20);

      y = 40; // start text after header banner

      // Meta Box
      ensureSpace(28);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.rect(margin, y, pageWidth - (margin * 2), 24, "FD");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      
      doc.text("Date of Closedown:", margin + 5, y + 6);
      doc.text("Closedown Time:", margin + 5, y + 12);
      doc.text("Staff Member:", margin + 5, y + 18);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(dateString, margin + 45, y + 6);
      doc.text(timeString, margin + 45, y + 12);
      doc.text(staffNameInput.value.trim(), margin + 45, y + 18);
      
      y += 30; // spacer

      // Draw Checklist Items by Phase
      CHECKLIST_DATA.forEach(phase => {
        ensureSpace(15);
        
        // Phase Banner
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(margin, y, pageWidth - (margin * 2), 7, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(phase.title.toUpperCase(), margin + 3, y + 5);
        y += 10;

        if (phase.items) {
          phase.items.forEach(item => {
            const taskText = item.text + (item.note ? `\n(Note: ${item.note})` : "");
            const printableWidth = pageWidth - (margin * 2) - 10;
            const lines = doc.splitTextToSize(taskText, printableWidth);
            const textHeight = lines.length * 4.5;
            
            ensureSpace(textHeight + 4);
            
            // Checkbox box
            doc.setDrawColor(184, 144, 71);
            doc.setLineWidth(0.4);
            doc.rect(margin, y - 3.2, 3.5, 3.5);
            
            // Checkmark
            doc.setFont("helvetica", "bold");
            doc.setTextColor(16, 185, 129); // Green check
            doc.setFontSize(8);
            doc.text("Y", margin + 0.8, y - 0.5); // Y for checkmark representation
            
            // Task text
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            
            if (item.critical) {
              doc.setTextColor(225, 29, 72); // Rose-600 color for critical notes
              doc.setFont("helvetica", "bold");
            } else {
              doc.setTextColor(51, 65, 85); // Slate-700
            }
            
            doc.text(lines, margin + 7, y);
            y += textHeight + 2.5;
          });
          
          // Draw shortages, Quick-tap grid, and photos in Phase 1
          if (phase.phaseId === 1) {
            const storedShortages = localStorage.getItem("crown_closedown_shortages");
            const storedTopFridgeImg = localStorage.getItem("crown_closedown_top_fridge_img") || localStorage.getItem("crown_closedown_back_bar_img");
            const storedBeerFridgeImg = localStorage.getItem("crown_closedown_beer_fridge_img") || localStorage.getItem("crown_closedown_cellar_img");
            
            // 1. Quick-Tap restock counts
            const restockItems = [];
            RESTOCK_ITEMS_CONFIG.forEach(cat => {
              cat.items.forEach(itemName => {
                const count = restockCounts[itemName] || 0;
                if (count > 0) {
                  restockItems.push(`${itemName} (x${count})`);
                }
              });
            });
            
            if (restockItems.length > 0) {
              ensureSpace(20);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(8.5);
              doc.setTextColor(184, 144, 71);
              doc.text("QUICK-TAP RESTOCK INVENTORY:", margin + 3, y + 2);
              y += 6.5;
              
              doc.setFont("helvetica", "normal");
              doc.setFontSize(8);
              doc.setTextColor(51, 65, 85);
              
              const restockText = restockItems.join(", ");
              const restockLines = doc.splitTextToSize(restockText, pageWidth - (margin * 2) - 6);
              ensureSpace(restockLines.length * 4.5 + 4);
              doc.text(restockLines, margin + 3, y);
              y += restockLines.length * 4.5 + 5;
            }

            // 2. Miscellaneous notes / shortages text
            if (storedShortages && storedShortages.trim().length > 0) {
              ensureSpace(20);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(8.5);
              doc.setTextColor(184, 144, 71);
              doc.text("OTHER SHORTAGES / MISC NOTES:", margin + 3, y + 2);
              y += 6.5;
              
              doc.setFont("helvetica", "normal");
              doc.setFontSize(8);
              doc.setTextColor(51, 65, 85);
              
              const shortageLines = doc.splitTextToSize(storedShortages.trim(), pageWidth - (margin * 2) - 6);
              ensureSpace(shortageLines.length * 4.5 + 4);
              doc.text(shortageLines, margin + 3, y);
              y += shortageLines.length * 4.5 + 5;
            }
            
            // 3. Fridge photos
            if (storedTopFridgeImg || storedBeerFridgeImg) {
              ensureSpace(60);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(8.5);
              doc.setTextColor(184, 144, 71);
              doc.text("FRIDGE STOCK PHOTOS:", margin + 3, y + 2);
              y += 6.5;
              
              const photoWidth = 60;
              const photoHeight = 45;
              
              if (storedTopFridgeImg) {
                try {
                  doc.addImage(storedTopFridgeImg, "JPEG", margin + 3, y, photoWidth, photoHeight);
                } catch (e) {
                  console.error("Error adding top fridge image to PDF", e);
                }
              }
              
              if (storedBeerFridgeImg) {
                const xPos = storedTopFridgeImg ? (margin + 3 + photoWidth + 5) : (margin + 3);
                try {
                  doc.addImage(storedBeerFridgeImg, "JPEG", xPos, y, photoWidth, photoHeight);
                } catch (e) {
                  console.error("Error adding beer fridge image to PDF", e);
                }
              }
              y += photoHeight + 6;
            }
          }
        } else if (phase.subsections) {
          phase.subsections.forEach(sub => {
            ensureSpace(10);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(184, 144, 71);
            doc.text(sub.title.toUpperCase(), margin, y);
            y += 4.5;
            
            sub.items.forEach(item => {
              const stateText = item.state ? ` (${item.state})` : "";
              const taskText = item.text + stateText;
              const printableWidth = pageWidth - (margin * 2) - 10;
              const lines = doc.splitTextToSize(taskText, printableWidth);
              const textHeight = lines.length * 4.5;
              
              ensureSpace(textHeight + 4);
              
              // Checkbox box
              doc.setDrawColor(184, 144, 71);
              doc.setLineWidth(0.4);
              doc.rect(margin, y - 3.2, 3.5, 3.5);
              
              // Checkmark
              doc.setFont("helvetica", "bold");
              doc.setTextColor(16, 185, 129); // Green check
              doc.setFontSize(8);
              doc.text("Y", margin + 0.8, y - 0.5);
              
              // Task text
              doc.setFont("helvetica", "normal");
              doc.setFontSize(8.5);
              
              if (item.critical) {
                doc.setTextColor(225, 29, 72);
                doc.setFont("helvetica", "bold");
              } else {
                doc.setTextColor(51, 65, 85);
              }
              
              doc.text(lines, margin + 7, y);
              y += textHeight + 2.5;
            });
          });
        }
        
        y += 3; // buffer between phases
      });

      // Shift Compliance Disclaimer
      ensureSpace(30);
      y += 5;
      drawDivider([203, 213, 225], 0.2); // Light divider
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("SHIFT COMPLIANCE DISCLAIMER", margin, y);
      y += 4.5;
      
      // Draw disclaimer checkbox box
      doc.setDrawColor(184, 144, 71);
      doc.setLineWidth(0.4);
      doc.rect(margin, y - 3.2, 3.5, 3.5);
      
      // Green Y representing check
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(8);
      doc.text("Y", margin + 0.8, y - 0.5);
      
      // Text
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const disclaimerText = "I confirm that I have completed my shift in its entirety. I certify that all drinks served during my shift have been properly processed and paid for. I am concluding my shift with a clear head and am in an appropriate state for the conditions of my role.";
      const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - (margin * 2) - 8);
      doc.text(disclaimerLines, margin + 7, y);
      y += disclaimerLines.length * 4 + 4;

      // Signature Draw-in
      ensureSpace(40);
      y += 5;
      drawDivider([203, 213, 225], 0.2); // Light divider
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("STAFF SIGNATURE & VERIFICATION", margin, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("I hereby certify that all the closing-down checks detailed in this report have been performed in accordance with pub closing protocol.", margin, y + 4.5);
      
      // Export signature image from Canvas
      const sigDataUrl = canvas.toDataURL("image/png");
      
      // Add signature frame and image
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y + 8, 65, 22, "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, y + 8, 65, 22, "D");
      
      doc.addImage(sigDataUrl, "PNG", margin + 1.5, y + 9.5, 62, 19);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`NAME: ${staffNameInput.value.trim().toUpperCase()}`, margin + 75, y + 14);
      doc.setFont("helvetica", "normal");
      doc.text(`DATE: ${dateString}`, margin + 75, y + 21);

      // Save PDF triggering download
      doc.save(`Crown_Closedown_${filenameDate}.pdf`);

      // Update Modal to success
      modalSpinner.classList.add("hidden");
      modalSuccessIcon.classList.remove("hidden");
      modalTitle.innerText = "Report Saved!";
      modalDesc.innerText = "PDF downloaded successfully. Directing you to WhatsApp to alert management...";

      // Redirection delay
      setTimeout(() => {
        const text = encodeURIComponent(`Hello, I have completed the nightly closedown report for the Crown Hotel on ${dateString}. The PDF report has been generated and saved!`);
        window.location.href = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${text}`;
        
        // Hide modal after navigation trigger
        setTimeout(() => {
          modalOverlay.classList.add("hidden");
          modalOverlay.classList.remove("opacity-100");
        }, 1500);
      }, 2000);

    } catch (err) {
      console.error("PDF generation failure", err);
      alert("An error occurred while compiling your PDF report: " + err.message);
      modalOverlay.classList.add("hidden");
      modalOverlay.classList.remove("opacity-100");
    }
  }, 1000);
}

// Bind Page Events
window.addEventListener("DOMContentLoaded", () => {
  // 1. Initialise Checklist Data from LocalStorage if present
  const storedChecks = localStorage.getItem("crown_closedown_checked_state");
  if (storedChecks) {
    try {
      checkedState = JSON.parse(storedChecks);
    } catch(e) {
      checkedState = {};
    }
  }

  // Initialise Quick-tap Restock Counts from LocalStorage
  const storedCounts = localStorage.getItem("crown_closedown_restock_counts");
  if (storedCounts) {
    try {
      restockCounts = JSON.parse(storedCounts);
    } catch(e) {
      restockCounts = {};
    }
  }
  
  // 2. Initialise Staff Name from LocalStorage
  const storedName = localStorage.getItem("crown_closedown_staff_name");
  if (storedName) {
    staffNameInput.value = storedName;
  }
  
  // Set date in header
  const today = new Date();
  headerDate.innerText = today.toLocaleDateString("en-GB", {
    weekday: 'long', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });

  // Render & setup interactions
  renderChecklist();
  updateProgress();
  initCanvas();
  validateForm();
  
  // Listen for window resize to adjust canvas width
  window.addEventListener("resize", () => {
    // Canvas adjustment scaling for high-DPI screens
    const rect = canvas.parentNode.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = 144 * ratio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `144px`;
    ctx.scale(ratio, ratio);
    
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#b89047";
    isSigned = false; // Reset signed state as canvas size reset clears it
    signaturePlaceholder.classList.remove("hidden");
    validateForm();
  });

  // Track name changes
  staffNameInput.addEventListener("input", (e) => {
    localStorage.setItem("crown_closedown_staff_name", e.target.value);
    validateForm();
  });
  
  // Bind Action Buttons
  btnReset.addEventListener("click", resetChecklist);
  clearSignatureBtn.addEventListener("click", clearSignature);
  btnSubmit.addEventListener("click", generatePDFAndRedirect);

  // Bind Shift Compliance Disclaimer Checkbox
  const chkDisclaimer = document.getElementById("chk-disclaimer");
  const disclaimerRow = document.getElementById("disclaimer-row");
  if (chkDisclaimer) {
    chkDisclaimer.addEventListener("change", () => {
      validateForm();
    });
  }
  if (disclaimerRow && chkDisclaimer) {
    disclaimerRow.addEventListener("click", (e) => {
      if (e.target.tagName !== "INPUT" && e.target.tagName !== "LABEL") {
        chkDisclaimer.checked = !chkDisclaimer.checked;
        validateForm();
      }
    });
  }
});

// Photo uploaders, quick restock grid & notes helper functions
function setupStockAndPhotoHandlers() {
  const inputTop = document.getElementById("input-top-fridge");
  const imgTop = document.getElementById("img-top-fridge");
  const btnDelTop = document.getElementById("btn-del-top-fridge");

  const inputBeer = document.getElementById("input-beer-fridge");
  const imgBeer = document.getElementById("img-beer-fridge");
  const btnDelBeer = document.getElementById("btn-del-beer-fridge");

  const shortagesTextarea = document.getElementById("restock-shortages");

  // Load existing images from localStorage (with fallbacks to previous keys)
  const storedTopFridgeImg = localStorage.getItem("crown_closedown_top_fridge_img") || localStorage.getItem("crown_closedown_back_bar_img");
  if (storedTopFridgeImg && imgTop && btnDelTop) {
    imgTop.src = storedTopFridgeImg;
    imgTop.classList.remove("opacity-0", "scale-95", "pointer-events-none");
    imgTop.classList.add("opacity-100", "scale-100", "pointer-events-auto");
    btnDelTop.classList.remove("opacity-0", "scale-90", "pointer-events-none");
    btnDelTop.classList.add("opacity-100", "scale-100", "pointer-events-auto");
  }

  const storedBeerFridgeImg = localStorage.getItem("crown_closedown_beer_fridge_img") || localStorage.getItem("crown_closedown_cellar_img");
  if (storedBeerFridgeImg && imgBeer && btnDelBeer) {
    imgBeer.src = storedBeerFridgeImg;
    imgBeer.classList.remove("opacity-0", "scale-95", "pointer-events-none");
    imgBeer.classList.add("opacity-100", "scale-100", "pointer-events-auto");
    btnDelBeer.classList.remove("opacity-0", "scale-90", "pointer-events-none");
    btnDelBeer.classList.add("opacity-100", "scale-100", "pointer-events-auto");
  }

  // Load shortages text
  const storedShortages = localStorage.getItem("crown_closedown_shortages");
  if (storedShortages && shortagesTextarea) {
    shortagesTextarea.value = storedShortages;
  }

  // Bind upload actions
  if (inputTop && imgTop && btnDelTop) {
    bindImageUploader(inputTop, imgTop, btnDelTop, "crown_closedown_top_fridge_img");
  }
  if (inputBeer && imgBeer && btnDelBeer) {
    bindImageUploader(inputBeer, imgBeer, btnDelBeer, "crown_closedown_beer_fridge_img");
  }

  // Bind shortages typing
  if (shortagesTextarea) {
    shortagesTextarea.addEventListener("input", (e) => {
      localStorage.setItem("crown_closedown_shortages", e.target.value);
    });
  }

  // Bind Generate Stock Button Click — Live AI Visual Analysis via Gemini
  const btnGenStock = document.getElementById("btn-generate-stock");
  const scanMessage = document.getElementById("scan-message");
  if (btnGenStock) {
    btnGenStock.addEventListener("click", async () => {
      const topImg = localStorage.getItem("crown_closedown_top_fridge_img") || localStorage.getItem("crown_closedown_back_bar_img");
      const beerImg = localStorage.getItem("crown_closedown_beer_fridge_img") || localStorage.getItem("crown_closedown_cellar_img");

      if (!topImg && !beerImg) {
        alert("Please capture/upload at least one fridge photo first to generate the stock needed list.");
        return;
      }

      // Disable button immediately to prevent multi-tapping
      btnGenStock.disabled = true;
      btnGenStock.classList.add("opacity-70");
      btnGenStock.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-950 inline-block" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Analyzing Fridge Photos...</span>
      `;
      if (scanMessage) {
        scanMessage.classList.remove("hidden");
        scanMessage.innerText = "Sending images to Gemini Vision AI for analysis...";
        scanMessage.className = "text-xs text-center text-brass font-semibold mt-2.5 animate-pulse block";
      }

      try {
        // Build parallel fetch requests for each uploaded fridge photo
        const requests = [];
        if (topImg) {
          requests.push(
            fetch("/api/analyze-fridge", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: topImg, fridgeType: "mixer" })
            }).then(r => r.json()).then(data => ({ type: "mixer", data }))
          );
        }
        if (beerImg) {
          requests.push(
            fetch("/api/analyze-fridge", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: beerImg, fridgeType: "beer" })
            }).then(r => r.json()).then(data => ({ type: "beer", data }))
          );
        }

        if (scanMessage) {
          scanMessage.innerText = `Processing ${requests.length} fridge image${requests.length > 1 ? "s" : ""} with Gemini AI...`;
        }

        const results = await Promise.all(requests);

        // Process each result and merge into restockCounts
        let shortagesText = "AI Stock Scan Results:\n";
        let hasError = false;

        results.forEach(result => {
          if (result.data.success && result.data.stock) {
            const stock = result.data.stock;
            Object.entries(stock).forEach(([itemName, count]) => {
              if (count > 0) {
                restockCounts[itemName] = count;
              }
            });

            // Build shortages text from real analysis
            const neededItems = Object.entries(stock).filter(([_, c]) => c > 0);
            if (neededItems.length > 0) {
              const label = result.type === "mixer" ? "Softs/Mixers" : "Beers/Cider";
              const itemList = neededItems.map(([name, c]) => `${name} (x${c})`).join(", ");
              shortagesText += `- ${label}: ${itemList}\n`;
            } else {
              const label = result.type === "mixer" ? "Softs/Mixers" : "Beers/Cider";
              shortagesText += `- ${label}: Fully stocked ✓\n`;
            }
          } else {
            hasError = true;
            const errMsg = result.data.error || "Unknown error";
            shortagesText += `- ${result.type} fridge: Analysis failed (${errMsg})\n`;
          }
        });

        // Save restock counts to localStorage
        localStorage.setItem("crown_closedown_restock_counts", JSON.stringify(restockCounts));

        // Populate shortages notes textarea
        if (shortagesTextarea) {
          shortagesTextarea.value = shortagesText;
          localStorage.setItem("crown_closedown_shortages", shortagesText);
        }

        // Re-render restock grid, update summary panel, and re-validate
        renderRestockGrid();
        validateForm();
        updateStockSummary();

        // Trigger staggered waterfall cascade pulse on active badges
        setTimeout(() => {
          const activeBadges = Array.from(document.querySelectorAll(".count-val")).filter(badge => parseInt(badge.innerText) > 0);
          activeBadges.forEach((badge, idx) => {
            setTimeout(() => {
              badge.classList.add("count-pulse");
              setTimeout(() => {
                badge.classList.remove("count-pulse");
              }, 150);
            }, idx * 60);
          });
        }, 50);

        // Success state update on the button
        btnGenStock.disabled = false;
        btnGenStock.classList.remove("opacity-70");
        btnGenStock.innerHTML = `
          <svg class="w-5 h-5 text-slate-950 flex-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>${hasError ? "Partial Results — Check Notes" : "Stock Generated Successfully!"}</span>
        `;
        if (scanMessage) {
          scanMessage.innerText = hasError
            ? "Some images could not be analyzed. Check the shortages notes for details."
            : "Successfully analyzed fridge contents with Gemini Vision AI.";
          scanMessage.className = `text-xs text-center ${hasError ? "text-amber-400" : "text-green-400"} font-semibold mt-2.5 block transition-all duration-300`;
        }

        // Reset button back to normal after 4 seconds
        setTimeout(() => {
          btnGenStock.innerHTML = `
            <svg class="w-5 h-5 text-slate-950 flex-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096L3 15.187m6 5.813a2 2 0 01-2-2m2 2a2 2 0 002-2m-2 2h-.059M21 3c.969 0 1.371 1.24.588 1.81l-3.96 2.876a1 1 0 00-.374 1.13l1.513 4.654c.299.922-.755 1.688-1.538 1.118l-3.96-2.876a1 1 0 00-1.18 0l-3.96 2.876c-.783.57-1.837-.196-1.538-1.118l1.513-4.654a1 1 0 00-.374-1.13L3.588 4.81C2.805 4.24 3.207 3 4.176 3H21z"/>
            </svg>
            <span>Generate Stock Needed</span>
          `;
          if (scanMessage) scanMessage.classList.add("hidden");
        }, 4000);

      } catch (error) {
        console.error("AI Analysis Network Error:", error);

        // Error state — re-enable button and show error
        btnGenStock.disabled = false;
        btnGenStock.classList.remove("opacity-70");
        btnGenStock.innerHTML = `
          <svg class="w-5 h-5 text-slate-950 flex-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>Analysis Failed — Tap to Retry</span>
        `;
        if (scanMessage) {
          scanMessage.innerText = "Network error or server unavailable. Ensure the server is running and your API key is set.";
          scanMessage.className = "text-xs text-center text-rose-400 font-semibold mt-2.5 block";
        }

        // Reset button after 5 seconds
        setTimeout(() => {
          btnGenStock.innerHTML = `
            <svg class="w-5 h-5 text-slate-950 flex-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096L3 15.187m6 5.813a2 2 0 01-2-2m2 2a2 2 0 002-2m-2 2h-.059M21 3c.969 0 1.371 1.24.588 1.81l-3.96 2.876a1 1 0 00-.374 1.13l1.513 4.654c.299.922-.755 1.688-1.538 1.118l-3.96-2.876a1 1 0 00-1.18 0l-3.96 2.876c-.783.57-1.837-.196-1.538-1.118l1.513-4.654a1 1 0 00-.374-1.13L3.588 4.81C2.805 4.24 3.207 3 4.176 3H21z"/>
            </svg>
            <span>Generate Stock Needed</span>
          `;
          if (scanMessage) scanMessage.classList.add("hidden");
        }, 5000);
      }
    });
  }

  // Render the Quick-Tap Grid
  renderRestockGrid();
  updateStockSummary();
}

function renderRestockGrid() {
  const container = document.getElementById("restock-grid-container");
  if (!container) return;
  container.innerHTML = "";

  RESTOCK_ITEMS_CONFIG.forEach(cat => {
    const catBlock = document.createElement("div");
    catBlock.className = "flex flex-col gap-3";
    catBlock.innerHTML = `
      <h5 class="text-xs font-extrabold uppercase tracking-widest text-brass border-l-2 border-brass pl-2 mt-2">${cat.category.toUpperCase()}</h5>
      <div class="flex flex-col gap-3"></div>
    `;

    const listWrapper = catBlock.querySelector("div");

    cat.items.forEach(itemName => {
      const currentCount = restockCounts[itemName] || 0;
      const isActive = currentCount > 0;

      const itemCard = document.createElement("div");
      itemCard.className = `flex items-center justify-between p-5 rounded-xl border transition-all duration-300 ${
        isActive 
          ? "bg-brass/5 border-brass/50 shadow-md shadow-brass/5" 
          : "bg-slate-900 border-slate-800"
      }`;

      itemCard.innerHTML = `
        <span class="flex-1 min-w-0 pr-4 text-base md:text-lg font-bold ${isActive ? "text-slate-100" : "text-slate-300"} transition-colors duration-200 truncate">${itemName}</span>
        <div class="flex items-center gap-4 select-none flex-none">
          <button type="button" class="btn-dec w-14 h-14 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-black flex items-center justify-center text-2xl transition-all cursor-pointer" aria-label="Decrease count">-</button>
          <span class="count-val inline-block text-2xl font-black w-10 text-center transition-all duration-200 ${isActive ? "text-brass scale-110" : "text-slate-500"}">${currentCount}</span>
          <button type="button" class="btn-inc w-14 h-14 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-brass font-black flex items-center justify-center text-2xl transition-all cursor-pointer" aria-label="Increase count">+</button>
        </div>
      `;

      // Bind click listeners
      const btnDec = itemCard.querySelector(".btn-dec");
      const btnInc = itemCard.querySelector(".btn-inc");
      const countVal = itemCard.querySelector(".count-val");

      btnDec.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        let val = restockCounts[itemName] || 0;
        if (val > 0) {
          val--;
          restockCounts[itemName] = val;
          localStorage.setItem("crown_closedown_restock_counts", JSON.stringify(restockCounts));
          
          countVal.innerText = val;
          
          // Trigger Elastic Pulse feedback
          countVal.classList.add("count-pulse");
          setTimeout(() => {
            countVal.classList.remove("count-pulse");
          }, 150);

          if (val === 0) {
            itemCard.className = "flex items-center justify-between p-5 rounded-xl border border-slate-800 bg-slate-900 transition-all duration-300";
            countVal.className = "count-val inline-block text-2xl font-black w-10 text-center text-slate-500 transition-all duration-200";
            itemCard.querySelector("span").className = "flex-1 min-w-0 pr-4 text-base md:text-lg font-bold text-slate-300 transition-colors duration-200 truncate";
          } else {
            countVal.className = "count-val inline-block text-2xl font-black w-10 text-center text-brass scale-110 transition-all duration-200";
          }
          validateForm();
          updateStockSummary();
        }
      });

      btnInc.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        let val = restockCounts[itemName] || 0;
        val++;
        restockCounts[itemName] = val;
        localStorage.setItem("crown_closedown_restock_counts", JSON.stringify(restockCounts));

        countVal.innerText = val;
        
        // Trigger Elastic Pulse feedback
        countVal.classList.add("count-pulse");
        setTimeout(() => {
          countVal.classList.remove("count-pulse");
        }, 150);

        itemCard.className = "flex items-center justify-between p-5 rounded-xl border border-brass/50 bg-brass/5 shadow-md shadow-brass/5 transition-all duration-300";
        countVal.className = "count-val inline-block text-2xl font-black w-10 text-center text-brass scale-110 transition-all duration-200";
        itemCard.querySelector("span").className = "flex-1 min-w-0 pr-4 text-base md:text-lg font-bold text-slate-100 transition-colors duration-200 truncate";
        validateForm();
        updateStockSummary();
      });

      listWrapper.appendChild(itemCard);
    });

    container.appendChild(catBlock);
  });
  updateStockSummary();
}

function bindImageUploader(inputEl, imgEl, delBtnEl, storageKey) {
  inputEl.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        // Compress and downsample image using canvas to max 1024px dimension
        const canvas = document.createElement("canvas");
        const maxDim = 1024; // max width/height for fast web/WhatsApp uploads
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 JPEG at 0.7 quality to conserve storage and reduce PDF size
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        
        // Save to localStorage
        try {
          localStorage.setItem(storageKey, compressedBase64);
        } catch (error) {
          console.error("Storage write error", error);
          alert("Unable to save photo thumbnail in local cache. Storage might be full.");
        }
        
        // Show in UI with transition
        imgEl.src = compressedBase64;
        imgEl.classList.remove("opacity-0", "scale-95", "pointer-events-none");
        imgEl.classList.add("opacity-100", "scale-100", "pointer-events-auto");
        delBtnEl.classList.remove("opacity-0", "scale-90", "pointer-events-none");
        delBtnEl.classList.add("opacity-100", "scale-100", "pointer-events-auto");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  delBtnEl.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    inputEl.value = "";
    imgEl.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
    imgEl.classList.add("opacity-0", "scale-95", "pointer-events-none");
    delBtnEl.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
    delBtnEl.classList.add("opacity-0", "scale-90", "pointer-events-none");
    
    // Clear src after transition ends to prevent empty flash
    setTimeout(() => {
      if (imgEl.classList.contains("opacity-0")) {
        imgEl.src = "";
      }
    }, 300);
    
    localStorage.removeItem(storageKey);
  });
}

function updateStockSummary() {
  const panel = document.getElementById("stock-summary-panel");
  const list = document.getElementById("stock-summary-list");
  if (!panel || !list) return;

  const items = [];
  RESTOCK_ITEMS_CONFIG.forEach(cat => {
    cat.items.forEach(itemName => {
      const count = restockCounts[itemName] || 0;
      if (count > 0) {
        items.push({ name: itemName, count: count });
      }
    });
  });

  if (items.length === 0) {
    panel.classList.add("hidden");
    list.innerHTML = "";
  } else {
    panel.classList.remove("hidden");
    list.innerHTML = items.map(item => `
      <li class="flex items-center justify-between py-2 border-b border-brass/10 last:border-0 text-slate-200">
        <span class="font-bold text-sm tracking-tight">${item.name}</span>
        <span class="font-extrabold text-brass bg-brass/10 px-3 py-1 rounded-lg border border-brass/25 text-sm">x${item.count}</span>
      </li>
    `).join("");
  }
}
