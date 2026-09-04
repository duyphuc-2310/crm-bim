// ================================================
// App Router & State
// ================================================
const PAGES = {
  dashboard: { title: 'Dashboard', render: renderDashboard },
  kanban: { title: 'Kanban Pipeline', render: renderKanban },
  deals: { title: 'Quản Lý Deals', render: renderDeals },
  contacts: { title: 'Khách Hàng', render: renderContacts },
  followups: { title: 'Follow-ups', render: renderFollowups },
  activities: { title: 'Hoạt Động', render: renderActivities },
  products: { title: 'Sản Phẩm', render: renderProducts },
  invoices: { title: 'Hóa Đơn', render: renderInvoices },
  analytics: { title: 'Thống Kê & Báo Cáo', render: renderAnalytics }
};

let currentPage = 'dashboard';

function navigateTo(page) {
  if (!PAGES[page]) return;
  currentPage = page;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Update page title
  document.getElementById('page-title').textContent = PAGES[page].title;

  // Clear header actions (dashboard will repopulate its own)
  const headerActions = document.getElementById('header-actions');
  if (headerActions && page !== 'dashboard') headerActions.innerHTML = '';

  // Render page
  PAGES[page].render();
}

// Header date
function updateHeaderDate() {
  const el = document.getElementById('header-date');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleDateString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}

// Follow-up badge
async function updateFollowupBadge() {
  try {
    const { count } = await api.getOverdueCount();
    const badge = document.getElementById('followup-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  } catch(e) {}
}

// Modal management
function openModal(title, body, large = false) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-footer').innerHTML = '';
  const modal = document.getElementById('modal');
  if (large) modal.classList.add('modal-lg');
  else modal.classList.remove('modal-lg');
  modal.classList.add('active');
  document.getElementById('modal-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
  document.getElementById('modal-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

// Sidebar toggle (mobile)
document.getElementById('menu-toggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Nav click handlers
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(el.dataset.page);
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.ctrlKey && e.key === 'k') { e.preventDefault(); openGlobalAdd(); }
});

// Init
document.addEventListener('DOMContentLoaded', async () => {
  updateHeaderDate();
  setInterval(updateHeaderDate, 60000);
  
  // Load initial page
  navigateTo('dashboard');
  
  // Load followup badge
  await updateFollowupBadge();
  
  // Refresh badge every 5 minutes
  setInterval(updateFollowupBadge, 5 * 60 * 1000);
});
