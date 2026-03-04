/**
 * app.js - 初中化学可视化学习平台核心逻辑 (Premium V2 + Bioicons Style)
 */

// --- 核心 SVG 素材库 (遵循 Bioicons 极简风格: 2px 描边, 科学蓝) ---
const LAB_ICONS = {
    beaker: `
        <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 8v44c0 2.2 1.8 4 4 4h24c2.2 0 4-1.8 4-4V8M14 8h36M16 18h8M16 28h12M16 38h8"/>
        </svg>`,
    burner: `
        <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 56h24M24 56c0-6 2-10 2-16s-4-8-4-12 4-8 10-8 10 4 10 8-4 6-4 12 2 10 2 16M32 20v-8M28 12l4-4 4 4"/>
        </svg>`,
    tube: `
        <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M24 8h16M26 8v42c0 3.3 2.7 6 6 6s6-2.7 6-6V8"/>
        </svg>`,
    flask: `
        <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M26 8h12M30 8v16L16 52c-1 2 0 4 3 4h26c3 0 4-2 3-4L34 24V8"/>
        </svg>`
};

const chemistryData = {
    "atoms": [
        { "id": 1, "name": "氢", "symbol": "H", "protons": 1, "shells": [1], "mass": 1.008 },
        { "id": 2, "name": "氦", "symbol": "He", "protons": 2, "shells": [2], "mass": 4.003 },
        { "id": 3, "name": "锂", "symbol": "Li", "protons": 3, "shells": [2, 1], "mass": 6.941 },
        { "id": 4, "name": "铍", "symbol": "Be", "protons": 4, "shells": [2, 2], "mass": 9.012 },
        { "id": 5, "name": "硼", "symbol": "B", "protons": 5, "shells": [2, 3], "mass": 10.811 },
        { "id": 6, "name": "碳", "symbol": "C", "protons": 6, "shells": [2, 4], "mass": 12.011 },
        { "id": 7, "name": "氮", "symbol": "N", "protons": 7, "shells": [2, 5], "mass": 14.007 },
        { "id": 8, "name": "氧", "symbol": "O", "protons": 8, "shells": [2, 6], "mass": 15.999 },
        { "id": 9, "name": "氟", "symbol": "F", "protons": 9, "shells": [2, 7], "mass": 18.998 },
        { "id": 10, "name": "氖", "symbol": "Ne", "protons": 10, "shells": [2, 8], "mass": 20.180 },
        { "id": 11, "name": "钠", "symbol": "Na", "protons": 11, "shells": [2, 8, 1], "mass": 22.990 },
        { "id": 12, "name": "镁", "symbol": "Mg", "protons": 12, "shells": [2, 8, 2], "mass": 24.305 },
        { "id": 13, "name": "铝", "symbol": "Al", "protons": 13, "shells": [2, 8, 3], "mass": 26.982 },
        { "id": 14, "name": "硅", "symbol": "Si", "protons": 14, "shells": [2, 8, 4], "mass": 28.085 },
        { "id": 15, "name": "磷", "symbol": "P", "protons": 15, "shells": [2, 8, 5], "mass": 30.974 },
        { "id": 16, "name": "硫", "symbol": "S", "protons": 16, "shells": [2, 8, 6], "mass": 32.06 },
        { "id": 17, "name": "氯", "symbol": "Cl", "protons": 17, "shells": [2, 8, 7], "mass": 35.45 },
        { "id": 18, "name": "氩", "symbol": "Ar", "protons": 18, "shells": [2, 8, 8], "mass": 39.948 },
        { "id": 19, "name": "钾", "symbol": "K", "protons": 19, "shells": [2, 8, 8, 1], "mass": 39.098 },
        { "id": 20, "name": "钙", "symbol": "Ca", "protons": 20, "shells": [2, 8, 8, 2], "mass": 40.078 }
    ],
    "molecules": [
        { "id": "h2", "name": "氢气", "formula": "H<sub>2</sub>", "atoms": [{ "element": "H", "pos": [0, 0, 0] }, { "element": "H", "pos": [0, 0, 1] }], "unit": "第四单元" },
        { "id": "o2", "name": "氧气", "formula": "O<sub>2</sub>", "atoms": [{ "element": "O", "pos": [0, 0, 0] }, { "element": "O", "pos": [0, 0, 1.2] }], "unit": "第二单元" },
        { "id": "h2o", "name": "水", "formula": "H<sub>2</sub>O", "atoms": [{ "element": "O", "pos": [0, 0, 0] }, { "element": "H", "pos": [0.75, 0.6, 0] }, { "element": "H", "pos": [-0.75, 0.6, 0] }], "unit": "第四单元" },
        { "id": "co2", "name": "二氧化碳", "formula": "CO<sub>2</sub>", "atoms": [{ "element": "C", "pos": [0, 0, 0] }, { "element": "O", "pos": [1.16, 0, 0] }, { "element": "O", "pos": [-1.16, 0, 0] }], "unit": "第六单元" },
        { "id": "ch4", "name": "甲烷", "formula": "CH<sub>4</sub>", "atoms": [{ "element": "C", "pos": [0, 0, 0] }, { "element": "H", "pos": [0.63, 0.63, 0.63] }, { "element": "H", "pos": [-0.63, -0.63, 0.63] }, { "element": "H", "pos": [-0.63, 0.63, -0.63] }, { "element": "H", "pos": [0.63, -0.63, -0.63] }], "unit": "第七单元" }
    ],
    "reactions": [
        { "id": "p_burn", "name": "红磷燃烧", "equation": "4P + 5O_2 ===(\\text{点燃}) 2P_2O_5", "phenomena": "红磷剧烈燃烧，产生大量白烟，放出热量。", "unit": "第二单元" },
        { "id": "fe_burn", "name": "铁丝在氧气中燃烧", "equation": "3Fe + 2O_2 ===(\\text{点燃}) Fe_3O_4", "phenomena": "剧烈燃烧，火星四射，生成黑色固体。", "unit": "第二单元" },
        { "id": "water_elec", "name": "水的电解", "equation": "2H_2O ===(\\text{通电}) 2H_2\\uparrow + O_2\\uparrow", "phenomena": "正负极产生气泡，体积比约 1:2。", "unit": "第四单元" }
    ]
};

