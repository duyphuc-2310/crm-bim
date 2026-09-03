// ================================================
// Products Component
// ================================================
async function renderProducts() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="page-filters">
      <button class="btn btn-primary" onclick="openAddProductModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Thêm sản phẩm
      </button>
    </div>
    <div id="products-container">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;
  loadProducts();
}

async function loadProducts() {
  const el = document.getElementById('products-container');
  if (!el) return;
  try {
    const { data } = await api.getProducts();
    if (data.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><h3>Chưa có sản phẩm</h3></div>';
      return;
    }
    const groups = {};
    data.forEach(p => {
      if (!groups[p.product_group]) groups[p.product_group] = [];
      groups[p.product_group].push(p);
    });
    el.innerHTML = Object.entries(groups).map(([group, products]) => `
      <div style="margin-bottom:24px">
        <div style="font-size:13px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px">
          ${PRODUCT_GROUP_ICONS[group]} ${PRODUCT_GROUP_LABELS[group]||group}
        </div>
        <div class="product-grid">
          ${products.map(p => `
            <div class="product-card">
              <div class="product-group-icon" style="background:rgba(99,102,241,0.1)">
                ${PRODUCT_GROUP_ICONS[p.product_group]||'📦'}
              </div>
              <div class="product-name">${p.name}</div>
              <div class="product-desc">${p.description||'Chưa có mô tả'}</div>
              <div class="product-price">${formatCurrency(p.ref_price)}</div>
              <div class="product-actions">
                <button class="btn btn-ghost btn-sm" onclick="openEditProductModal(${p.id})">✏️ Sửa</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">🗑️ Xóa</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  } catch(err) {
    el.innerHTML = '<div class="empty-state"><p>Lỗi tải dữ liệu</p></div>';
  }
}

async function deleteProduct(id) {
  if (!confirm('Xóa sản phẩm này?')) return;
  try {
    await api.deleteProduct(id);
    showToast('Đã xóa sản phẩm', 'success');
    loadProducts();
  } catch(err) {}
}

let editingProductId = null;
async function openEditProductModal(id) {
  editingProductId = id;
  try {
    const { data } = await api.getProducts();
    const p = data.find(x => x.id === id);
    if (!p) return;
    openModal('Sửa sản phẩm', getProductForm(p));
    document.getElementById('modal-footer').innerHTML = `
      <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
      <button class="btn btn-primary" onclick="saveProduct()">Lưu thay đổi</button>
    `;
  } catch(err) {}
}

function openAddProductModal() {
  editingProductId = null;
  openModal('Thêm sản phẩm mới', getProductForm());
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
    <button class="btn btn-primary" onclick="saveProduct()">Thêm sản phẩm</button>
  `;
}

function getProductForm(p = {}) {
  return `
    <div class="form-group">
      <label>Tên sản phẩm *</label>
      <input class="form-control" id="f-product-name" value="${p.name||''}" placeholder="ArchiCAD 27, Solibri...">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Nhóm sản phẩm</label>
        <select class="form-control" id="f-product-group">
          ${Object.entries(PRODUCT_GROUP_LABELS).map(([v,l])=>`<option value="${v}" ${p.product_group===v?'selected':''}>${PRODUCT_GROUP_ICONS[v]} ${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Giá tham khảo (VND)</label>
        <input class="form-control" id="f-product-price" type="number" value="${p.ref_price||''}" placeholder="45000000">
      </div>
    </div>
    <div class="form-group">
      <label>Mô tả</label>
      <textarea class="form-control" id="f-product-desc" rows="3">${p.description||''}</textarea>
    </div>
  `;
}

async function saveProduct() {
  const d = {
    name: document.getElementById('f-product-name')?.value?.trim(),
    product_group: document.getElementById('f-product-group')?.value,
    ref_price: document.getElementById('f-product-price')?.value || 0,
    description: document.getElementById('f-product-desc')?.value?.trim()
  };
  if (!d.name) { showToast('Nhập tên sản phẩm!', 'error'); return; }
  try {
    if (editingProductId) {
      await api.updateProduct(editingProductId, d);
      showToast('Đã cập nhật sản phẩm', 'success');
    } else {
      await api.createProduct(d);
      showToast('Đã thêm sản phẩm!', 'success');
    }
    closeModal();
    loadProducts();
  } catch(err) {}
}
