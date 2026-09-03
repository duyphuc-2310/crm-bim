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

function getDealForm(d = {}) {
  const todayStr = new Date().toISOString().split('T')[0];
  return `
    <div class="form-group">
      <label>Tên Deal *</label>
      <input class="form-control" id="f-deal-title" value="${d.title||''}" placeholder="VD: ArchiCAD 27 - Công ty ABC (3 license)">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Khách hàng *</label>
        <select class="form-control" id="f-deal-contact" onchange="handleContactChange(this.value)">
          <option value="">-- Chọn khách hàng --</option>
          ${cachedContacts.map(c => `<option value="${c.id}" ${d.contact_id==c.id?'selected':''}>${c.name}${c.company?' ('+c.company+')':''}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Sản phẩm</label>
        <select class="form-control" id="f-deal-product">
          <option value="">-- Chọn sản phẩm --</option>
          ${cachedProducts.map(p => `<option value="${p.id}" ${d.product_id==p.id?'selected':''}>${p.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Giá trị ước tính (VND)</label>
        <input class="form-control" id="f-deal-value" type="number" value="${d.estimated_value||''}" placeholder="45000000">
      </div>
      <div class="form-group">
        <label>Xác suất chốt (%)</label>
        <input class="form-control" id="f-deal-prob" type="number" min="0" max="100" value="${d.probability||10}" placeholder="10-90">
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
        <label>Follow-up tiếp theo</label>
        <input class="form-control" id="f-deal-followup" type="date" value="${d.next_followup_date ? d.next_followup_date.split('T')[0] : ''}">
      </div>
    </div>
    <div class="form-group">
      <label>Ghi chú</label>
      <textarea class="form-control" id="f-deal-notes" rows="3" placeholder="Ghi chú về deal, yêu cầu đặc biệt...">${d.notes||''}</textarea>
    </div>
  `;
}

async function saveDeal() {
  const d = {
    title: document.getElementById('f-deal-title')?.value?.trim(),
    contact_id: document.getElementById('f-deal-contact')?.value,
    product_id: document.getElementById('f-deal-product')?.value || null,
    estimated_value: document.getElementById('f-deal-value')?.value || 0,
    probability: document.getElementById('f-deal-prob')?.value || 10,
    stage: document.getElementById('f-deal-stage')?.value || 1,
    next_followup_date: document.getElementById('f-deal-followup')?.value || null,
    notes: document.getElementById('f-deal-notes')?.value?.trim()
  };
  if (!d.title) { showToast('Nhập tên deal!', 'error'); return; }
  if (!d.contact_id) { showToast('Chọn khách hàng!', 'error'); return; }
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

function handleContactChange(contactId) {
  if (!contactId) return;
  const contact = cachedContacts.find(c => c.id == contactId);
  if (!contact) return;
  
  const productSelect = document.getElementById('f-deal-product');
  if (!productSelect || productSelect.value) return; // Only suggest if empty
  
  let suggestedProduct = null;
  // Suggest ARCHICAD for designers
  if (contact.org_type === 'kts_doc_lap' || contact.org_type === 'cty_thiet_ke') {
    suggestedProduct = cachedProducts.find(p => p.name.includes('ARCHICAD'));
  }
  // Suggest Solibri or BIMcloud for owners/contractors
  else if (contact.org_type === 'chu_dau_tu' || contact.org_type === 'tong_thau') {
    suggestedProduct = cachedProducts.find(p => p.name.includes('Solibri') || p.name.includes('BIMcloud'));
  }
  
  if (suggestedProduct) {
    productSelect.value = suggestedProduct.id;
    showToast('💡 Đã tự động gợi ý sản phẩm phù hợp với khách hàng', 'info');
  }
}

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
