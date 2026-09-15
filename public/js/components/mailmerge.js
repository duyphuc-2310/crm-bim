// Mail Merge UI Logic
let mailMergeRecipients = [];

function initMailMerge() {
  document.getElementById('mailmerge-view').innerHTML = `
    <div class="content-header">
      <h2>📧 Gửi Email Hàng Loạt (Mail Merge)</h2>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-outline" onclick="openContactSelector()">➕ Chọn Khách Hàng</button>
      </div>
    </div>
    
    <div class="mailmerge-container" style="display:flex; gap: 20px; align-items: flex-start;">
      <!-- Editor Side -->
      <div class="mailmerge-editor panel" style="flex: 2; padding: 20px;">
        <div style="margin-bottom: 15px;">
          <label>Chủ đề (Subject):</label>
          <input type="text" id="mm-subject" class="form-control" placeholder="Ví dụ: Giới thiệu giải pháp BIM cho {{ten_cong_ty}}" />
        </div>
        
        <div style="margin-bottom: 10px; display:flex; justify-content: space-between; align-items:center;">
          <label>Nội dung Email (Hỗ trợ HTML):</label>
          <div class="dropdown">
            <button class="btn btn-sm btn-ghost">Thêm biến ▾</button>
            <div class="dropdown-content">
              <a href="#" onclick="insertMMVar('{{ten}}');return false;">{{ten}} - Tên khách hàng</a>
              <a href="#" onclick="insertMMVar('{{ten_cong_ty}}');return false;">{{ten_cong_ty}} - Tên công ty</a>
              <a href="#" onclick="insertMMVar('{{sdt}}');return false;">{{sdt}} - Số điện thoại</a>
            </div>
          </div>
        </div>
        
        <textarea id="mm-body" class="form-control" rows="12" placeholder="Kính gửi anh/chị {{ten}},\n\nEm là..."></textarea>
        
        <div style="margin-top: 15px;">
          <label>Đính kèm file (Attachments):</label>
          <input type="file" id="mm-attachments" class="form-control" multiple />
        </div>
      </div>
      
      <!-- Preview Side -->
      <div class="mailmerge-preview panel" style="flex: 1; padding: 20px; position: sticky; top: 80px;">
        <h3>Danh sách người nhận (<span id="mm-count">0</span>)</h3>
        <div id="mm-recipients-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 20px; border: 1px solid var(--border); border-radius: 8px; padding: 10px; background: var(--bg-input);">
          <em style="color:var(--text-muted)">Chưa có người nhận nào. Bấm "Chọn Khách Hàng" ở trên.</em>
        </div>
        
        <h3>Xem trước (Preview)</h3>
        <div id="mm-preview-box" style="border: 1px dashed var(--border); padding: 15px; border-radius: 8px; min-height: 150px; background: var(--bg-card); font-size: 13px;">
          <em style="color:var(--text-muted)">Preview sẽ hiển thị ở đây...</em>
        </div>
        
        <div style="margin-top: 20px; text-align: right;">
          <button class="btn btn-primary" onclick="sendMailMerge()" id="btn-send-mm" style="width: 100%;">🚀 Gửi Tất Cả</button>
        </div>
      </div>
    </div>
  `;

  // Listen for changes to update preview
  setTimeout(() => {
    document.getElementById('mm-subject').addEventListener('input', updateMMPreview);
    document.getElementById('mm-body').addEventListener('input', updateMMPreview);
  }, 100);
}

function insertMMVar(variable) {
  const textarea = document.getElementById('mm-body');
  const startPos = textarea.selectionStart;
  const endPos = textarea.selectionEnd;
  const text = textarea.value;
  textarea.value = text.substring(0, startPos) + variable + text.substring(endPos, text.length);
  textarea.focus();
  textarea.selectionStart = startPos + variable.length;
  textarea.selectionEnd = startPos + variable.length;
  updateMMPreview();
}

async function openContactSelector() {
  try {
    const { data } = await api.getContacts();
    const validContacts = data.filter(c => c.email); // Only contacts with emails
    
    let html = `
      <div class="modal-backdrop" id="mm-contact-modal">
        <div class="modal">
          <div class="modal-header">
            <h3>Chọn Khách Hàng Nhận Email</h3>
            <button class="btn-close" onclick="document.getElementById('mm-contact-modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom:10px; color:var(--text-muted); font-size: 13px;">Chỉ hiển thị những khách hàng có nhập Email.</p>
            <div style="max-height: 300px; overflow-y: auto;">
              <table class="table">
                <thead>
                  <tr>
                    <th width="40"><input type="checkbox" id="mm-select-all" onchange="toggleAllMMContacts(this)"></th>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Công ty</th>
                  </tr>
                </thead>
                <tbody id="mm-contact-tbody">
                  ${validContacts.map(c => `
                    <tr>
                      <td><input type="checkbox" class="mm-contact-cb" value='${JSON.stringify({id: c.id, name: c.name, email: c.email, company: c.company, phone: c.phone}).replace(/'/g, "&#39;")}'></td>
                      <td>${c.name}</td>
                      <td>${c.email}</td>
                      <td>${c.company || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="document.getElementById('mm-contact-modal').remove()">Hủy</button>
            <button class="btn btn-primary" onclick="confirmMMContacts()">Xác Nhận</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  } catch (err) {
    showToast('Lỗi tải danh sách khách hàng', 'error');
  }
}

