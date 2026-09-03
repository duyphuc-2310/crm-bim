// ================================================
// Kanban Board Component
// ================================================
let draggedDealId = null;
let draggedStage = null;

async function renderKanban() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="page-filters">
      <button class="btn btn-primary" onclick="openAddDealModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm Deal mới
      </button>
      <span style="font-size:12px;color:var(--text-muted)">Kéo thả card để chuyển giai đoạn</span>
    </div>
    <div class="kanban-wrapper">
      <div class="kanban-board" id="kanban-board">
        <div class="loading"><div class="spinner"></div> Đang tải...</div>
      </div>
    </div>
  `;
  loadKanban();
}

async function loadKanban() {
  const board = document.getElementById('kanban-board');
  if (!board) return;
  try {
    const { data } = await api.getKanban();
    board.innerHTML = data.map(col => renderKanbanColumn(col)).join('');
    initDragDrop();
  } catch (err) {
    board.innerHTML = `<div class="empty-state"><p>Lỗi: ${err.message}</p></div>`;
  }
}

function renderKanbanColumn(col) {
  const colors = ['','#6366f1','#8b5cf6','#06b6d4','#f59e0b','#f97316','#ef4444','#10b981'];
  const color = colors[col.id] || '#6366f1';
  return `
    <div class="kanban-column" data-stage="${col.id}">
      <div class="kanban-col-header">
        <div class="kanban-col-title">
          <span class="stage-dot" style="background:${color}"></span>
          ${col.name}
        </div>
        <div class="kanban-stats">
          <span class="kanban-count">${col.count} deal</span>
          ${col.total_value > 0 ? `<span class="kanban-value">${formatCurrency(col.total_value)}</span>` : ''}
        </div>
      </div>
      <div class="kanban-cards drop-zone" data-stage="${col.id}">
        ${col.deals.filter(d => d.status === 'open').map(d => renderKanbanCard(d, color)).join('')}
        ${col.deals.filter(d => d.status !== 'open').map(d => renderKanbanCard(d, color, true)).join('')}
      </div>
      <div class="kanban-add-btn" onclick="openAddDealModal(${col.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm deal
      </div>
    </div>
  `;
}

function renderKanbanCard(deal, color, closed = false) {
  const followupDate = deal.next_followup_date;
  const overdue = followupDate && isOverdue(followupDate);
  const today = followupDate && isToday(followupDate);
  let dateClass = overdue ? 'overdue' : '';
  let dateLabel = followupDate ? `📅 ${formatDate(followupDate)}${overdue ? ' ⚠️' : today ? ' 🔔' : ''}` : '';
  
  const statusBadge = closed ? (deal.status === 'won' ? '<span class="badge badge-green">✅ Thắng</span>' : '<span class="badge badge-red">❌ Thua</span>') : '';
  
  const probColor = deal.probability >= 70 ? 'var(--green)' : deal.probability >= 40 ? 'var(--yellow)' : 'var(--text-muted)';
  
  return `
    <div class="kanban-card ${closed ? 'opacity-50' : ''}" 
         style="--card-color:${color};${closed ? 'opacity:0.5' : ''}"
         data-deal-id="${deal.id}"
         draggable="${!closed}"
         onclick="openDealDetail(${deal.id})"
    >
      <div class="kc-title">${deal.title}</div>
      <div class="kc-company">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        ${deal.contact_name}${deal.contact_company ? ' · ' + deal.contact_company : ''}
      </div>
      <div class="kc-tags">
        ${deal.product_name ? `<span class="badge badge-accent">${deal.product_name}</span>` : ''}
        ${statusBadge}
      </div>
      <div class="kc-footer">
        <div>
          <div class="kc-value">${formatCurrency(deal.estimated_value)}</div>
          ${deal.probability ? `<div style="font-size:10px;color:${probColor}">${deal.probability}% xác suất</div>` : ''}
        </div>
        <div class="kc-date ${dateClass}">${dateLabel}</div>
      </div>
      ${deal.probability ? `
        <div class="progress-bar" style="margin-top:8px">
          <div class="progress-fill" style="width:${deal.probability}%;background:${probColor}"></div>
        </div>
      ` : ''}
    </div>
  `;
}

function initDragDrop() {
  const cards = document.querySelectorAll('.kanban-card[draggable="true"]');
  const zones = document.querySelectorAll('.drop-zone');

  cards.forEach(card => {
    card.addEventListener('dragstart', e => {
      draggedDealId = card.dataset.dealId;
      draggedStage = card.closest('.kanban-column').dataset.stage;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
    });
  });

  zones.forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', async e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const newStage = Number(zone.dataset.stage);
      const oldStage = Number(draggedStage);
      if (!draggedDealId || newStage === oldStage) return;
      try {
        await api.updateDealStage(draggedDealId, newStage);
        showToast(`Chuyển sang: ${STAGE_NAMES[newStage]}`, 'success');
        loadKanban();
      } catch(err) {}
    });
  });
}
