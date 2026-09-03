// ================================================
// Dashboard Component
// ================================================
async function renderDashboard() {
  const container = document.getElementById('page-container');
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Đang tải...</div>`;
  
  // Add export + target buttons to page header
  const headerActions = document.getElementById('header-actions');
  if (headerActions) {
    headerActions.innerHTML = `
      <button class="settings-gear-btn" onclick="openTargetSettings()" title="Đặt mục tiêu doanh số">
        ⚙️ Mục tiêu
      </button>
      <button class="btn btn-ghost btn-sm" onclick="exportDealsToCSV()" title="Xuất báo cáo ra file Excel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Xuất Excel
      </button>
    `;
  }
  
  try {
    const { data } = await api.getDashboard();
    const { pipeline, wonlost, byStage, overdue, today_followups, topDeals, byProduct, recentActivities, monthlyTarget } = data;
    const maxStageValue = Math.max(...byStage.map(s => Number(s.value) || 0), 1);

    // Calculate target progress
    const target = Number(monthlyTarget) || 1; // avoid division by 0
    const wonValue = Number(wonlost.won_value) || 0;
    const progressPercent = Math.min(Math.round((wonValue / target) * 100), 100);
    const isTargetMet = wonValue >= target;

    container.innerHTML = `
      <!-- Target Row -->
      <div class="card" style="margin-bottom: 20px; border-left: 4px solid ${isTargetMet ? 'var(--green)' : 'var(--accent)'}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:14px; color:var(--text-secondary)">Mục tiêu tháng ${new Date().getMonth() + 1}: <span style="color:var(--text-primary); font-weight:600">${formatCurrency(target)}</span></div>
          <div style="font-size:14px; font-weight:600; color:${isTargetMet ? 'var(--green)' : 'var(--accent)'}">${progressPercent}%</div>
        </div>
        <div class="stage-bar-track">
          <div class="stage-bar-fill" style="width:${progressPercent}%; background:${isTargetMet ? 'var(--green)' : 'var(--accent)'}"></div>
        </div>
        ${!isTargetMet && wonValue > 0 ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:8px;">Còn thiếu ${formatCurrency(target - wonValue)} để đạt mục tiêu! Cố lên! 💪</div>` : ''}
        ${isTargetMet ? `<div style="font-size:12px; color:var(--green); margin-top:8px;">Đã vượt mục tiêu! Tuyệt vời! 🎉</div>` : ''}
      </div>

      <!-- Stats Row -->
      <div class="stats-grid">
        <div class="stat-card" style="--stat-color:#6366f1;--stat-bg:rgba(99,102,241,0.15)">
          <div class="stat-label">Pipeline hiện tại</div>
          <div class="stat-value">${formatCurrency(pipeline.total_value)}</div>
          <div class="stat-sub">${pipeline.total_deals || 0} deal đang theo đuổi</div>
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>
        <div class="stat-card" style="--stat-color:#10b981;--stat-bg:rgba(16,185,129,0.15)">
          <div class="stat-label">Đã chốt tháng này</div>
          <div class="stat-value">${formatCurrency(wonlost.won_value)}</div>
          <div class="stat-sub">${wonlost.won_count || 0} deal thắng</div>
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
        <div class="stat-card" style="--stat-color:#ef4444;--stat-bg:rgba(239,68,68,0.15)">
          <div class="stat-label">Follow-up quá hạn</div>
          <div class="stat-value" style="color:var(--red)">${overdue}</div>
          <div class="stat-sub">${today_followups} việc cần làm hôm nay</div>
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
        </div>
        <div class="stat-card" style="--stat-color:#f59e0b;--stat-bg:rgba(245,158,11,0.15)">
          <div class="stat-label">Deal thua tháng này</div>
          <div class="stat-value" style="color:var(--yellow)">${wonlost.lost_count || 0}</div>
          <div class="stat-sub">Win rate: ${wonlost.won_count > 0 ? Math.round(wonlost.won_count/(wonlost.won_count+wonlost.lost_count)*100) : 0}%</div>
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="dashboard-grid">
        <!-- Pipeline by Stage -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Pipeline theo giai đoạn</span>
            <button class="btn btn-ghost btn-sm" onclick="navigateTo('kanban')">Xem Kanban →</button>
          </div>
          ${byStage.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📊</div><p>Chưa có dữ liệu</p></div>' :
            byStage.map(s => `
              <div class="stage-bar">
                <div class="stage-bar-label">
                  <span>${STAGE_NAMES[s.stage] || 'Giai đoạn ' + s.stage}</span>
                  <span style="color:var(--text-primary);font-weight:600">${s.count} deal · ${formatCurrency(s.value)}</span>
                </div>
                <div class="stage-bar-track">
                  <div class="stage-bar-fill" style="width:${Math.round(Number(s.value)/maxStageValue*100)}%;background:${STAGE_COLORS[s.stage]||'var(--accent)'}"></div>
                </div>
              </div>
            `).join('')
          }
        </div>

        <!-- Top Deals -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Deal giá trị cao nhất</span>
            <button class="btn btn-ghost btn-sm" onclick="navigateTo('deals')">Tất cả →</button>
          </div>
          ${topDeals.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">💰</div><p>Chưa có deal</p></div>' :
            topDeals.map((d,i) => `
              <div class="deal-row" onclick="navigateTo('deals');openDealDetail(${d.id})" style="cursor:pointer">
                <div class="deal-rank">${i+1}</div>
                <div class="deal-info">
                  <div class="deal-name">${d.title}</div>
                  <div class="deal-company">${d.contact_company || d.contact_name} · ${STAGE_NAMES[d.stage]}</div>
                </div>
                <div class="deal-val">${formatCurrency(d.estimated_value)}</div>
              </div>
            `).join('')
          }
        </div>

        <!-- Right column: Follow-ups + Recent Activities -->
        <div class="dashboard-col">
          <!-- Urgent follow-ups -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">⚡ Cần làm ngay</span>
              <button class="btn btn-ghost btn-sm" onclick="navigateTo('followups')">Tất cả →</button>
            </div>
            <div id="urgent-followups">
              <div class="loading"><div class="spinner"></div></div>
            </div>
          </div>

          <!-- Recent activities -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Hoạt động gần đây</span>
            </div>
            ${recentActivities.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📋</div><p>Chưa có hoạt động</p></div>' :
              recentActivities.map(a => `
                <div class="activity-item">
                  <div class="activity-dot" style="background:rgba(99,102,241,0.15);color:#6366f1">
                    ${a.activity_type === 'goi_dien' ? '📞' : a.activity_type === 'gap_mat' ? '🤝' : a.activity_type === 'demo' ? '💻' : a.activity_type === 'gui_bao_gia' ? '📋' : '📝'}
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">${a.contact_name}${a.deal_title ? ' · ' + a.deal_title : ''}</div>
                    <div class="activity-meta">${a.content.substring(0,80)}${a.content.length>80?'...':''} · ${timeAgo(a.activity_date)}</div>
                  </div>
                </div>
              `).join('')
            }
          </div>

          <!-- Silent Deals Alert -->
          <div class="card" style="border-left: 3px solid var(--orange)">
            <div class="card-header">
              <span class="card-title">🔕 Deal im lặng</span>
              <button class="btn btn-ghost btn-sm" onclick="navigateTo('deals')">Xem deal →</button>
            </div>
            <div id="silent-deals-widget">
              <div class="loading"><div class="spinner"></div></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load urgent followups & silent deals
    loadUrgentFollowups();
    loadSilentDealsWidget();

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>Lỗi tải dữ liệu</h3><p>${err.message}</p></div>`;
  }
}

async function loadUrgentFollowups() {
  const el = document.getElementById('urgent-followups');
  if (!el) return;
  try {
    const { data } = await api.getUpcoming();
    const urgent = data.filter(f => f.status !== 'done').slice(0, 5);
    if (urgent.length === 0) {
      el.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-state-icon" style="font-size:24px">✅</div><p>Không có việc cần làm</p></div>';
      return;
    }
    el.innerHTML = urgent.map(f => {
      const cls = f.status === 'overdue' ? 'overdue' : isToday(f.due_date) ? 'today' : 'upcoming';
      return `
        <div class="followup-item ${cls}" style="margin-bottom:8px">
          <div class="followup-check" onclick="quickDoneFollowup(${f.id}, this)" title="Đánh dấu hoàn thành">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="followup-info">
            <div class="followup-content">${f.content}</div>
            <div class="followup-meta">
              <span>👤 ${f.contact_name}</span>
              <span ${f.status==='overdue'?'style="color:var(--red);font-weight:600"':''}>📅 ${formatDate(f.due_date)}${f.status==='overdue'?' ⚠️ Quá hạn':''}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch(e) {}
}

async function quickDoneFollowup(id, el) {
  try {
    await api.markFollowupDone(id);
    el.closest('.followup-item').style.opacity = '0.3';
    el.style.background = 'var(--green)';
    showToast('Đã hoàn thành follow-up!', 'success');
    updateFollowupBadge();
  } catch(e) {}
}

// ================================================
// Export Deals to CSV (Excel-compatible)
// ================================================
async function exportDealsToCSV() {
  try {
    showToast('⏳ Đang tạo file báo cáo...', 'info');
    const { data: deals } = await api.getDeals();

    const headers = [
      'Tên Deal', 'Khách hàng', 'Công ty', 'Sản phẩm',
      'Giá trị (VND)', 'Xác suất (%)', 'Giai đoạn',
      'Trạng thái', 'Follow-up tiếp theo', 'Ghi chú', 'Cập nhật lần cuối'
    ];

    function fmtNum(v) {
      if (!v || v == 0) return '0';
      return Number(v).toLocaleString('vi-VN');
    }
    function fmtDate(d) {
      if (!d) return '';
      const dt = new Date(d);
      if (isNaN(dt)) return '';
      return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
    }

    const rows = deals.map(d => [
      d.title || '',
      d.contact_name || '',
      d.contact_company || '',
      d.product_name || '',
      fmtNum(d.estimated_value),
      String(d.probability || 0) + '%',
      STAGE_NAMES[d.stage] || ('Giai đoạn ' + d.stage),
      d.status === 'won' ? 'Chốt thắng' : d.status === 'lost' ? 'Thất bại' : 'Đang theo dõi',
      fmtDate(d.next_followup_date),
      (d.notes || '').replace(/[\r\n]+/g, ' '),
      fmtDate(d.updated_at)
    ]);

    // Build CSV with BOM for Excel UTF-8
    const BOM = '\uFEFF';
    const csv = BOM + [headers, ...rows]
      .map(row => row.map(cell => {
        const s = String(cell).replace(/"/g, '""');
        return `"${s}"`;
      }).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    link.href = url;
    link.download = `BaoCao_Deals_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`✅ Đã xuất ${deals.length} deals ra file Excel!`, 'success');
  } catch(err) {
    showToast('Lỗi khi xuất báo cáo: ' + err.message, 'error');
  }
}

// ================================================
// Silent Deals Widget
// ================================================
async function loadSilentDealsWidget() {
  const el = document.getElementById('silent-deals-widget');
  if (!el) return;
  try {
    const settings = await api.getSettings();
    const days = Number(settings.data.silent_deal_days) || 7;
    const { data: silentDeals } = await api.getSilentDeals(days);

    if (silentDeals.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:16px"><div class="empty-state-icon" style="font-size:24px">✅</div><p>Không có deal im lặng!</p></div>`;
      return;
    }

    el.innerHTML = silentDeals.slice(0, 4).map(d => `
      <div class="silent-deal-item" onclick="navigateTo('deals');openDealDetail(${d.id})">
        <div>
          <div style="font-weight:600;font-size:13px">${d.title}</div>
          <div style="font-size:11px;color:var(--text-secondary)">${d.contact_name} · ${STAGE_NAMES[d.stage]}</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div class="silent-days-badge ${d.days_silent >= 14 ? '' : 'warn'}">${d.days_silent} ngày</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">${formatCurrency(d.estimated_value)}</div>
        </div>
      </div>
    `).join('');

    if (silentDeals.length > 4) {
      el.innerHTML += `<div style="text-align:center;padding:8px;font-size:12px;color:var(--text-secondary)">+${silentDeals.length - 4} deal khác</div>`;
    }
  } catch(e) {
    el.innerHTML = `<div style="padding:12px;color:var(--text-muted);font-size:12px">Không tải được dữ liệu</div>`;
  }
}

// ================================================
// Monthly Target Settings Modal
// ================================================
async function openTargetSettings() {
  try {
    const settings = await api.getSettings();
    const target = settings.data.monthly_target || '500000000';
    const days = settings.data.silent_deal_days || '7';

    openModal('⚙️ Cài đặt Dashboard', `
      <div class="form-group">
        <label>Mục tiêu doanh số tháng ${new Date().getMonth() + 1} (VND)</label>
        <input type="number" class="form-control" id="s-target" value="${target}" placeholder="500000000">
        <div class="form-hint">Ví dụ: 500000000 = 500 triệu</div>
      </div>
      <div class="form-group">
        <label>Cảnh báo Deal im lặng sau (ngày)</label>
        <input type="number" class="form-control" id="s-silent-days" value="${days}" min="1" max="60">
        <div class="form-hint">Deal không có hoạt động sau số ngày này sẽ được cảnh báo</div>
      </div>
    `);

    const footer = document.getElementById('modal-footer');
    footer.innerHTML = `
      <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
      <button class="btn btn-primary" onclick="saveTargetSettings()">Lưu cài đặt</button>
    `;
  } catch(err) {
    showToast('Lỗi tải cài đặt', 'error');
  }
}

async function saveTargetSettings() {
  const target = document.getElementById('s-target')?.value;
  const days = document.getElementById('s-silent-days')?.value;
  try {
    await Promise.all([
      api.saveSetting('monthly_target', target),
      api.saveSetting('silent_deal_days', days)
    ]);
    showToast('✅ Đã lưu cài đặt!', 'success');
    closeModal();
    renderDashboard(); // Reload dashboard to show new target
  } catch(err) {
    showToast('Lỗi khi lưu: ' + err.message, 'error');
  }
}
