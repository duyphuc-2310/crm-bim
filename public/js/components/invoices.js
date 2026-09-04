// ================================================
// Invoices (Won Deals) Component
// ================================================

async function renderInvoices() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">Danh sách Hóa Đơn (Deal Đã Chốt)</h2>
      <button class="btn btn-primary" onclick="exportInvoicesToCSV()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Xuất Excel Toàn Bộ Hóa Đơn
      </button>
    </div>
    
    <div class="card">
      <div id="invoices-list">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `;
  loadInvoicesList();
}

async function loadInvoicesList() {
  const el = document.getElementById('invoices-list');
  if (!el) return;
  try {
    const { data } = await api.getDeals('?status=won');
    if (!data || data.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📄</div><h3>Chưa có hóa đơn nào</h3><p>Các deal sau khi đánh dấu "Thắng" sẽ xuất hiện ở đây.</p></div>';
      return;
    }
    
    el.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Tên Deal (Sản phẩm)</th>
              <th>Giá trị Hóa đơn</th>
              <th>Ngày chốt</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(d => `
              <tr>
                <td>
                  <strong>${d.contact_name || ''}</strong><br>
                  <span style="font-size:12px; color:var(--text-secondary)">${d.contact_company || ''}</span>
                </td>
                <td>
                  ${d.title}<br>
                  <span class="badge" style="background:var(--bg-lighter); color:var(--text-secondary); margin-top:4px;">${d.product_name || 'Không xác định'}</span>
                </td>
                <td style="color:var(--green); font-weight:bold;">${formatCurrency(d.estimated_value)}</td>
                <td>${formatDate(d.updated_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error(error);
    el.innerHTML = '<div class="empty-state">Lỗi khi tải dữ liệu hóa đơn.</div>';
  }
}

async function exportInvoicesToCSV(contactId = null) {
  try {
    showToast('⏳ Đang tạo file báo cáo hóa đơn...', 'info');
    let query = '?status=won';
    if (contactId) {
      query += '&contact_id=' + contactId;
    }
    const { data } = await api.getDeals(query);
    
    if (!data || data.length === 0) {
      showToast('Không có hóa đơn nào để xuất.', 'warning');
      return;
    }

    const headers = [
      'Tên Deal', 'Khách hàng', 'Công ty', 'Số điện thoại', 'Sản phẩm',
      'Giá trị Hóa đơn (VND)', 'Ngày chốt', 'Ghi chú'
    ];
    
    function fmtDateExact(d) {
      if (!d) return '';
      const dt = new Date(d);
      if (isNaN(dt)) return '';
      return \`\${String(dt.getDate()).padStart(2,'0')}/\${String(dt.getMonth()+1).padStart(2,'0')}/\${dt.getFullYear()}\`;
    }

    const rows = data.map(d => [
      d.title || '',
      d.contact_name || '',
      d.contact_company || '',
      d.contact_phone || '',
      d.product_name || 'Không xác định',
      d.estimated_value || '0',
      fmtDateExact(d.updated_at),
      (d.notes || '').replace(/\\n/g, ' ')
    ]);

    let csvContent = "\\uFEFF" + headers.join(',') + '\\n';
    rows.forEach(r => {
      const escaped = r.map(field => {
        if (field === null || field === undefined) return '""';
        let str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\\n')) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      });
      csvContent += escaped.join(',') + '\\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const prefix = contactId ? 'HoaDon_KhachHang_' + contactId : 'ToanBo_HoaDon';
    a.download = \`\${prefix}_\${new Date().toISOString().slice(0,10)}.csv\`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ Tải file Excel thành công', 'success');
  } catch (error) {
    console.error(error);
    showToast('Lỗi khi tải file', 'error');
  }
}
