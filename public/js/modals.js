// ================================================
// Modals – Forms for Add/Edit
// ================================================
let cachedContacts = [];
let cachedProducts = [];

async function loadCachedData() {
  try {
    const [c, p] = await Promise.all([api.getContacts(), api.getProducts()]);
    cachedContacts = c.data;
    cachedProducts = p.data;
  } catch(e) {}
}

// ---- DEAL MODAL ----
let editingDealId = null;

async function openAddDealModal(stage = null, contactId = null) {
  editingDealId = null;
  await loadCachedData();
  openModal('Thêm Deal mới', getDealForm({ stage: stage || 1, contact_id: contactId }));
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
    <button class="btn btn-primary" onclick="saveDeal()">Tạo Deal</button>
  `;
}

async function openEditDealModal(id) {
  editingDealId = id;
  await loadCachedData();
  try {
    const { data } = await api.getDeal(id);
    openModal('Sửa Deal', getDealForm(data));
    document.getElementById('modal-footer').innerHTML = `
      <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
      <button class="btn btn-primary" onclick="saveDeal()">Lưu thay đổi</button>
    `;
  } catch(e) {}
}

function getDealProductRowHtml(productId = '', price = '') {
  return `
    <div class="deal-product-row" style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
      <select class="form-control dp-select" style="flex:2" onchange="updateDealTotal()">
        <option value="">-- Chọn sản phẩm --</option>
        ${cachedProducts.map(p => `<option value="${p.id}" ${productId==p.id?'selected':''}>${p.name}</option>`).join('')}
      </select>
      <input type="number" class="form-control dp-price" style="flex:1" value="${price}" placeholder="Giá (VND)" oninput="updateDealTotal()">
      <button type="button" class="btn btn-icon btn-ghost btn-sm" onclick="this.parentElement.remove(); updateDealTotal();" style="color:var(--red)">✕</button>
    </div>
  `;
}

function addDealProductRow() {
  const container = document.getElementById('f-deal-products-container');
  if (container) {
    container.insertAdjacentHTML('beforeend', getDealProductRowHtml());
  }
}

function updateDealTotal() {
  const priceInputs = document.querySelectorAll('.dp-price');
  let total = 0;
  priceInputs.forEach(input => {
    total += Number(input.value) || 0;
  });
  const totalEl = document.getElementById('f-deal-total');
  if (totalEl) totalEl.textContent = formatCurrency(total);
}

function getDealForm(d = {}) {
  const existingProducts = d.products || [];
  let productsHtml = '';
  if (existingProducts.length === 0) {
    productsHtml = getDealProductRowHtml();
  } else {
    productsHtml = existingProducts.map(p => getDealProductRowHtml(p.id, p.price)).join('');
  }

  return `
    <div class="form-group">
      <label>Tên Deal *</label>
      <input class="form-control" id="f-deal-title" value="${d.title||''}" placeholder="VD: ArchiCAD 27 - Công ty ABC (3 license)">
    </div>
    <div class="form-group">
      <label>Khách hàng *</label>
      <select class="form-control" id="f-deal-contact">
        <option value="">-- Chọn khách hàng --</option>
        ${cachedContacts.map(c => `<option value="${c.id}" ${d.contact_id==c.id?'selected':''}>${c.name}${c.company?' ('+c.company+')':''}</option>`).join('')}
      </select>
    </div>
    
    <div class="form-group" style="background:var(--bg-lighter); padding:16px; border-radius:8px; border:1px solid var(--border);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <label style="margin:0">Sản phẩm trong Deal</label>
        <button type="button" class="btn btn-sm btn-ghost" onclick="addDealProductRow()">+ Thêm SP</button>
      </div>
      <div id="f-deal-products-container">
        ${productsHtml}
      </div>
      <div style="text-align:right; margin-top:12px; font-weight:bold;">
        Tổng tiền: <span id="f-deal-total" style="color:var(--green)">0 ₫</span>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Giai đoạn</label>
        <select class="form-control" id="f-deal-stage">
          ${STAGE_NAMES.slice(1).map((n,i)=>`<option value="${i+1}" ${d.stage==i+1?'selected':''}>${n}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Xác suất chốt (%)</label>
        <input class="form-control" id="f-deal-prob" type="number" min="0" max="100" value="${d.probability||10}" placeholder="10-90">
      </div>
    </div>
    <div class="form-group">
      <label>Follow-up tiếp theo</label>
      <input class="form-control" id="f-deal-followup" type="date" value="${d.next_followup_date ? d.next_followup_date.split('T')[0] : ''}">
    </div>
    <div class="form-group">
      <label>Ghi chú</label>
      <textarea class="form-control" id="f-deal-notes" rows="3" placeholder="Ghi chú về deal, yêu cầu đặc biệt...">${d.notes||''}</textarea>
    </div>
    <script>setTimeout(updateDealTotal, 100);</script>
  `;
}

async function saveDeal() {
  const title = document.getElementById('f-deal-title')?.value?.trim();
  const contact_id = document.getElementById('f-deal-contact')?.value;
  const probability = document.getElementById('f-deal-prob')?.value || 10;
  const stage = document.getElementById('f-deal-stage')?.value || 1;
  const next_followup_date = document.getElementById('f-deal-followup')?.value || null;
  const notes = document.getElementById('f-deal-notes')?.value?.trim();

  // Gather products
  const products = [];
  const rows = document.querySelectorAll('.deal-product-row');
  rows.forEach(r => {
    const pId = r.querySelector('.dp-select').value;
    const pPrice = r.querySelector('.dp-price').value;
    if (pId) {
      products.push({ id: pId, price: pPrice || 0 });
    }
  });

  if (!title) { showToast('Nhập tên deal!', 'error'); return; }
  if (!contact_id) { showToast('Chọn khách hàng!', 'error'); return; }

  const d = { title, contact_id, products, probability, stage, next_followup_date, notes };

  try {
    if (editingDealId) {
      await api.updateDeal(editingDealId, d);
      showToast('Đã cập nhật deal!', 'success');
    } else {
      await api.createDeal(d);
      showToast('Đã tạo deal mới!', 'success');
    }
    closeModal();
    if (typeof loadDealsTable === 'function' && allDeals.length >= 0) loadDealsTable();
    if (document.querySelector('.kanban-board')) loadKanban();
  } catch(err) {}
}

// handleContactChange removed as auto-suggesting single product is incompatible with multi-product array

// ---- CONTACT MODAL ----
let editingContactId = null;

function openAddContactModal() {
  editingContactId = null;
  openModal('Thêm khách hàng mới', getContactForm());
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
    <button class="btn btn-primary" onclick="saveContact()">Thêm khách hàng</button>
  `;
}

async function openEditContactModal(id) {
  editingContactId = id;
  try {
    const { data } = await api.getContact(id);
    openModal('Sửa thông tin khách hàng', getContactForm(data));
    document.getElementById('modal-footer').innerHTML = `
      <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
      <button class="btn btn-primary" onclick="saveContact()">Lưu thay đổi</button>
    `;
  } catch(e) {}
}

function getContactForm(c = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Họ và tên *</label>
        <input class="form-control" id="f-contact-name" value="${c.name||''}" placeholder="Nguyễn Văn A">
      </div>
      <div class="form-group">
        <label>Công ty / Tổ chức</label>
        <input class="form-control" id="f-contact-company" value="${c.company||''}" placeholder="Công ty CP Kiến trúc XYZ">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Số điện thoại</label>
        <input class="form-control" id="f-contact-phone" value="${c.phone||''}" placeholder="0901234567">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input class="form-control" id="f-contact-email" type="email" value="${c.email||''}" placeholder="email@company.vn">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Loại hình tổ chức</label>
        <select class="form-control" id="f-contact-org">
          ${Object.entries(ORG_TYPE_LABELS).map(([v,l])=>`<option value="${v}" ${c.org_type===v?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Mức độ trưởng thành BIM</label>
        <select class="form-control" id="f-contact-bim">
          ${Object.entries(BIM_MATURITY_LABELS).map(([v,l])=>`<option value="${v}" ${c.bim_maturity===v?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Ghi chú</label>
      <textarea class="form-control" id="f-contact-notes" rows="3" placeholder="Ghi chú về khách hàng, nhu cầu, đặc điểm...">${c.notes||''}</textarea>
    </div>
  `;
}

async function saveContact() {
  const d = {
    name: document.getElementById('f-contact-name')?.value?.trim(),
    company: document.getElementById('f-contact-company')?.value?.trim(),
    phone: document.getElementById('f-contact-phone')?.value?.trim(),
    email: document.getElementById('f-contact-email')?.value?.trim(),
    org_type: document.getElementById('f-contact-org')?.value,
    bim_maturity: document.getElementById('f-contact-bim')?.value,
    notes: document.getElementById('f-contact-notes')?.value?.trim()
  };
  if (!d.name) { showToast('Nhập tên khách hàng!', 'error'); return; }
  try {
    if (editingContactId) {
      await api.updateContact(editingContactId, d);
      showToast('Đã cập nhật khách hàng!', 'success');
    } else {
      await api.createContact(d);
      showToast('Đã thêm khách hàng mới!', 'success');
    }
    closeModal();
    if (typeof loadContacts === 'function') loadContacts();
  } catch(err) {}
}

// ---- ACTIVITY MODAL ----
async function openAddActivityModal(dealId = null, contactId = null) {
  await loadCachedData();
  openModal('Ghi chú hoạt động', getActivityForm(dealId, contactId));
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
    <button class="btn btn-primary" onclick="saveActivity(${dealId})">Lưu hoạt động</button>
  `;
}

function getActivityForm(dealId, contactId) {
  const now = new Date().toISOString().slice(0, 16);
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Khách hàng *</label>
        <select class="form-control" id="f-act-contact">
          <option value="">-- Chọn khách hàng --</option>
          ${cachedContacts.map(c => `<option value="${c.id}" ${contactId==c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Loại hoạt động</label>
        <select class="form-control" id="f-act-type">
          ${Object.entries(ACTIVITY_TYPE_LABELS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Liên kết Deal</label>
        <select class="form-control" id="f-act-deal">
          <option value="">-- Không có deal --</option>
          ${cachedContacts.length ? '' : ''}
        </select>
      </div>
      <div class="form-group">
        <label>Thời gian</label>
        <input class="form-control" id="f-act-date" type="datetime-local" value="${now}">
      </div>
    </div>
    <div class="form-group">
      <label>Nội dung trao đổi *</label>
      <textarea class="form-control" id="f-act-content" rows="3" placeholder="Đã trao đổi về..."></textarea>
    </div>
    <div class="form-group">
      <label>Kết quả / Phản hồi</label>
      <textarea class="form-control" id="f-act-result" rows="2" placeholder="Khách hàng phản hồi..."></textarea>
    </div>
    <div class="form-group">
      <label>Đính kèm file (PDF, ảnh...)</label>
      <input type="file" class="form-control" id="f-act-file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg">
    </div>
  `;
}

async function saveActivity(dealId = null) {
  const contactId = document.getElementById('f-act-contact')?.value;
  const content = document.getElementById('f-act-content')?.value?.trim();
  if (!contactId) { showToast('Chọn khách hàng!', 'error'); return; }
  if (!content) { showToast('Nhập nội dung hoạt động!', 'error'); return; }

  const fileInput = document.getElementById('f-act-file');
  let data;
  if (fileInput && fileInput.files.length > 0) {
    data = new FormData();
    data.append('contact_id', contactId);
    data.append('activity_type', document.getElementById('f-act-type')?.value);
    data.append('deal_id', dealId || document.getElementById('f-act-deal')?.value || '');
    data.append('activity_date', document.getElementById('f-act-date')?.value);
    data.append('content', content);
    data.append('result', document.getElementById('f-act-result')?.value?.trim() || '');
    data.append('attachment', fileInput.files[0]);
  } else {
    data = {
      contact_id: contactId,
      activity_type: document.getElementById('f-act-type')?.value,
      deal_id: dealId || document.getElementById('f-act-deal')?.value || null,
      activity_date: document.getElementById('f-act-date')?.value,
      content: content,
      result: document.getElementById('f-act-result')?.value?.trim()
    };
  }

  try {
    await api.createActivity(data);
    showToast('Đã lưu hoạt động!', 'success');
    closeModal();
    if (dealId) openDealDetail(dealId);
    else if (typeof loadActivitiesList === 'function') loadActivitiesList();
  } catch(err) {
    showToast(err.message || 'Lỗi khi lưu hoạt động', 'error');
  }
}

// ---- FOLLOWUP MODAL ----
async function openAddFollowupModal(dealId = null, contactId = null) {
  await loadCachedData();
  openModal('Thêm nhắc việc', getFollowupForm(dealId, contactId));
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
    <button class="btn btn-primary" onclick="saveFollowup(${dealId})">Tạo nhắc việc</button>
  `;
}

function getFollowupForm(dealId, contactId) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  return `
    <div class="form-row">
      <div class="form-group">
        <label>Khách hàng *</label>
        <select class="form-control" id="f-fu-contact">
          <option value="">-- Chọn khách hàng --</option>
          ${cachedContacts.map(c => `<option value="${c.id}" ${contactId==c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Ngày cần làm *</label>
        <input class="form-control" id="f-fu-date" type="date" value="${tomorrowStr}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Mức ưu tiên</label>
        <select class="form-control" id="f-fu-priority">
          <option value="high">🔴 Cao</option>
          <option value="medium" selected>🟡 Trung bình</option>
          <option value="low">🟢 Thấp</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Nội dung cần làm *</label>
      <textarea class="form-control" id="f-fu-content" rows="3" placeholder="Gọi điện hỏi thăm kết quả báo giá, Hẹn demo, Gửi tài liệu..."></textarea>
    </div>
  `;
}

async function saveFollowup(dealId = null) {
  const d = {
    contact_id: document.getElementById('f-fu-contact')?.value,
    deal_id: dealId || null,
    due_date: document.getElementById('f-fu-date')?.value,
    priority: document.getElementById('f-fu-priority')?.value,
    content: document.getElementById('f-fu-content')?.value?.trim()
  };
  if (!d.contact_id) { showToast('Chọn khách hàng!', 'error'); return; }
  if (!d.due_date) { showToast('Chọn ngày!', 'error'); return; }
  if (!d.content) { showToast('Nhập nội dung!', 'error'); return; }
  try {
    await api.createFollowup(d);
    showToast('Đã tạo nhắc việc!', 'success');
    closeModal();
    updateFollowupBadge();
    if (dealId) openDealDetail(dealId);
    else if (typeof loadFollowupsList === 'function') loadFollowupsList();
  } catch(err) {}
}

// ---- GLOBAL ADD ----
function openGlobalAdd() {
  const currentPage = document.querySelector('.nav-item.active')?.dataset.page;
  if (currentPage === 'contacts') openAddContactModal();
  else if (currentPage === 'deals' || currentPage === 'kanban') openAddDealModal();
  else if (currentPage === 'followups') openAddFollowupModal();
  else if (currentPage === 'activities') openAddActivityModal();
  else if (currentPage === 'products') openAddProductModal();
  else openAddDealModal();
}
