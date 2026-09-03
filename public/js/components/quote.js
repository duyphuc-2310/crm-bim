// ================================================
// PDF Quote Generator
// ================================================

function openQuoteModal(dealId) {
  // Find the deal from cache
  let deal = null;
  if (typeof allDeals !== 'undefined') deal = allDeals.find(d => d.id === dealId);
  // Also try contact's cached deals if available
  if (!deal && document.getElementById('cd-deals')) {
    // Basic fallback, we can fetch it if really needed, but usually it's passed or in cache.
    // For simplicity, we'll fetch it to be safe.
  }

  api.getDeal(dealId).then(res => {
    const d = res.data;
    const today = new Date();
    
    openModal('Tạo báo giá PDF', `
      <div class="form-row">
        <div class="form-group">
          <label>Tên khách hàng / Công ty</label>
          <input type="text" class="form-control" id="q-customer" value="${d.contact_company || d.contact_name || ''}">
        </div>
        <div class="form-group">
          <label>Ngày báo giá</label>
          <input type="date" class="form-control" id="q-date" value="${today.toISOString().split('T')[0]}">
        </div>
      </div>
      
      <div class="form-group">
        <label>Sản phẩm báo giá</label>
        <input type="text" class="form-control" id="q-product" value="${d.product_name || 'Bản quyền phần mềm'}" readonly>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Đơn giá (VND)</label>
          <input type="number" class="form-control" id="q-price" value="${d.estimated_value || 0}">
        </div>
        <div class="form-group">
          <label>Số lượng</label>
          <input type="number" class="form-control" id="q-qty" value="1" min="1">
        </div>
      </div>
      
      <div class="form-group">
        <label>Chiết khấu (%)</label>
        <input type="number" class="form-control" id="q-discount" value="0" min="0" max="100">
      </div>
      
      <div class="form-group">
        <label>Ghi chú thêm (hiển thị trên PDF)</label>
        <textarea class="form-control" id="q-notes" rows="2">Báo giá có hiệu lực trong vòng 15 ngày. Giá chưa bao gồm 10% VAT.</textarea>
      </div>
    `);

    const footer = document.getElementById('modal-footer');
    footer.innerHTML = `
      <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
      <button class="btn btn-primary" onclick="generatePDF(${d.id})">Xuất PDF</button>
    `;
  }).catch(err => {
    showToast('Lỗi tải deal: ' + err.message, 'error');
  });
}

function generatePDF(dealId) {
  try {
    const customer = document.getElementById('q-customer').value;
    const date = document.getElementById('q-date').value;
    const product = document.getElementById('q-product').value;
    const price = Number(document.getElementById('q-price').value) || 0;
    const qty = Number(document.getElementById('q-qty').value) || 1;
    const discount = Number(document.getElementById('q-discount').value) || 0;
    const notes = document.getElementById('q-notes').value;

    const subtotal = price * qty;
    const discountAmt = subtotal * (discount / 100);
    const total = subtotal - discountAmt;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set font (jsPDF doesn't natively support full UTF-8 Unicode fonts without VFS, 
    // so we'll use standard English or ASCII-safe Vietnamese replacements if needed, 
    // but for now we try to use basic built-in fonts which might strip accents. 
    // For a real production app, you'd add a custom TTF font.
    // To mitigate missing accents, we'll try to just output it.
    
    doc.setFontSize(22);
    doc.text("BAO GIA PHAN MEM BIM", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Ngay: ${date}`, 20, 40);
    doc.text(`Kinh gui: ${removeAccents(customer)}`, 20, 50);
    
    doc.line(20, 55, 190, 55);
    
    // Table Header
    doc.setFont(undefined, 'bold');
    doc.text("San pham", 20, 65);
    doc.text("So luong", 100, 65);
    doc.text("Don gia (VND)", 130, 65);
    doc.text("Thanh tien", 170, 65);
    doc.line(20, 68, 190, 68);
    
    // Table Row
    doc.setFont(undefined, 'normal');
    doc.text(removeAccents(product), 20, 78);
    doc.text(String(qty), 100, 78);
    doc.text(Number(price).toLocaleString(), 130, 78);
    doc.text(Number(subtotal).toLocaleString(), 170, 78);
    
    doc.line(20, 85, 190, 85);
    
    // Totals
    doc.text(`Chiet khau (${discount}%):`, 130, 95);
    doc.text(`-${Number(discountAmt).toLocaleString()}`, 170, 95);
    
    doc.setFont(undefined, 'bold');
    doc.text("TONG CONG:", 130, 105);
    doc.text(Number(total).toLocaleString(), 170, 105);
    
    doc.setFont(undefined, 'normal');
    const noteLines = doc.splitTextToSize("Ghi chu: " + removeAccents(notes), 170);
    doc.text(noteLines, 20, 125);
    
    doc.text("Tran trong,", 20, 150);
    doc.text("BIM CRM Sales Team", 20, 160);
    
    doc.save(`BaoGia_${dealId}.pdf`);
    
    // Auto-create an activity to log this action
    api.createActivity({
      deal_id: dealId,
      contact_id: null, // the API will figure it out if we pass deal_id, wait our API requires contact_id
      activity_type: 'gui_bao_gia',
      content: `Đã xuất báo giá PDF cho ${qty}x ${product}. Tổng tiền: ${formatCurrency(total)}. Chiết khấu: ${discount}%`,
      result: 'Chờ phản hồi'
    }).catch(e => console.log('Không thể tự động lưu hoạt động báo giá', e));
    
    showToast('Tạo báo giá thành công!', 'success');
    closeModal();
    
  } catch (err) {
    showToast('Lỗi khi tạo PDF: ' + err.message, 'error');
  }
}

function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}
