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
    searchDebounceTimeout = setTimeout(() => {
      performSearch(q);
    }, 300);
  });

  // Hide when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#global-search-container')) {
      searchResults.style.display = 'none';
    }
  });
  
  // Show again when clicking input
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
    searchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted);">Đang tìm kiếm...</div>';

    const { data } = await api.getSearch(query);
    
    if (!data.contacts.length && !data.deals.length && !data.products.length) {
      searchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted);">Không tìm thấy kết quả.</div>';
      return;
    }

    let html = '';

    if (data.contacts.length > 0) {
      html += `
        <div class="gs-group">
          <div class="gs-group-title">Khách hàng</div>
          ${data.contacts.map(c => `
            <div class="gs-item" onclick="navigateToContact(${c.id})">
              <div class="gs-item-title">${c.name} ${c.company ? `- ${c.company}` : ''}</div>
              <div class="gs-item-sub">${c.phone || ''} ${c.email ? '· '+c.email : ''}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (data.deals.length > 0) {
      html += `
        <div class="gs-group">
          <div class="gs-group-title">Deals</div>
          ${data.deals.map(d => `
            <div class="gs-item" onclick="navigateToDeal(${d.id})">
              <div class="gs-item-title">${d.title}</div>
              <div class="gs-item-sub">Khách: ${d.contact_name || '?'} · Giá trị: ${formatCurrency(d.estimated_value)}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (data.products.length > 0) {
      html += `
        <div class="gs-group">
          <div class="gs-group-title">Sản phẩm</div>
          ${data.products.map(p => `
            <div class="gs-item" onclick="navigateToProducts()">
              <div class="gs-item-title">${p.name}</div>
              <div class="gs-item-sub">${p.category || 'Chưa phân loại'} · ${formatCurrency(p.price)}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    searchResults.innerHTML = html;
  } catch (error) {
    console.error(error);
    searchResults.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--red);">Lỗi tìm kiếm</div>';
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