function toggleAllMMContacts(source) {
  const checkboxes = document.querySelectorAll('.mm-contact-cb');
  checkboxes.forEach(cb => cb.checked = source.checked);
}

function confirmMMContacts() {
  const checkboxes = document.querySelectorAll('.mm-contact-cb:checked');
  mailMergeRecipients = [];
  checkboxes.forEach(cb => {
    mailMergeRecipients.push(JSON.parse(cb.value));
  });
  
  document.getElementById('mm-contact-modal').remove();
  renderMMRecipients();
  updateMMPreview();
}

function renderMMRecipients() {
  const list = document.getElementById('mm-recipients-list');
  document.getElementById('mm-count').textContent = mailMergeRecipients.length;
  
  if (mailMergeRecipients.length === 0) {
    list.innerHTML = '<em style="color:var(--text-muted)">Chưa có người nhận nào.</em>';
    return;
  }
  
  list.innerHTML = mailMergeRecipients.map((r, index) => `
    <div style="display:flex; justify-content:space-between; margin-bottom:5px; padding-bottom:5px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:12px;">
      <div><strong>${r.name}</strong> &lt;${r.email}&gt;</div>
      <span style="color:var(--red); cursor:pointer;" onclick="removeMMRecipient(${index})">✕</span>
    </div>
  `).join('');
}

function removeMMRecipient(index) {
  mailMergeRecipients.splice(index, 1);
  renderMMRecipients();
  updateMMPreview();
}

function updateMMPreview() {
  const subject = document.getElementById('mm-subject').value;
  let body = document.getElementById('mm-body').value;
  const previewBox = document.getElementById('mm-preview-box');
  
  if (!subject && !body) {
    previewBox.innerHTML = '<em style="color:var(--text-muted)">Preview sẽ hiển thị ở đây...</em>';
    return;
  }
  
  if (mailMergeRecipients.length === 0) {
    previewBox.innerHTML = '<em style="color:var(--text-muted)">Hãy chọn ít nhất 1 người nhận để xem preview.</em>';
    return;
  }
  
  // Use first recipient for preview
  const r = mailMergeRecipients[0];
  let pSubj = subject.replace(/{{ten}}/g, r.name).replace(/{{ten_cong_ty}}/g, r.company || '').replace(/{{sdt}}/g, r.phone || '');
  let pBody = body.replace(/{{ten}}/g, r.name).replace(/{{ten_cong_ty}}/g, r.company || '').replace(/{{sdt}}/g, r.phone || '');
  
  pBody = pBody.replace(/\n/g, '<br/>');
  
  previewBox.innerHTML = `
    <div style="margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:10px;">
      <strong>Đến:</strong> ${r.name} &lt;${r.email}&gt;<br>
      <strong>Chủ đề:</strong> ${pSubj}
    </div>
    <div>${pBody}</div>
  `;
}

async function sendMailMerge() {
  if (mailMergeRecipients.length === 0) return showToast('Chưa chọn người nhận', 'error');
  const subject = document.getElementById('mm-subject').value;
  const body = document.getElementById('mm-body').value;
  
  if (!subject || !body) return showToast('Vui lòng nhập đầy đủ Chủ đề và Nội dung', 'error');
  
  const files = document.getElementById('mm-attachments').files;
  
  const formData = new FormData();
  formData.append('recipients', JSON.stringify(mailMergeRecipients));
  formData.append('subjectTemplate', subject);
  formData.append('bodyTemplate', body);
  
  for (let i = 0; i < files.length; i++) {
    formData.append('attachments', files[i]);
  }
  
  const btn = document.getElementById('btn-send-mm');
  btn.disabled = true;
  btn.textContent = 'Đang gửi...';
  
  try {
    // We need to use fetch directly here because our api.js might not support FormData yet
    // Wait, let's update api.js to support it or just use fetch
    const response = await fetch('/api/mailmerge/send', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      showToast(`Đã gửi thành công ${result.sent} email!`, 'success');
      if (result.failed > 0) {
        alert(`Gửi thất bại ${result.failed} email. Xem console để biết chi tiết.`);
        console.error(result.errors);
      }
      // Log activities automatically
      for (const r of mailMergeRecipients) {
        if (result.errors && result.errors.some(e => e.email === r.email)) continue;
        await api.createActivity({
          contact_id: r.id,
          deal_id: null,
          activity_type: 'email',
          content: `Đã gửi email hàng loạt: ${subject.replace(/{{ten}}/g, r.name)}`,
          activity_date: new Date().toISOString().slice(0, 10)
        }).catch(e => console.log('Failed to log activity', e));
      }
    } else {
      showToast(result.error || 'Lỗi khi gửi email', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Lỗi mạng hoặc server', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🚀 Gửi Tất Cả';
  }
}
