// ================================
// CONSTANTES PRINCIPAIS
// ================================

// Lista dos atributos do personagem
const abilities = [
  { key: 'FOR', label: 'FOR' },
  { key: 'DES', label: 'DES' },
  { key: 'CON', label: 'CON' },
  { key: 'INT', label: 'INT' },
  { key: 'SAB', label: 'SAB' },
  { key: 'CAR', label: 'CAR' },
];

// Lista das perícias e seu atributo principal
const skills = [
  ['Acrobacia', 'DES'], ['Adestramento', 'CAR'], ['Atletismo', 'FOR'],
  ['Atuação', 'CAR'], ['Cavalgar', 'DES'], ['Conhecimento', 'INT'],
  ['Cura', 'SAB'], ['Diplomacia', 'CAR'], ['Enganação', 'CAR'],
  ['Fortitude', 'CON'], ['Furtividade', 'DES'], ['Guerra', 'INT'],
  ['Identificar Magia', 'INT'], ['Iniciativa', 'DES'], ['Intuição', 'SAB'],
  ['Intimidação', 'CAR'], ['Investigação', 'INT'], ['Ladinagem', 'DES'],
  ['Luta', 'FOR'], ['Misticismo', 'INT'], ['Nobreza', 'INT'],
  ['Ofício', 'INT'], ['Percepção', 'SAB'], ['Pontaria', 'DES'],
  ['Reflexos', 'DES'], ['Vontade', 'SAB'], ['Sobrevivência', 'SAB'],
];

// Chave usada para salvar os dados no navegador
const storageKey = 'tormenta_rpg_ficha_v2';
const fichasListKey = 'tormenta_rpg_fichas_v2';
const selectedFichaIdKey = 'tormenta_rpg_selected_ficha_id';
let currentFichaId = null;

// Pega o formulário principal da ficha
const form = document.getElementById('characterSheet');

