// ================================================
// Followups Component
// ================================================
async function renderFollowups() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="page-filters">
      <select class="filter-select" id="followup-status-filter" onchange="loadFollowupsList()">
        <option value="">Tất cả</option>
        <option value="overdue">⚠️ Quá hạn</option>
        <option value="pending">🔔 Đang chờ</option>
        <option value="done">✅ Đã xong</option>
      </select>
      <select class="filter-select" id="followup-priority-filter" onchange="loadFollowupsList()">
        <option value="">Tất cả mức ưu tiên</option>
        <option value="high">🔴 Cao</option>
        <option value="medium">🟡 Trung bình</option>
        <option value="low">🟢 Thấp</option>
      </select>
      <button class="btn btn-primary" onclick="openAddFollowupModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm nhắc việc
      </button>
    </div>

    <!-- Quick summary -->
    <div class="stats-grid" style="margin-bottom:20px" id="followup-summary">
      <div class="loading"><div class="spinner"></div></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Danh sách nhắc việc</span>
      </div>
      <div id="followups-list">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `;
  loadFollowupsSummary();
  loadFollowupsList();
}

async function loadFollowupsSummary() {
  try {
    const [all, overdue, today, upcoming] = await Promise.all([
      api.getFollowups(),
      api.getFollowups('?status=overdue'),
      api.getFollowups(`?status=pending`),
      api.getUpcoming()
    ]);
    const todayCount = today.data.filter(f => isToday(f.due_date)).length;
    document.getElementById('followup-summary').innerHTML = `
      <div class="stat-card" style="--stat-color:#ef4444;--stat-bg:rgba(239,68,68,0.15)">
        <div class="stat-label">Quá hạn</div>
        <div class="stat-value" style="color:var(--red)">${overdue.data.length}</div>
        <div class="stat-sub">Cần xử lý ngay!</div>
        <div class="stat-icon"><span style="font-size:20px">⚠️</span></div>
      </div>
      <div class="stat-card" style="--stat-color:#f59e0b;--stat-bg:rgba(245,158,11,0.15)">
        <div class="stat-label">Hôm nay</div>
        <div class="stat-value" style="color:var(--yellow)">${todayCount}</div>
        <div class="stat-sub">Cần liên hệ hôm nay</div>
        <div class="stat-icon"><span style="font-size:20px">📅</span></div>
      </div>
      <div class="stat-card" style="--stat-color:#6366f1;--stat-bg:rgba(99,102,241,0.15)">
        <div class="stat-label">7 ngày tới</div>
        <div class="stat-value">${upcoming.data.length}</div>
        <div class="stat-sub">Lên kế hoạch trước</div>
        <div class="stat-icon"><span style="font-size:20px">🔔</span></div>
      </div>
      <div class="stat-card" style="--stat-color:#10b981;--stat-bg:rgba(16,185,129,0.15)">
        <div class="stat-label">Đã hoàn thành</div>
        <div class="stat-value" style="color:var(--green)">${all.data.filter(f=>f.status==='done').length}</div>
        <div class="stat-sub">Tổng cộng</div>
        <div class="stat-icon"><span style="font-size:20px">✅</span></div>
      </div>
    `;
  } catch(err) {}
}

async function loadFollowupsList() {
  const statusVal = document.getElementById('followup-status-filter')?.value || '';
  const priorityVal = document.getElementById('followup-priority-filter')?.value || '';
  const el = document.getElementById('followups-list');
  if (!el) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    let q = '';
    if (statusVal) q = `?status=${statusVal}`;
    const { data } = await api.getFollowups(q);
    let followups = data;
    if (priorityVal) followups = followups.filter(f => f.priority === priorityVal);
    if (followups.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><h3>Không có nhắc việc nào</h3></div>';
      return;
    }
    el.innerHTML = followups.map(f => {
      const cls = f.status === 'overdue' ? 'overdue' : isToday(f.due_date) ? 'today' : f.status === 'done' ? 'done' : 'upcoming';
      const priorityLabel = { high: '🔴 Cao', medium: '🟡 TB', low: '🟢 Thấp' }[f.priority] || f.priority;
      return `
        <div class="followup-item ${cls}" id="fu-${f.id}">
          <div class="followup-check ${f.status==='done'?'done':''}" onclick="markFollowupDone(${f.id})" title="Đánh dấu hoàn thành">
            ${f.status==='done' ? '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" width="10"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
          </div>
          <div class="followup-info">
            <div class="followup-content">${f.content}</div>
            <div class="followup-meta">
              <span>👤 ${f.contact_name}${f.contact_company ? ' · ' + f.contact_company : ''}</span>
              ${f.deal_title ? `<span>💼 ${f.deal_title}</span>` : ''}
              <span ${f.status==='overdue'?'style="color:var(--red);font-weight:600"':''}>
                📅 ${formatDate(f.due_date)}
                ${f.status === 'overdue' ? ' ⚠️ QUÁ HẠN' : isToday(f.due_date) ? ' 🔔 HÔM NAY' : ''}
              </span>
              <span>${priorityLabel}</span>
            </div>
          </div>
          <div class="followup-actions">
            <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteFollowupItem(${f.id})" title="Xóa">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  } catch(err) {
    el.innerHTML = '<div class="empty-state"><p>Lỗi tải dữ liệu</p></div>';
  }
}

async function markFollowupDone(id) {
  try {
    await api.markFollowupDone(id);
    showToast('✅ Hoàn thành nhắc việc!', 'success');
    updateFollowupBadge();
    loadFollowupsList();
    loadFollowupsSummary();
  } catch(err) {}
}

async function deleteFollowupItem(id) {
  if (!confirm('Xóa nhắc việc này?')) return;
  try {
    await api.deleteFollowup(id);
    showToast('Đã xóa nhắc việc', 'success');
    document.getElementById(`fu-${id}`)?.remove();
  } catch(err) {}
}