let currentModule = null;
let moleculeViewer = null;
let reactionP5 = null;
let labState = 0;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    switchModule('home');
});

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const modId = item.getAttribute('data-module');
            if (modId) switchModule(modId);
        });
    });

    document.addEventListener('click', (e) => {
        const gotoBtn = e.target.closest('[data-goto]');
        if (gotoBtn) switchModule(gotoBtn.getAttribute('data-goto'));
    });
}

function switchModule(moduleId) {
    if (currentModule === moduleId) return;
    if (reactionP5) { reactionP5.remove(); reactionP5 = null; }
    if (moleculeViewer) { moleculeViewer = null; }

    document.querySelectorAll('.app-module').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const targetModule = document.getElementById(`${moduleId}-module`);
    const targetNav = document.querySelector(`.nav-item[data-module="${moduleId}"]`);

    if (targetModule) targetModule.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    currentModule = moduleId;
    if (moduleId !== 'home') renderModuleContent(moduleId);
}

function renderModuleContent(moduleId) {
    const container = document.getElementById(`${moduleId}-module`);
    if (!container) return;
    container.innerHTML = '';
    switch (moduleId) {
        case 'micro': renderMicroUI(container); break;
        case 'reaction': renderReactionUI(container); break;
        case 'lab': renderLabUI(container); break;
    }
}

// --- 微观世界 UI ---
function renderMicroUI(container) {
    container.innerHTML = `
        <aside class="side-nav">
            <div class="side-title">探索分类</div>
            <div class="nav-list">
                <button class="nav-link-custom active" id="micro-tab-atoms">原子结构</button>
                <button class="nav-link-custom" id="micro-tab-mols">分子模型</button>
            </div>
        </aside>
        <div class="main-content d-flex" id="micro-stage"></div>
    `;
    const tabA = container.querySelector('#micro-tab-atoms');
    const tabM = container.querySelector('#micro-tab-mols');
    tabA.onclick = () => { activateSubTab(tabA); showAtomsInStage(); };
    tabM.onclick = () => { activateSubTab(tabM); showMolsInStage(); };
    showAtomsInStage();
}

function activateSubTab(el) {
    document.querySelectorAll('.nav-link-custom').forEach(l => l.classList.remove('active'));
    el.classList.add('active');
}

