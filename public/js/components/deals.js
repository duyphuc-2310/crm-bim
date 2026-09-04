// ================================================
// Deals Component
// ================================================
async function renderDeals() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="page-filters">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" id="deal-search" placeholder="Tìm kiếm deal..." oninput="filterDeals()">
      </div>
      <select class="filter-select" id="deal-stage-filter" onchange="filterDeals()">
        <option value="">Tất cả giai đoạn</option>
        ${STAGE_NAMES.slice(1).map((n,i)=>`<option value="${i+1}">${n}</option>`).join('')}
      </select>
      <select class="filter-select" id="deal-status-filter" onchange="filterDeals()">
        <option value="open">Đang mở</option>
        <option value="won">Đã thắng</option>
        <option value="lost">Đã thua</option>
        <option value="">Tất cả</option>
      </select>
      <button class="btn btn-primary" onclick="openAddDealModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm Deal
      </button>
    </div>
    <div class="card">
      <div class="data-table-wrap">
        <table id="deals-table">
          <thead><tr>
            <th>Tên Deal</th><th>Khách hàng</th><th>Sản phẩm</th>
            <th>Giai đoạn</th><th>Giá trị</th><th>Xác suất</th>
            <th>Follow-up</th><th>Cập nhật</th><th></th>
          </tr></thead>
          <tbody id="deals-tbody">
            <tr><td colspan="9"><div class="loading"><div class="spinner"></div></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  loadDealsTable();
}

let allDeals = [];

async function loadDealsTable() {
  try {
    const statusFilter = document.getElementById('deal-status-filter');
    const status = statusFilter ? statusFilter.value : 'open';
    const q = status ? `?status=${status}` : '?status=all';
    // Fetch all statuses
    const [open, won, lost] = await Promise.all([
      api.getDeals('?status=open'),
      api.getDeals('?status=won'),
      api.getDeals('?status=lost')
    ]);
    allDeals = [...open.data, ...won.data, ...lost.data];
    filterDeals();
  } catch (err) {
    document.getElementById('deals-tbody').innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">Lỗi tải dữ liệu</td></tr>`;
  }
}

function filterDeals() {
  const search = (document.getElementById('deal-search')?.value || '').toLowerCase();
  const stage = document.getElementById('deal-stage-filter')?.value || '';
  const status = document.getElementById('deal-status-filter')?.value || '';

  let deals = allDeals;
  if (search) deals = deals.filter(d =>
    d.title.toLowerCase().includes(search) ||
    (d.contact_name||'').toLowerCase().includes(search) ||
    (d.contact_company||'').toLowerCase().includes(search) ||
    (d.product_name||'').toLowerCase().includes(search)
  );
  if (stage) deals = deals.filter(d => String(d.stage) === stage);
  if (status) deals = deals.filter(d => d.status === status);

  renderDealsTable(deals);
}

