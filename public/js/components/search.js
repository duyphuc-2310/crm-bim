// Global Search Logic
let searchDebounceTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('global-search-input');
  const searchResults = document.getElementById('global-search-results');

  if (!searchInput || !searchResults) return;

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    if (!q) {
      searchResults.style.display = 'none';
      return;
    }
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => performSearch(q), 300);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#global-search-container') && !e.target.closest('.quick-log-overlay')) {
      searchResults.style.display = 'none';
    }
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim() && searchResults.innerHTML) {
      searchResults.style.display = 'flex';
    }
  });
});

async function performSearch(query) {
  const searchResults = document.getElementById('global-search-results');
  try {
    searchResults.style.display = 'flex';
    searchResults.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">🔍 Đang tìm kiếm...</div>';

    const { data } = await api.getSearch(query);

    if (!data.contacts.length && !data.deals.length && !data.products.length) {
      searchResults.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">Không tìm thấy kết quả</div>';
      return;
    }

    let html = '';

    if (data.contacts.length > 0) {
      html += `
        <div class="gs-group">
          <div class="gs-group-title">👤 Khách hàng</div>
          ${data.contacts.map(c => `
            <div class="gs-item" onclick="navigateToContact(${c.id})">
              <div class="gs-item-info">
                <div class="gs-item-title">${c.name}${c.company ? ` — ${c.company}` : ''}</div>
                <div class="gs-item-sub">${[c.phone, c.email].filter(Boolean).join(' · ') || 'Chưa có liên hệ'}</div>
              </div>
              <button class="gs-item-quick-log" onclick="event.stopPropagation(); openQuickLog(${c.id}, '${escapeAttr(c.name)}', 'contact')">✏️ Ghi chú</button>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (data.deals.length > 0) {
      html += `
        <div class="gs-group">
          <div class="gs-group-title">💼 Deals</div>
          ${data.deals.map(d => `
            <div class="gs-item" onclick="navigateToDeal(${d.id})">
              <div class="gs-item-info">
                <div class="gs-item-title">${d.title}</div>
                <div class="gs-item-sub">KH: ${d.contact_name || '?'} · ${formatCurrency(d.estimated_value)}</div>
              </div>
              <button class="gs-item-quick-log" onclick="event.stopPropagation(); openQuickLog(${d.id}, '${escapeAttr(d.title)}', 'deal')">✏️ Ghi chú</button>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (data.products.length > 0) {
      html += `
        <div class="gs-group">
          <div class="gs-group-title">📦 Sản phẩm</div>
          ${data.products.map(p => `
            <div class="gs-item" onclick="navigateToProducts()">
              <div class="gs-item-info">
                <div class="gs-item-title">${p.name}</div>
                <div class="gs-item-sub">${p.category || 'Chưa phân loại'} · ${formatCurrency(p.price)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    searchResults.innerHTML = html;
  } catch (error) {
    console.error(error);
    searchResults.innerHTML = '<div style="padding:16px;text-align:center;color:var(--red);font-size:13px">⚠️ Lỗi tìm kiếm</div>';
  }
}

function escapeAttr(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ================================================
// Quick Activity Log
// ================================================
const QUICK_LOG_TYPES = [
  { key: 'email',   label: '📧 Email' },
  { key: 'call',    label: '📞 Gọi điện' },
  { key: 'zalo',    label: '💬 Zalo' },
  { key: 'meeting', label: '🤝 Gặp mặt' },
  { key: 'note',    label: '📝 Ghi chú' },
];

let _quickLogState = { id: null, name: '', type: '', activityType: 'note' };

function openQuickLog(id, name, type) {
  // Close search
  document.getElementById('global-search-results').style.display = 'none';

  _quickLogState = { id, name, type, activityType: 'note' };

  // Remove old overlay if any
  document.getElementById('quick-log-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'quick-log-overlay';
  overlay.id = 'quick-log-overlay';
  overlay.innerHTML = `
    <div class="quick-log-box" onclick="event.stopPropagation()">
      <div class="quick-log-title">✏️ Ghi chú nhanh — ${name}</div>
      <div class="quick-log-types" id="ql-types">
        ${QUICK_LOG_TYPES.map(t => `
          <button class="quick-log-type${t.key === 'note' ? ' active' : ''}" 
                  onclick="selectQuickLogType('${t.key}', this)">${t.label}</button>
        `).join('')}
      </div>
      <textarea class="quick-log-note" id="ql-note" rows="3" 
                placeholder="Nhập nội dung nhanh (VD: Đã gửi mail báo giá, khách xem xét...)"></textarea>
      <div class="quick-log-actions">
        <button class="btn btn-ghost btn-sm" onclick="closeQuickLog()">Hủy</button>
        <button class="btn btn-primary btn-sm" onclick="submitQuickLog()">💾 Lưu</button>
      </div>
    </div>
  `;

  overlay.addEventListener('click', closeQuickLog);
  document.body.appendChild(overlay);
  setTimeout(() => overlay.querySelector('#ql-note').focus(), 50);

  // Allow Escape to close
  document.addEventListener('keydown', _quickLogEsc);
}

function _quickLogEsc(e) {
  if (e.key === 'Escape') closeQuickLog();
}

function closeQuickLog() {
  document.getElementById('quick-log-overlay')?.remove();
  document.removeEventListener('keydown', _quickLogEsc);
}

function selectQuickLogType(key, btn) {
  _quickLogState.activityType = key;
  document.querySelectorAll('.quick-log-type').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function submitQuickLog() {
  const note = document.getElementById('ql-note')?.value?.trim();
  if (!note) {
    document.getElementById('ql-note').style.borderColor = 'var(--red)';
    return;
  }

  const { id, name, type, activityType } = _quickLogState;

  try {
    if (type === 'contact') {
      // Find first deal of contact or log without deal
      await api.createActivity({
        contact_id: id,
        deal_id: null,
        activity_type: activityType,
        content: note,
        activity_date: new Date().toISOString().slice(0, 10)
      });
    } else if (type === 'deal') {
      await api.createActivity({
        deal_id: id,
        activity_type: activityType,
        content: note,
        activity_date: new Date().toISOString().slice(0, 10)
      });
    }

    closeQuickLog();
    showToast(`✅ Đã ghi chú cho "${name}"`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Lỗi khi lưu ghi chú', 'error');
  }
}

// Navigation helpers
function navigateToContact(id) {
  document.getElementById('global-search-results').style.display = 'none';
  navigateTo('contacts');
  setTimeout(() => openContactDetail(id), 300);
}

function navigateToDeal(id) {
  document.getElementById('global-search-results').style.display = 'none';
  navigateTo('deals');
  setTimeout(() => openDealDetail(id), 300);
}

function navigateToProducts() {
  document.getElementById('global-search-results').style.display = 'none';
  navigateTo('products');
}