function showAtomsInStage() {
    const stage = document.getElementById('micro-stage');
    stage.innerHTML = `
        <div class="list-panel">
            ${chemistryData.atoms.map(a => `<div class="list-item-pro" onclick="updateAtomStage(${a.id})"><div class="symbol-badge">${a.symbol}</div><div><div class="fw-bold">${a.name}</div><div class="small text-muted">原子序数: ${a.id}</div></div></div>`).join('')}
        </div>
        <div class="atom-stage align-items-center justify-content-center">
            <div id="atom-canvas-wrap"></div>
            <div class="infobox-glass mt-5" id="atom-infobox"></div>
        </div>
    `;
    updateAtomStage(1);
}

window.updateAtomStage = (id) => {
    document.querySelectorAll('.list-item-pro').forEach((it, i) => {
        if (chemistryData.atoms[i].id === id) it.classList.add('active');
        else it.classList.remove('active');
    });
    const atom = chemistryData.atoms.find(a => a.id === id);
    const shells = atom.shells.map((e, i) => {
        const r = 65 + i * 45;
        let esStr = '';
        for (let j = 0; j < e; j++) {
            const ang = (j / e) * Math.PI * 2;
            esStr += `<circle cx="${250 + r * Math.cos(ang)}" cy="${250 + r * Math.sin(ang)}" r="6" fill="#1E88E5"><animateTransform attributeName="transform" type="rotate" from="0 250 250" to="360 250 250" dur="${8 + i * 4}s" repeatCount="indefinite"/></circle>`;
        }
        return `<circle cx="250" cy="250" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="4"/>${esStr}`;
    }).join('');
    document.getElementById('atom-canvas-wrap').innerHTML = `<svg viewBox="0 0 500 500" width="380"><circle cx="250" cy="250" r="35" fill="#1E88E5"/><text x="250" y="258" text-anchor="middle" fill="white" font-weight="900" font-size="24">${atom.symbol}</text>${shells}</svg>`;
    document.getElementById('atom-infobox').innerHTML = `<div class="row text-center"><div class="col-4"><h3>${atom.name}</h3><small>名称</small></div><div class="col-4 border-start border-end"><h3>${atom.protons}</h3><small>质子数</small></div><div class="col-4"><h3>${atom.mass}</h3><small>相对质量</small></div></div>`;
};

function showMolsInStage() {
    const stage = document.getElementById('micro-stage');
    stage.innerHTML = `<div class="list-panel">${chemistryData.molecules.map(m => `<div class="list-item-pro" onclick="updateMolStage('${m.id}')"><div class="symbol-badge" style="background: rgba(16,185,129,0.1); color:#10B981">${m.formula.replace(/<[^>]*>/g, '')}</div><div><div class="fw-bold">${m.name}</div><div class="small text-muted">${m.unit}</div></div></div>`).join('')}</div><div id="mol-render-stage" class="flex-grow-1 bg-white"></div>`;
    updateMolStage('h2o');
}

window.updateMolStage = (id) => {
    document.querySelectorAll('.list-item-pro').forEach((it, i) => {
        if (chemistryData.molecules[i].id === id) it.classList.add('active');
        else it.classList.remove('active');
    });
    const mol = chemistryData.molecules.find(m => m.id === id);
    const container = document.getElementById('mol-render-stage');
    container.innerHTML = '';
    moleculeViewer = $3Dmol.createViewer(container, { backgroundColor: 'white' });
    let sdf = `${mol.name}\n\n\n 0 0 0 0 0 0 0 0 0 0999 V2000\n`;
    mol.atoms.forEach(a => sdf += `    ${a.pos[0]}    ${a.pos[1]}    ${a.pos[2]} ${a.element}   0  0  0  0  0  0  0  0  0  0  0  0\n`);
    sdf += "M  END\n";
    moleculeViewer.addModel(sdf, "sdf");
    moleculeViewer.setStyle({}, { stick: { radius: 0.12, color: 'silver' }, sphere: { radius: 0.44 } });
    moleculeViewer.zoomTo(); moleculeViewer.render();
};