function renderDealsTable(deals) {
  const tbody = document.getElementById('deals-tbody');
  if (!tbody) return;
  if (deals.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon">📦</div><h3>Không có deal nào</h3><p>Thêm deal mới để bắt đầu theo dõi</p></div></td></tr>`;
    return;
  }
  const color = (stage) => STAGE_COLORS[stage] || '#6366f1';
  tbody.innerHTML = deals.map(d => {
    const overdue = d.next_followup_date && isOverdue(d.next_followup_date) && d.status === 'open';
    const today = d.next_followup_date && isToday(d.next_followup_date);
    const probColor = d.probability >= 70 ? 'var(--green)' : d.probability >= 40 ? 'var(--yellow)' : 'var(--text-muted)';
    const statusBadge = d.status === 'won' ? '<span class="badge badge-green">✅ Thắng</span>' :
                        d.status === 'lost' ? '<span class="badge badge-red">❌ Thua</span>' : '';
    return `
      <tr onclick="openDealDetail(${d.id})" style="cursor:pointer">
        <td>
          <div style="font-weight:600">${d.title}</div>
          ${statusBadge}
        </td>
        <td>
          <div style="font-weight:500">${d.contact_name}</div>
          <div class="td-muted">${d.contact_company || ''}</div>
        </td>
        <td>${d.product_name ? `<span class="badge badge-accent">${d.product_name}</span>` : '<span class="td-muted">—</span>'}</td>
        <td>
          <span class="badge" style="background:${color(d.stage)}22;color:${color(d.stage)}">
            ${STAGE_NAMES[d.stage] || '—'}
          </span>
        </td>
        <td><span style="font-weight:700;color:var(--green)">${formatCurrency(d.estimated_value)}</span></td>
        <td>
          <span style="font-weight:700;color:${probColor}">${d.probability || 0}%</span>
          <div class="progress-bar" style="margin-top:4px;width:60px"><div class="progress-fill" style="width:${d.probability||0}%;background:${probColor}"></div></div>
        </td>
        <td>
          <span ${overdue ? 'style="color:var(--red);font-weight:600"' : today ? 'style="color:var(--yellow);font-weight:600"' : ''}>
            ${d.next_followup_date ? formatDate(d.next_followup_date) : '—'}
            ${overdue ? ' ⚠️' : today ? ' 🔔' : ''}
          </span>
        </td>
        <td class="td-muted">${timeAgo(d.updated_at)}</td>
        <td onclick="event.stopPropagation()">
          <div style="display:flex;gap:4px">
            <button class="btn btn-icon btn-ghost btn-sm" onclick="openEditDealModal(${d.id})" title="Sửa">✏️</button>
            <button class="btn btn-icon btn-danger btn-sm" onclick="deleteDeal(${d.id})" title="Xóa">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function openDealDetail(id) {
  try {
    const { data } = await api.getDeal(id);
    const color = STAGE_COLORS[data.stage] || '#6366f1';
    openModal('Thông tin Deal', `
      <div class="deal-detail-header">
        <div style="flex:1">
          <h2 style="font-size:18px;font-weight:800;margin-bottom:6px">${data.title}</h2>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="badge" style="background:${color}22;color:${color}">${STAGE_NAMES[data.stage]}</span>
            ${data.status === 'won' ? '<span class="badge badge-green">✅ Đã thắng</span>' : data.status === 'lost' ? '<span class="badge badge-red">❌ Đã thua</span>' : '<span class="badge badge-accent">🔄 Đang mở</span>'}
            ${data.product_name ? `<span class="badge badge-purple">${data.product_name}</span>` : ''}
          </div>
        </div>
        <div class="deal-detail-actions">
          <button class="btn btn-ghost btn-sm" onclick="openEditDealModal(${id});closeModal()">✏️ Sửa</button>
          <button class="btn btn-ghost btn-sm" onclick="openQuoteModal(${id})" style="color:var(--cyan)">📄 Báo giá</button>
          ${data.status === 'open' ? `
            <button class="btn btn-success btn-sm" onclick="changeDealStatus(${id},'won')">✅ Thắng</button>
            <button class="btn btn-danger btn-sm" onclick="changeDealStatus(${id},'lost')">❌ Thua</button>
          ` : ''}
        </div>
      </div>

      <!-- Stage progress -->
      <div class="stage-steps">
        ${STAGE_NAMES.slice(1).map((n,i) => `
          <div class="stage-step ${data.stage > i ? 'done' : ''} ${data.stage === i+1 ? 'active' : ''}" 
               onclick="quickUpdateStage(${id}, ${i+1})">${n}</div>
        `).join('')}
      </div>

      <!-- Info grid -->
      <div class="form-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">KHÁCH HÀNG</div>
          <div style="font-weight:600">${data.contact_name}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${data.contact_company || ''}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${data.contact_phone || ''}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">GIÁ TRỊ ƯỚC TÍNH</div>
          <div style="font-size:24px;font-weight:800;color:var(--green)">${formatCurrency(data.estimated_value)}</div>
          <div style="font-size:12px;color:var(--text-secondary)">Xác suất chốt: <strong style="color:${data.probability>=70?'var(--green)':data.probability>=40?'var(--yellow)':'var(--text-muted)'}">${data.probability}%</strong></div>
        </div>
      </div>
      
      <div style="margin-bottom:16px; background:var(--bg-lighter); padding:12px; border-radius:8px;">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">SẢN PHẨM TRONG DEAL</div>
        ${data.products && data.products.length > 0 ? 
          data.products.map(p => `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px;">
              <span style="font-weight:500;">• ${p.name}</span>
              <span style="color:var(--text-secondary);">${formatCurrency(p.price)}</span>
            </div>
          `).join('') 
          : '<div style="font-size:13px; color:var(--text-muted)">Không có sản phẩm</div>'
        }
      </div>

      <div class="form-row" style="margin-bottom:16px">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">FOLLOW-UP TIẾP THEO</div>
          <div style="font-weight:600;color:${data.next_followup_date && isOverdue(data.next_followup_date)?'var(--red)':'var(--text-primary)'}">${formatDate(data.next_followup_date)}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">CẬP NHẬT LẦN CUỐI</div>
          <div style="font-weight:600">${formatDateTime(data.updated_at)}</div>
        </div>
      </div>
      ${data.notes ? `<div style="background:var(--bg-input);border-radius:8px;padding:12px;font-size:13px;color:var(--text-secondary);margin-bottom:16px">${data.notes}</div>` : ''}

      <!-- Tabs: Activities & Followups -->
      <div class="tabs">
        <div class="tab active" onclick="switchTab('deal-activities')">📋 Lịch sử trao đổi (${data.activities.length})</div>
        <div class="tab" onclick="switchTab('deal-followups')">🔔 Nhắc việc (${data.followups.length})</div>
      </div>
      <div class="tab-content active" id="deal-activities">
        <button class="btn btn-ghost btn-sm" style="margin-bottom:12px" onclick="openAddActivityModal(${id}, ${data.contact_id})">+ Ghi chú hoạt động</button>
        ${data.activities.length === 0 ? '<div class="empty-state" style="padding:20px"><p>Chưa có hoạt động nào</p></div>' :
          data.activities.map(a => `
            <div class="activity-item">
              <div class="activity-dot" style="background:rgba(99,102,241,0.15)">
                ${ACTIVITY_TYPE_LABELS[a.activity_type]?.split(' ')[0] || '📝'}
              </div>
              <div class="activity-content">
                <div class="activity-title">${ACTIVITY_TYPE_LABELS[a.activity_type] || a.activity_type} · ${formatDateTime(a.activity_date)}</div>
                <div style="font-size:12px;margin-top:2px">${a.content}</div>
                ${a.result ? `<div style="font-size:11px;color:var(--green);margin-top:2px">→ ${a.result}</div>` : ''}
              </div>
              <button class="btn btn-icon btn-ghost btn-sm" onclick="deleteActivity(${a.id}, ${id})" title="Xóa">🗑️</button>
            </div>
          `).join('')
        }
      </div>
      <div class="tab-content" id="deal-followups">
        <button class="btn btn-ghost btn-sm" style="margin-bottom:12px" onclick="openAddFollowupModal(${id}, ${data.contact_id})">+ Thêm nhắc việc</button>
        ${data.followups.length === 0 ? '<div class="empty-state" style="padding:20px"><p>Chưa có nhắc việc</p></div>' :
          data.followups.map(f => `
            <div class="followup-item ${f.status}">
              <div class="followup-check ${f.status === 'done' ? 'done' : ''}" onclick="markDone(${f.id}, this)">
                ${f.status === 'done' ? '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" width="10"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
              </div>
              <div class="followup-info">
                <div class="followup-content">${f.content}</div>
                <div class="followup-meta">
                  <span ${f.status==='overdue'?'style="color:var(--red)"':''}>📅 ${formatDate(f.due_date)}</span>
                  <span class="priority-dot priority-${f.priority}"></span>
                  ${f.status === 'overdue' ? '<span style="color:var(--red);font-weight:600">Quá hạn!</span>' : ''}
                </div>
              </div>
              <button class="btn btn-icon btn-ghost btn-sm" onclick="deleteFollowup(${f.id})">🗑️</button>
            </div>
          `).join('')
        }
      </div>
    `, true);
  } catch(err) {}
}

function switchTab(activeId) {
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const el = document.getElementById(activeId);
  if (el) {
    el.classList.add('active');
    const idx = el.id === 'deal-activities' ? 0 : 1;
    document.querySelectorAll('.tab')[idx]?.classList.add('active');
  }
}

async function quickUpdateStage(dealId, stage) {
  try {
    await api.updateDealStage(dealId, stage);
    showToast(`Chuyển sang: ${STAGE_NAMES[stage]}`, 'success');
    document.querySelectorAll('.stage-step').forEach((el, i) => {
      el.classList.toggle('active', i + 1 === stage);
      el.classList.toggle('done', i + 1 < stage);
    });
    if (document.querySelector('.kanban-board')) loadKanban();
  } catch(err) {}
}

async function changeDealStatus(id, status) {
  if (!confirm(`Xác nhận chuyển deal sang trạng thái: ${status === 'won' ? 'THẮNG ✅' : 'THUA ❌'}?`)) return;
  try {
    await api.updateDealStatus(id, status);
    showToast(status === 'won' ? '🎉 Deal thắng! Xuất sắc!' : 'Deal kết thúc. Rút kinh nghiệm!', status === 'won' ? 'success' : 'info');
    closeModal();
    if (allDeals.length) loadDealsTable();
    if (document.querySelector('.kanban-board')) loadKanban();
  } catch(err) {}
}

async function deleteDeal(id) {
  if (!confirm('Xóa deal này? Tất cả hoạt động liên quan cũng sẽ bị xóa.')) return;
  try {
    await api.deleteDeal(id);
    showToast('Đã xóa deal', 'success');
    loadDealsTable();
    if (document.querySelector('.kanban-board')) loadKanban();
  } catch(err) {}
}

async function deleteActivity(activityId, dealId) {
  if (!confirm('Xóa hoạt động này?')) return;
  try {
    await api.deleteActivity(activityId);
    showToast('Đã xóa hoạt động', 'success');
    openDealDetail(dealId);
  } catch(err) {}
}

async function deleteFollowup(id) {
  if (!confirm('Xóa nhắc việc này?')) return;
  try {
    await api.deleteFollowup(id);
    showToast('Đã xóa nhắc việc', 'success');
    if (document.querySelector('.followup-item')) renderFollowups();
  } catch(err) {}
}

async function markDone(id, el) {
  try {
    await api.markFollowupDone(id);
    showToast('Hoàn thành!', 'success');
    el.closest('.followup-item').style.opacity = '0.4';
    el.classList.add('done');
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" width="10"><polyline points="20 6 9 17 4 12"/></svg>';
    updateFollowupBadge();
  } catch(err) {}
}
