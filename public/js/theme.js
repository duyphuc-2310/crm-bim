// ================================================
// Theme Toggle (Dark/Light Mode)
// ================================================

function initTheme() {
  const savedTheme = localStorage.getItem('crm_theme') || 'dark';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('crm_theme', newTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (icon && label) {
    if (theme === 'light') {
      icon.textContent = '☀️';
      label.textContent = 'Chế độ sáng';
    } else {
      icon.textContent = '🌙';
      label.textContent = 'Chế độ tối';
    }
  }
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', initTheme);
