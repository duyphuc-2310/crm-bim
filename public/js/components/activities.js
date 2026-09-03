// ================================================
// Activities Component
// ================================================
async function renderActivities() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="page-filters">
      <select class="filter-select" id="act-type-filter" onchange="loadActivitiesList()">
        <option value="">Tất cả loại</option>
        ${Object.entries(ACTIVITY_TYPE_LABELS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
      </select>
      <button class="btn btn-primary" onclick="openAddActivityModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Ghi chú hoạt động
      </button>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Lịch sử hoạt động</span>
      </div>
      <div id="activities-list">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `;
  loadActivitiesList();
}

async function loadActivitiesList() {
  const typeVal = document.getElementById('act-type-filter')?.value || '';
  const el = document.getElementById('activities-list');
  if (!el) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const q = typeVal ? `?activity_type=${typeVal}` : '';
    const { data } = await api.getActivities(q);
    if (data.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>Chưa có hoạt động nào</h3></div>';
      return;
    }
    el.innerHTML = `
      <div class="data-table-wrap">
        <table>
          <thead><tr>
            <th>Loại</th><th>Khách hàng</th><th>Deal</th>
            <th>Nội dung</th><th>Kết quả</th><th>Thời gian</th><th></th>
          </tr></thead>
          <tbody>
            ${data.map(a => `
              <tr>
                <td><span class="badge badge-accent">${ACTIVITY_TYPE_LABELS[a.activity_type]||a.activity_type}</span></td>
                <td><span style="font-weight:600">${a.contact_name||'—'}</span></td>
                <td class="td-muted">${a.deal_title||'—'}</td>
                <td style="max-width:220px"><div class="truncate">${a.content}</div></td>
                <td style="max-width:180px;color:var(--green)"><div class="truncate">${a.result||'—'}</div></td>
                <td class="td-muted">
                  ${formatDateTime(a.activity_date)}
                  ${a.attachment_url ? `<br><a href="${a.attachment_url}" target="_blank" style="color:var(--accent);font-size:11px;display:inline-flex;align-items:center;gap:3px;margin-top:2px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> Đính kèm</a>` : ''}
                </td>
                <td><button class="btn btn-icon btn-danger btn-sm" onclick="deleteActivityItem(${a.id})" title="Xóa">🗑️</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch(err) {
    el.innerHTML = '<div class="empty-state"><p>Lỗi tải dữ liệu</p></div>';
  }
}

async function deleteActivityItem(id) {
  if (!confirm('Xóa hoạt động này?')) return;
  try {
    await api.deleteActivity(id);
    showToast('Đã xóa hoạt động', 'success');
    loadActivitiesList();
  } catch(err) {}
}
