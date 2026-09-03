// ================================================
// Contacts Component
// ================================================
let allContacts = [];

async function renderContacts() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="page-filters">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" id="contact-search" placeholder="Tìm theo tên, công ty, SĐT..." oninput="filterContacts()">
      </div>
      <select class="filter-select" id="org-filter" onchange="filterContacts()">
        <option value="">Tất cả loại hình</option>
        ${Object.entries(ORG_TYPE_LABELS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
      </select>
      <select class="filter-select" id="bim-filter" onchange="filterContacts()">
        <option value="">Tất cả mức BIM</option>
        ${Object.entries(BIM_MATURITY_LABELS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
      </select>
      <button class="btn btn-primary" onclick="openAddContactModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm khách hàng
      </button>
    </div>
    <div id="contacts-grid" class="contact-grid">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;
  loadContacts();
}

async function loadContacts() {
  try {
    const { data } = await api.getContacts();
    allContacts = data;
    filterContacts();
  } catch(err) {
    document.getElementById('contacts-grid').innerHTML = '<div class="empty-state"><p>Lỗi tải dữ liệu</p></div>';
  }
}

function filterContacts() {
  const search = (document.getElementById('contact-search')?.value || '').toLowerCase();
  const org = document.getElementById('org-filter')?.value || '';
  const bim = document.getElementById('bim-filter')?.value || '';
  
  let contacts = allContacts;
  if (search) contacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search) ||
    (c.company||'').toLowerCase().includes(search) ||
    (c.phone||'').includes(search) ||
    (c.email||'').toLowerCase().includes(search)
  );
  if (org) contacts = contacts.filter(c => c.org_type === org);
  if (bim) contacts = contacts.filter(c => c.bim_maturity === bim);
  
  renderContactGrid(contacts);
}

const BIM_COLORS = {
  '0_chua_biet': 'var(--text-muted)',
  '1_nghe_qua': '#f59e0b',
  '2_dang_tim_hieu': '#f97316',
  '3_dang_dung': '#06b6d4',
  '4_chuyen_sau': '#10b981'
};

function renderContactGrid(contacts) {
  const grid = document.getElementById('contacts-grid');
  if (!grid) return;
  if (contacts.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">👥</div><h3>Không tìm thấy khách hàng</h3><p>Thêm khách hàng mới để bắt đầu</p></div>`;
    return;
  }
  grid.innerHTML = contacts.map(c => {
    const initials = c.name.split(' ').slice(-2).map(w=>w[0]).join('').toUpperCase();
    const bimColor = BIM_COLORS[c.bim_maturity] || 'var(--text-muted)';
    return `
      <div class="contact-card" onclick="openContactDetail(${c.id})">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
          <div class="contact-avatar">${initials}</div>
          <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
            <button class="btn btn-icon btn-ghost btn-sm" onclick="openEditContactModal(${c.id})" title="Sửa">✏️</button>
            <button class="btn btn-icon btn-danger btn-sm" onclick="deleteContact(${c.id})" title="Xóa">🗑️</button>
          </div>
        </div>
        <div class="contact-name">${c.name}</div>
        <div class="contact-company">${c.company || '<em style="opacity:0.5">Chưa có công ty</em>'}</div>
        <div class="contact-chips">
          <span class="badge badge-gray">${ORG_TYPE_LABELS[c.org_type]||c.org_type}</span>
          <span class="badge" style="background:${bimColor}22;color:${bimColor}">${BIM_MATURITY_LABELS[c.bim_maturity]||c.bim_maturity}</span>
        </div>
        <div class="contact-stats">
          ${c.phone ? `<div class="contact-stat">📞 ${c.phone}</div>` : ''}
          <div class="contact-stat"><strong>${c.deal_count||0}</strong> deal</div>
          <div class="contact-stat"><strong>${c.activity_count||0}</strong> hoạt động</div>
        </div>
      </div>
    `;
  }).join('');
}

async function openContactDetail(id) {
  try {
    const { data } = await api.getContact(id);
    const bimColor = BIM_COLORS[data.bim_maturity] || 'var(--text-muted)';
    const rev = data.revenue || {};
    
    openModal('Khách hàng 360°', `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
        <div class="contact-avatar" style="width:56px;height:56px;font-size:22px">${data.name.split(' ').slice(-2).map(w=>w[0]).join('').toUpperCase()}</div>
        <div style="flex:1">
          <div style="font-size:20px;font-weight:800">${data.name}</div>
          <div style="font-size:14px;color:var(--text-secondary)">${data.company||''}</div>
          <div style="display:flex;gap:6px;margin-top:6px">
            <span class="badge badge-gray">${ORG_TYPE_LABELS[data.org_type]}</span>
            <span class="badge" style="background:${bimColor}22;color:${bimColor}">${BIM_MATURITY_LABELS[data.bim_maturity]}</span>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="openEditContactModal(${id});closeModal()">✏️ Sửa</button>
          <button class="btn btn-primary btn-sm" onclick="openAddDealModal(null,${id});closeModal()">+ Deal mới</button>
        </div>
      </div>
      
      <!-- Revenue Summary -->
      <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
        <div class="stat-card" style="padding: 12px; --stat-color: #10b981; --stat-bg: rgba(16,185,129,0.1)">
          <div class="stat-label">Tổng đã mua</div>
          <div class="stat-value" style="font-size: 18px;">${formatCurrency(rev.total_won)}</div>
          <div class="stat-sub">${rev.won_count || 0} deal thắng</div>
        </div>
        <div class="stat-card" style="padding: 12px; --stat-color: #6366f1; --stat-bg: rgba(99,102,241,0.1)">
          <div class="stat-label">Pipeline</div>
          <div class="stat-value" style="font-size: 18px;">${formatCurrency(rev.pipeline_value)}</div>
          <div class="stat-sub">${rev.open_count || 0} deal đang mở</div>
        </div>
        <div class="stat-card" style="padding: 12px; --stat-color: #f59e0b; --stat-bg: rgba(245,158,11,0.1)">
          <div class="stat-label">Liên hệ</div>
          <div class="stat-value" style="font-size: 14px;">${data.phone ? `📞 ${data.phone}` : '—'}</div>
          <div class="stat-sub">${data.email ? `📧 ${data.email}` : '—'}</div>
        </div>
      </div>

      ${data.notes ? `<div style="background:var(--bg-input);border-radius:8px;padding:12px;font-size:13px;margin-bottom:16px">${data.notes}</div>` : ''}
      
      <div class="tabs">
        <div class="tab active" onclick="switchTab('cd-deals')">💼 Deals (${data.deals.length})</div>
        <div class="tab" onclick="switchTab('cd-activities')">📋 Hoạt động (${data.activities.length})</div>
        <div class="tab" onclick="switchTab('cd-followups')">🔔 Follow-up (${data.followups.length})</div>
      </div>
      
      <div class="tab-content active" id="cd-deals">
        ${data.deals.length === 0 ? '<div class="empty-state" style="padding:20px"><p>Chưa có deal</p></div>' :
          data.deals.map(d => `
            <div class="deal-row" onclick="openDealDetail(${d.id})" style="cursor:pointer">
              <div class="deal-rank">${d.stage}</div>
              <div class="deal-info">
                <div class="deal-name">${d.title}</div>
                <div class="deal-company">${STAGE_NAMES[d.stage]} · ${d.product_name||'—'} · 
                  <strong style="color:${d.status==='won'?'var(--green)':d.status==='lost'?'var(--red)':'var(--accent)'}">${d.status==='won'?'Thắng':d.status==='lost'?'Thua':'Đang mở'}</strong>
                </div>
              </div>
              <div class="deal-val">${formatCurrency(d.estimated_value)}</div>
            </div>
          `).join('')
        }
      </div>
      <div class="tab-content" id="cd-activities">
        ${data.activities.length === 0 ? '<div class="empty-state" style="padding:20px"><p>Chưa có hoạt động</p></div>' :
          data.activities.map(a => `
            <div class="activity-item">
              <div class="activity-dot" style="background:rgba(99,102,241,0.15)">
                ${ACTIVITY_TYPE_LABELS[a.activity_type]?.split(' ')[0] || '📝'}
              </div>
              <div class="activity-content">
                <div class="activity-title">${ACTIVITY_TYPE_LABELS[a.activity_type]} · ${a.deal_title||'—'}</div>
                <div class="activity-meta">${a.content} · ${timeAgo(a.activity_date)}</div>
              </div>
            </div>
          `).join('')
        }
      </div>
      <div class="tab-content" id="cd-followups">
        ${data.followups.length === 0 ? '<div class="empty-state" style="padding:20px"><p>Không có nhắc việc</p></div>' :
          data.followups.map(f => `
            <div class="followup-item ${f.status}">
              <div class="followup-check" onclick="markDone(${f.id}, this)"></div>
              <div class="followup-info">
                <div class="followup-content">${f.content}</div>
                <div class="followup-meta"><span>📅 ${formatDate(f.due_date)}</span></div>
              </div>
            </div>
          `).join('')
        }
      </div>
    `, true);
  } catch(err) {}
}

async function deleteContact(id) {
  if (!confirm('Xóa khách hàng này? Tất cả deals và hoạt động liên quan cũng sẽ bị xóa.')) return;
  try {
    await api.deleteContact(id);
    showToast('Đã xóa khách hàng', 'success');
    loadContacts();
  } catch(err) {}
}