function loadFichasList() {
  const raw = localStorage.getItem(fichasListKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFichasList(list) {
  localStorage.setItem(fichasListKey, JSON.stringify(list));
}

function findFichaById(id) {
  if (!id) return null;
  return loadFichasList().find(ficha => ficha.id === id) || null;
}

function collectFormData() {
  const data = {};
  form.querySelectorAll('input, textarea, select').forEach(el => {
    const key = el.name || el.id;
    if (!key) return;
    if (el.type === 'checkbox') {
      data[key] = el.checked;
    } else {
      data[key] = el.value;
    }
  });
  return data;
}

function populateForm(data) {
  // Valores padrão para campos vazios
  const defaults = {
    // Atributos
    FOR: '10', DES: '10', CON: '10', INT: '10', SAB: '10', CAR: '10',
    // Recursos
    pv: '0', pm: '0', ca: '0', deslocamento: '9 m',
    // Defesas
    bba: '0', iniciativa: '0', fortitude: '0', reflexos: '0',
    // Extras
    vontade: '0', percepcao: '0', carga: 'Leve, média, pesada', dinheiro: 'T$ / moedas', ponto_acao: '0',
    // Ataques corpo-a-corpo (exemplos)
    cc_nome_1: 'Arma 1', cc_nome_2: 'Arma 2', cc_nome_3: 'Arma 3',
    // Ataques à distância
    dist_nome_1: 'Arma 1', dist_nome_2: 'Arma 2', dist_nome_3: 'Arma 3',
    // Armas (inventário)
    arm_nome_1: 'Arma 1', arm_nome_2: 'Arma 2', arm_nome_3: 'Arma 3',
    arm_nome_4: 'Arma 4', arm_nome_5: 'Arma 5', arm_nome_6: 'Arma 6',
    arm_nome_7: 'Arma 7', arm_nome_8: 'Arma 8',
    // Armaduras
    armadura_nome_1: 'Armadura 1', armadura_nome_2: 'Armadura 2', armadura_nome_3: 'Armadura 3',
    armadura_nome_4: 'Armadura 4', armadura_nome_5: 'Armadura 5',
    // Marcadores (checkboxes)
    marcador_1: false, marcador_2: false, marcador_3: false, marcador_4: false, marcador_5: false, marcador_6: false,
    marcador_1_obs: 'Marcador ou observação', marcador_2_obs: 'Marcador ou observação', marcador_3_obs: 'Marcador ou observação',
    marcador_4_obs: 'Marcador ou observação', marcador_5_obs: 'Marcador ou observação', marcador_6_obs: 'Marcador ou observação',
    // Textareas
    habilidades_raca: 'Descreva as habilidades de raça aqui...',
    habilidades_classe: 'Descreva as habilidades de classe aqui...',
    equipamentos_inventario: 'Itens, poções, munição, ferramentas...',
    observacoes: 'Anotações gerais, contatos, objetivos, etc.',
  };

  // Perícias defaults (todos 0)
  skills.forEach((_, idx) => {
    defaults[`skill_bonus_${idx}`] = '0';
    defaults[`skill_grad_${idx}`] = '0';
    defaults[`skill_mod_${idx}`] = '0';
  });

  // Aplicar dados ou defaults
  form.querySelectorAll('input, textarea, select').forEach(el => {
    const key = el.name || el.id;
    if (!key) return;
    const value = data[key] !== undefined ? data[key] : defaults[key];
    if (el.type === 'checkbox') {
      el.checked = value;
    } else {
      el.value = value;
    }
  });
}

async function saveFile(blob, filename) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'Ficha Tormenta JSON',
          accept: { 'application/json': ['.json'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      showNotification('Ficha salva no computador.', 'success');
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showNotification('Download iniciado. Verifique a pasta de downloads.', 'success');
}

function persistFichaInList(data, options = { createIfMissing: false }) {
  const fichas = loadFichasList();
  const index = currentFichaId ? fichas.findIndex(item => item.id === currentFichaId) : -1;

  if (index >= 0) {
    fichas[index] = {
      ...fichas[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    saveFichasList(fichas);
    return;
  }

  if (!options.createIfMissing) return;

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ficha = {
    id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  fichas.unshift(ficha);
  saveFichasList(fichas);
  currentFichaId = id;
  localStorage.setItem(selectedFichaIdKey, id);
}

function loadSelectedFicha() {
  const selectedId = localStorage.getItem(selectedFichaIdKey);
  if (!selectedId) return false;
  const ficha = findFichaById(selectedId);
  if (!ficha) {
    localStorage.removeItem(selectedFichaIdKey);
    return false;
  }
  currentFichaId = selectedId;
  populateForm(ficha);
  showNotification('Ficha carregada da lista.', 'success');
  return true;
}

function exportFichaFile() {
  const data = collectFormData();
  const fileName = `ficha-${(data.personagem || 'sem-nome').replace(/[^a-zA-Z0-9-_]/g, '_')}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveFile(blob, fileName);
}

// ================================
// MODAL CUSTOMIZADO
// ================================
// Substitui alert() e confirm() por uma janela mais bonita
function createModal({
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  type = "warning"
}) {
  // Fundo escuro atrás do modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(6px);
    animation: fadeIn .25s ease;
  `;

  // Caixa principal do modal
  const modal = document.createElement('div');
  modal.className = 'modal-box';
  modal.style.cssText = `
    background: linear-gradient(180deg, #fff 0%, #f9f8f6 100%);
    padding: 28px 24px;
    border-radius: 24px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 20px 80px rgba(0,0,0,.2);
    animation: slideUp .3s ease;
  `;

  // Ícones simples conforme o tipo do modal
  const iconMap = {
    warning: '⚠️',
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  const icon = iconMap[type] || '⚠️';

  // Conteúdo interno do modal
  modal.innerHTML = `
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:40px;margin-bottom:12px;">${icon}</div>
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#111;">${title}</h2>
    </div>

    <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.5;text-align:center;">
      ${message}
    </p>

    <div style="display:flex;gap:12px;justify-content:center;">
      <button id="cancelBtn" style="padding:12px 20px;border-radius:999px;border:1.5px solid #ddd;background:#fff;cursor:pointer;font-weight:700;font-size:14px;transition:all .2s;color:#555;">
        ${cancelText}
      </button>
      <button id="confirmBtn" style="padding:12px 24px;border-radius:999px;border:0;background:#111;color:#fff;font-weight:800;cursor:pointer;font-size:14px;transition:all .2s;letter-spacing:.3px;">
        ${confirmText}
      </button>
    </div>
  `;

  // Cria as animações do modal apenas uma vez
  if (!document.querySelector('style[data-modal-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-modal-animations', 'true');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .modal-overlay { animation: fadeIn .25s ease; }
      .modal-box { animation: slideUp .3s ease; }
      button:hover { transform: translateY(-1px); }
      button:active { transform: translateY(0); }
    `;
    document.head.appendChild(style);
  }

  // Adiciona o modal na página
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Seleciona os botões
  const cancelBtn = modal.querySelector('#cancelBtn');
  const confirmBtn = modal.querySelector('#confirmBtn');

  // Efeito visual no botão cancelar
  cancelBtn.addEventListener('mouseover', () => cancelBtn.style.background = '#f5f5f5');
  cancelBtn.addEventListener('mouseout', () => cancelBtn.style.background = '#fff');

  // Efeito visual no botão confirmar
  confirmBtn.addEventListener('mouseover', () => confirmBtn.style.background = '#2e2e2e');
  confirmBtn.addEventListener('mouseout', () => confirmBtn.style.background = '#111');

  // Fecha o modal ao clicar em cancelar
  cancelBtn.onclick = () => {
    overlay.style.animation = 'fadeIn .25s ease reverse';
    setTimeout(() => overlay.remove(), 200);
  };

  // Confirma a ação e fecha o modal
  confirmBtn.onclick = () => {
    overlay.style.animation = 'fadeIn .25s ease reverse';
    setTimeout(() => {
      overlay.remove();
      if (onConfirm) onConfirm();
    }, 200);
  };

  // Fecha o modal se clicar fora da caixa
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.animation = 'fadeIn .25s ease reverse';
      setTimeout(() => overlay.remove(), 200);
    }
  });

  // Fecha o modal com a tecla ESC
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      overlay.style.animation = 'fadeIn .25s ease reverse';
      setTimeout(() => {
        overlay.remove();
        document.removeEventListener('keydown', handleEsc);
      }, 200);
    }
  };

  document.addEventListener('keydown', handleEsc);
}

// ================================
// FUNÇÃO: CALCULAR MODIFICADOR
// ================================
// Converte o valor do atributo em modificador
const clampMod = (score) => {
  const n = Number(score);

  // Se não for número, retorna vazio
  if (!Number.isFinite(n)) return '';

  // Fórmula do modificador
  const mod = Math.floor((n - 10) / 2);

  // Mostra sinal de + quando positivo
  return mod >= 0 ? `+${mod}` : String(mod);
};

// ================================
// FUNÇÃO: MONTAR ATRIBUTOS
// ================================
// Cria os blocos FOR, DES, CON, INT, SAB, CAR
function buildAbilities() {
  const container = document.getElementById('abilities');

  container.innerHTML = abilities.map(a => `
    <div class="ability">
      <div class="abbr">${a.label}</div>
      <input class="score" type="number" id="${a.key}" data-ability-score="${a.key}" placeholder="10" />
        <div class="mod-label">Modificador</div>
      <input class="mod" type="text" id="${a.key}_mod" data-ability-mod="${a.key}" data-auto-mod="true" title="Cálculo automático a partir do atributo; edite manualmente se quiser" />
    </div>
  `).join('');
}

// ================================
// FUNÇÃO: MONTAR PERÍCIAS
// ================================
// Cria a lista de perícias com bônus, graduação, mod e total
function buildSkills() {
  const body = document.getElementById('skillsBody');

  body.innerHTML = skills.map(([name, attr], idx) => `
    <div class="skill-row">
      <div>
        <div class="skill-name">${name}</div>
        <div class="skill-attr">${attr}</div>
      </div>
      <div><input type="number" id="skill_bonus_${idx}" data-skill-bonus="${idx}" /></div>
      <div><input type="number" id="skill_grad_${idx}" data-skill-grad="${idx}" /></div>
      <div><input type="number" id="skill_mod_${idx}" data-skill-mod="${idx}" /></div>
      <div><input type="number" id="skill_total_${idx}" data-skill-total="${idx}" readonly /></div>
    </div>
  `).join('');
}

// ================================
// FUNÇÃO: MONTAR LINHAS DINÂMICAS
// ================================
// Cria linhas para armas ou armaduras
function buildDynamicRows(containerId, count, prefix, kind) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  for (let i = 1; i <= count; i++) {
    const row = document.createElement('div');
    row.className = 'grid-row';

    row.innerHTML = kind === 'armas'
      ? `
        <div><input name="${prefix}_nome_${i}" placeholder="Arma ${i}" /></div>
        <div><input name="${prefix}_tipo_${i}" /></div>
        <div><input name="${prefix}_dano_${i}" /></div>
        <div><input name="${prefix}_crit_${i}" /></div>
        <div><input name="${prefix}_alcance_${i}" /></div>
        <div><input name="${prefix}_obs_${i}" /></div>
      `
      : `
        <div><input name="${prefix}_nome_${i}" placeholder="Armadura ${i}" /></div>
        <div><input name="${prefix}_tipo_${i}" /></div>
        <div><input name="${prefix}_ca_${i}" /></div>
        <div><input name="${prefix}_maxdes_${i}" /></div>
        <div><input name="${prefix}_pen_${i}" /></div>
        <div><input name="${prefix}_obs_${i}" /></div>
      `;

    container.appendChild(row);
  }
}

// ================================
// FUNÇÃO: ATUALIZAR MODIFICADORES
// ================================
// Atualiza o modificador de cada atributo quando o score muda
function updateAbilityMods() {
  abilities.forEach(a => {
    const scoreEl = document.querySelector(`[data-ability-score="${a.key}"]`);
    const modEl = document.querySelector(`[data-ability-mod="${a.key}"]`);

    if (scoreEl && modEl) {
      const autoMod = modEl.dataset.autoMod !== 'false';
      const computed = clampMod(scoreEl.value);

      if (autoMod) {
        modEl.value = computed;
        modEl.dataset.autoMod = 'true';
      }
    }
  });
}

// ================================
// FUNÇÃO: ATUALIZAR PERÍCIAS
// ================================
// Soma bônus + graduação + modificador
function updateSkillTotals() {
  skills.forEach((_, idx) => {
    const bonus = Number(document.querySelector(`[data-skill-bonus="${idx}"]`)?.value || 0);
    const grad = Number(document.querySelector(`[data-skill-grad="${idx}"]`)?.value || 0);
    const mod = Number(document.querySelector(`[data-skill-mod="${idx}"]`)?.value || 0);

    const total = document.querySelector(`[data-skill-total="${idx}"]`);
    if (total) {
      total.value = bonus + grad + mod;
    }
  });
}

// ================================
// FUNÇÃO: SALVAR AUTOMATICAMENTE
// ================================
// Salva tudo no navegador enquanto o usuário preenche
// IMPORTANTE: Os dados são salvos automaticamente a cada mudança
// e persistem no navegador até que o usuário clique em "Limpar ficha"
function autoSave() {
  const data = {};

  form.querySelectorAll('input, textarea, select').forEach(el => {
    const key = el.name || el.id;
    if (!key) return;

    data[key] = el.type === 'checkbox' ? el.checked : el.value;
  });

  localStorage.setItem(storageKey, JSON.stringify(data));
  if (currentFichaId) {
    persistFichaInList(data, { createIfMissing: false });
  }
}

// ================================
// FUNÇÃO: RESTAURAR DADOS
// ================================
// Recupera os dados salvos no navegador
function restore() {
  if (loadSelectedFicha()) {
    updateAbilityMods();
    updateSkillTotals();
    return;
  }

  const raw = localStorage.getItem(storageKey);
  if (!raw) return;

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }

  form.querySelectorAll('input, textarea, select').forEach(el => {
    const key = el.name || el.id;
    if (!key || !(key in data)) return;

    if (el.type === 'checkbox') {
      el.checked = data[key];
    } else {
      el.value = data[key];
    }
  });
}

// ================================
// FUNÇÃO: SALVAR FICHA
// ================================
// Salva manualmente todos os dados no navegador com notificação visual
function saveSheet() {
  // Salva os dados locais e também no histórico de fichas
  autoSave();
  persistFichaInList(collectFormData(), { createIfMissing: true });
  showNotification("Ficha salva com sucesso!", "success");
}

// ================================
// FUNÇÃO: LIMPAR FICHA
// ================================
// Abre confirmação antes de apagar tudo
function clearSheet() {
  createModal({
    title: "Limpar ficha",
    message: "Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.",
    confirmText: "Sim, limpar",
    cancelText: "Cancelar",
    type: "warning",
    onConfirm: () => {
      localStorage.removeItem(storageKey);
      form.reset();
      updateAbilityMods();
      updateSkillTotals();
      showNotification("Ficha limpa com sucesso!", "success");
    }
  });
}

// ================================
// NOTIFICAÇÃO RÁPIDA
// ================================
// Mostra uma mensagem pequena no canto da tela
function showNotification(message, type = "success") {
  const notification = document.createElement('div');

  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 14px 18px;
    border-radius: 10px;
    font-weight: 700;
    box-shadow: 0 8px 24px rgba(0,0,0,.2);
    z-index: 9998;
    animation: slideIn .3s ease;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  // Cria a animação da notificação apenas uma vez
  if (!document.querySelector('style[data-notification-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-notification-animations', 'true');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // Remove a notificação depois de alguns segundos
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ================================
// INICIALIZAÇÃO
// ================================
// Monta tudo na tela
buildAbilities();
buildSkills();
buildDynamicRows('armasRows', 8, 'arm', 'armas');
buildDynamicRows('armadurasRows', 5, 'armadura', 'armaduras');

// Restaura os dados salvos
restore();

// Atualiza os cálculos iniciais
updateAbilityMods();
updateSkillTotals();

// ================================
// EVENTOS
// ================================
// Atualiza cálculos e salva enquanto o usuário digita
form.addEventListener('input', (e) => {
  if (e.target.matches('[data-ability-score]')) {
    updateAbilityMods();
  }

    if (e.target.matches('[data-ability-mod]')) {
      const scoreEl = document.querySelector(`[data-ability-score="${e.target.dataset.abilityMod}"]`);
      const computed = scoreEl ? clampMod(scoreEl.value) : '';
      if (e.target.value === '' || e.target.value === computed) {
        e.target.dataset.autoMod = 'true';
        if (computed) e.target.value = computed;
      } else {
        e.target.dataset.autoMod = 'false';
      }
    }

});

// Salva também quando algum campo perde o foco ou muda
form.addEventListener('change', autoSave);

// Botão de salvar ficha (salva manualmente com notificação)
document.getElementById('btnSave').addEventListener('click', saveSheet);

// Atalho Ctrl+S para salvar ficha
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault(); // Evita o save do navegador
    saveSheet();
  }
});

// Botão de exportar para o computador
document.getElementById('btnExport').addEventListener('click', exportFichaFile);

// Botão de limpar ficha
document.getElementById('btnClear').addEventListener('click', clearSheet);