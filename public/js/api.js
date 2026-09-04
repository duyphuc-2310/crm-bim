// ================================================
// API Wrapper – tất cả calls đến backend
// ================================================
const API_BASE = '/api';

async function apiCall(method, path, data = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (data) opts.body = JSON.stringify(data);
  try {
    const res = await fetch(API_BASE + path, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Lỗi server');
    return json;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

const api = {
  // Search
  getSearch: (q) => apiCall('GET', `/search?q=${encodeURIComponent(q)}`),

  // Contacts
  getContacts: (q = '') => apiCall('GET', `/contacts${q}`),
  getContact: id => apiCall('GET', `/contacts/${id}`),
  createContact: d => apiCall('POST', '/contacts', d),
  updateContact: (id, d) => apiCall('PUT', `/contacts/${id}`, d),
  deleteContact: id => apiCall('DELETE', `/contacts/${id}`),

  // Deals
  getDeals: (q = '') => apiCall('GET', `/deals${q}`),
  getKanban: () => apiCall('GET', '/deals/kanban'),
  getDeal: id => apiCall('GET', `/deals/${id}`),
  createDeal: d => apiCall('POST', '/deals', d),
  updateDeal: (id, d) => apiCall('PUT', `/deals/${id}`, d),
  updateDealStage: (id, stage) => apiCall('PATCH', `/deals/${id}/stage`, { stage }),
  updateDealStatus: (id, status) => apiCall('PATCH', `/deals/${id}/status`, { status }),
  deleteDeal: id => apiCall('DELETE', `/deals/${id}`),

  // Activities
  getActivities: (q = '') => apiCall('GET', `/activities${q}`),
  createActivity: d => {
    if (d instanceof FormData) {
      return fetch(API_BASE + '/activities', { method: 'POST', body: d })
        .then(async res => {
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Lỗi server');
          return json;
        });
    }
    return apiCall('POST', '/activities', d);
  },
  deleteActivity: id => apiCall('DELETE', `/activities/${id}`),

  // Followups
  getFollowups: (q = '') => apiCall('GET', `/followups${q}`),
  getUpcoming: () => apiCall('GET', '/followups/upcoming'),
  getOverdueCount: () => apiCall('GET', '/followups/overdue-count'),
  createFollowup: d => apiCall('POST', '/followups', d),
  updateFollowup: (id, d) => apiCall('PUT', `/followups/${id}`, d),
  markFollowupDone: id => apiCall('PATCH', `/followups/${id}/done`),
  deleteFollowup: id => apiCall('DELETE', `/followups/${id}`),

  // Products
  getProducts: () => apiCall('GET', '/products'),
  createProduct: d => apiCall('POST', '/products', d),
  updateProduct: (id, d) => apiCall('PUT', `/products/${id}`, d),
  deleteProduct: id => apiCall('DELETE', `/products/${id}`),

  // Stats
  getDashboard: () => apiCall('GET', '/stats/dashboard'),
  getAnalytics: () => apiCall('GET', '/stats/analytics'),
  getSilentDeals: (days = 7) => apiCall('GET', `/stats/silent?days=${days}`),

  // Settings
  getSettings: () => apiCall('GET', '/settings'),
  saveSetting: (key, value) => apiCall('PUT', `/settings/${key}`, { value: String(value) }),
};

// Toast notification
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Format helpers
function formatCurrency(v) {
  if (!v || v == 0) return '—';
  v = Number(v);
  if (v >= 1e9) return (v/1e9).toFixed(1) + ' tỷ';
  if (v >= 1e6) return (v/1e6).toFixed(0) + ' triệu';
  return v.toLocaleString('vi-VN') + ' đ';
}

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}

function timeAgo(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff/60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs/24)} ngày trước`;
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function isToday(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

const STAGE_NAMES = ['', 'Mới tiếp cận', 'Khảo sát nhu cầu', 'Đề xuất giải pháp', 'Demo/Thử nghiệm', 'Gửi báo giá', 'Đàm phán', 'Chốt/Kết thúc'];
const STAGE_COLORS = ['','#6366f1','#8b5cf6','#06b6d4','#f59e0b','#f97316','#ef4444','#10b981'];

const ORG_TYPE_LABELS = {
  'kts_doc_lap': 'KTS độc lập',
  'cty_thiet_ke': 'Công ty thiết kế',
  'cong_ty_vua': 'Công ty vừa',
  'tong_thau': 'Tổng thầu',
  'chu_dau_tu': 'Chủ đầu tư',
  'co_quan_nha_nuoc': 'Cơ quan NN',
  'khac': 'Khác'
};

const BIM_MATURITY_LABELS = {
  '0_chua_biet': 'Chưa biết BIM',
  '1_nghe_qua': 'Nghe qua',
  '2_dang_tim_hieu': 'Đang tìm hiểu',
  '3_dang_dung': 'Đang dùng',
  '4_chuyen_sau': 'Chuyên sâu'
};

const ACTIVITY_TYPE_LABELS = {
  'goi_dien': '📞 Gọi điện',
  'gap_mat': '🤝 Gặp mặt',
  'demo': '💻 Demo',
  'gui_bao_gia': '📋 Gửi báo giá',
  'email': '📧 Email',
  'zalo': '💬 Zalo',
  'khac': '📝 Khác'
};

const PRODUCT_GROUP_LABELS = {
  'bim_chu_luc': 'BIM Chủ lực',
  'add_in': 'Add-in',
  'cong_tac': 'Cộng tác',
  'chuyen_dung': 'Chuyên dụng'
};

const PRODUCT_GROUP_ICONS = {
  'bim_chu_luc': '🏗️',
  'add_in': '🔌',
  'cong_tac': '🤝',
  'chuyen_dung': '⚙️'
};