// --- 化学反应 UI ---
function renderReactionUI(container) {
    container.innerHTML = `
        <aside class="side-nav">
            <div class="side-title">反应目录</div>
            <div class="nav-list">
                ${chemistryData.reactions.map(r => `<button class="nav-link-custom" onclick="startLegacyReaction('${r.id}', this)">${r.name}</button>`).join('')}
            </div>
        </aside>
        <div class="main-content d-flex flex-column">
            <div id="rx-canvas-wrap" class="flex-grow-1"></div>
            <div class="p-4 bg-white border-top"><div id="rx-eqn" class="h3 fw-black text-primary mb-2"></div><div id="rx-desc" class="small text-muted"></div></div>
        </div>
    `;
    const first = container.querySelector('.nav-link-custom');
    if (first) first.click();
}

window.startLegacyReaction = (id, btn) => {
    document.querySelectorAll('.nav-link-custom').forEach(l => l.classList.remove('active'));
    btn.classList.add('active');
    const rx = chemistryData.reactions.find(x => x.id === id);
    document.getElementById('rx-eqn').innerHTML = `$$${rx.equation}$$`;
    document.getElementById('rx-desc').innerHTML = `<strong>实验现象：</strong>${rx.phenomena}`;
    if (window.MathJax) MathJax.typeset();
    if (reactionP5) reactionP5.remove();
    const container = document.getElementById('rx-canvas-wrap');
    reactionP5 = new p5((p) => {
        let items = [];
        p.setup = () => p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);
        p.draw = () => {
            p.clear();
            p.stroke('#E2E8F0'); p.strokeWeight(3); p.noFill();
            p.rect(p.width / 2 - 100, p.height / 2 - 100, 200, 200, 10);
            p.fill(30, 136, 229, 150); p.noStroke();
            if (p.mouseIsPressed) items.push({ x: p.mouseX, y: p.mouseY, r: p.random(4, 10), s: p.random(2, 4) });
            for (let i = items.length - 1; i >= 0; i--) {
                const b = items[i]; p.circle(b.x, b.y, b.r); b.y -= b.s;
                if (b.y < p.height / 2 - 100) items.splice(i, 1);
            }
        };
    }, container);
};

// --- 虚拟实验室 UI (Bioicons 集成) ---
function renderLabUI(container) {
    container.innerHTML = `
        <aside class="side-nav">
            <div class="side-title">器材库 (Bioicons)</div>
            <div class="nav-list d-grid gap-3" style="grid-template-columns: 1fr 1fr;">
                <div class="lab-item-box" draggable="true" ondragstart="ev_startDrag(event)" id="item-beaker">
                    ${LAB_ICONS.beaker}
                    <span class="small fw-bold mt-2">烧杯</span>
                </div>
                <div class="lab-item-box" draggable="true" ondragstart="ev_startDrag(event)" id="item-tube">
                    ${LAB_ICONS.tube}
                    <span class="small fw-bold mt-2">试管</span>
                </div>
                <div class="lab-item-box" draggable="true" ondragstart="ev_startDrag(event)" id="item-burner">
                    ${LAB_ICONS.burner}
                    <span class="small fw-bold mt-2">酒精灯</span>
                </div>
                <div class="lab-item-box" draggable="true" ondragstart="ev_startDrag(event)" id="item-flask">
                    ${LAB_ICONS.flask}
                    <span class="small fw-bold mt-2">烧瓶</span>
                </div>
            </div>
            <div class="mt-auto p-3 bg-primary bg-opacity-10 rounded-4 text-primary">
                <h6 class="fw-bold mb-1">实验引导</h6>
                <p class="small m-0" id="lab-hint">将所需器材拖放至工作台。</p>
            </div>
        </aside>
        <div class="main-content" id="lab-desk" ondrop="ev_handleDrop(event)" ondragover="ev_handleAllow(event)">
            <div class="placeholder-hint">工作台 (Bioicons 已同步)</div>
        </div>
    `;
}

window.ev_handleAllow = (e) => e.preventDefault();
window.ev_startDrag = (e) => e.dataTransfer.setData("text", e.currentTarget.id);
window.ev_handleDrop = (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text");
    const clone = document.createElement('div');
    clone.className = 'lab-placed-item';
    clone.style.left = (e.offsetX - 32) + 'px';
    clone.style.top = (e.offsetY - 32) + 'px';
    clone.innerHTML = LAB_ICONS[id.split('-')[1]];
    document.getElementById('lab-desk').appendChild(clone);
};
