// ================================================
// Analytics Component
// ================================================

async function renderAnalytics() {
  const container = document.getElementById('page-container');
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Đang tải dữ liệu thống kê...</div>`;
  
  try {
    const { data } = await api.getAnalytics();
    const { revenueByMonth, stageConversion, topProducts, monthlyTarget, thisMonth, activityByType } = data;

    container.innerHTML = `
      <div class="stats-grid" style="margin-bottom: 20px;">
        <div class="stat-card" style="--stat-color:#10b981;--stat-bg:rgba(16,185,129,0.15)">
          <div class="stat-label">Doanh thu tháng này</div>
          <div class="stat-value">${formatCurrency(thisMonth.revenue || 0)}</div>
          <div class="stat-sub">Mục tiêu: ${formatCurrency(monthlyTarget)}</div>
        </div>
        <div class="stat-card" style="--stat-color:#6366f1;--stat-bg:rgba(99,102,241,0.15)">
          <div class="stat-label">Số deal đã chốt (tháng này)</div>
          <div class="stat-value">${thisMonth.count || 0} deal</div>
          <div class="stat-sub">Đóng góp vào doanh thu</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card" style="grid-column: span 2;">
          <div class="card-header"><span class="card-title">Doanh thu 12 tháng qua</span></div>
          <div style="height: 300px; width: 100%;">
            <canvas id="revenueChart"></canvas>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header"><span class="card-title">Phễu chuyển đổi (Open & Won)</span></div>
          <div style="height: 250px; width: 100%;">
            <canvas id="funnelChart"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Sản phẩm bán chạy</span></div>
          <div class="table-responsive">
            <table class="table">
              <thead><tr><th>Sản phẩm</th><th>Deal thắng</th><th>Doanh thu</th></tr></thead>
              <tbody>
                ${topProducts.map(p => `
                  <tr>
                    <td><strong>${p.product_name}</strong><br><span style="font-size:11px;color:var(--text-secondary)">${p.product_group ? (PRODUCT_GROUP_LABELS[p.product_group]||p.product_group) : ''}</span></td>
                    <td>${p.deals_won}</td>
                    <td style="color:var(--green)">${formatCurrency(p.total_revenue)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header"><span class="card-title">Hoạt động 30 ngày qua</span></div>
          <div style="height: 250px; width: 100%;">
            <canvas id="activityChart"></canvas>
          </div>
        </div>
      </div>
    `;

    // Initialize Charts after DOM is updated
    initCharts(revenueByMonth, stageConversion, activityByType);

  } catch(err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><h3>Lỗi tải dữ liệu</h3><p>${err.message}</p></div>`;
  }
}

function initCharts(revenueData, funnelData, activityData) {
  // Chart defaults for dark/light theme
  Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
  Chart.defaults.font.family = 'Inter, sans-serif';

  // 1. Revenue Line Chart
  const revCtx = document.getElementById('revenueChart');
  if (revCtx && revenueData.length > 0) {
    new Chart(revCtx, {
      type: 'bar',
      data: {
        labels: revenueData.map(d => d.label),
        datasets: [{
          label: 'Doanh thu (VND)',
          data: revenueData.map(d => Number(d.revenue) || 0),
          backgroundColor: '#10b981',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1e9) return (value / 1e9) + ' Tỷ';
                if (value >= 1e6) return (value / 1e6) + ' Tr';
                return value;
              }
            }
          }
        }
      }
    });
  }

  // 2. Funnel Chart (using Bar chart as a simple funnel representation)
  const funnelCtx = document.getElementById('funnelChart');
  if (funnelCtx && funnelData.length > 0) {
    new Chart(funnelCtx, {
      type: 'bar',
      data: {
        labels: funnelData.map(d => STAGE_NAMES[d.stage] || d.stage),
        datasets: [{
          label: 'Số deal',
          data: funnelData.map(d => d.count),
          backgroundColor: '#6366f1',
          indexAxis: 'y' // Horizontal bar
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // 3. Activity Doughnut Chart
  const actCtx = document.getElementById('activityChart');
  if (actCtx && activityData.length > 0) {
    new Chart(actCtx, {
      type: 'doughnut',
      data: {
        labels: activityData.map(d => ACTIVITY_TYPE_LABELS[d.activity_type] || d.activity_type),
        datasets: [{
          data: activityData.map(d => d.count),
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
  }
}
