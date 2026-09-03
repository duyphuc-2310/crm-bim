// ================================================
// Browser Notifications & Silent Deals Alert
// ================================================

let hasNotificationPermission = false;
let checkInterval = null;

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Trình duyệt không hỗ trợ notification');
    return;
  }
  
  if (Notification.permission === 'granted') {
    hasNotificationPermission = true;
    startNotificationChecks();
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      hasNotificationPermission = true;
      startNotificationChecks();
    }
  }
}

function startNotificationChecks() {
  // Check immediately
  checkFollowupsAndSilentDeals();
  // Check every 5 minutes
  if (checkInterval) clearInterval(checkInterval);
  checkInterval = setInterval(checkFollowupsAndSilentDeals, 5 * 60 * 1000);
}

async function checkFollowupsAndSilentDeals() {
  if (!hasNotificationPermission) return;
  
  try {
    // 1. Check Follow-ups
    const { data: followups } = await api.getUpcoming();
    const urgentFollowups = followups.filter(f => f.status === 'overdue' || (isToday(f.due_date) && f.status === 'pending'));
    
    if (urgentFollowups.length > 0) {
      showBrowserNotification(
        'BIM CRM - Cần làm ngay!',
        `Bạn có ${urgentFollowups.length} follow-up cần giải quyết (quá hạn hoặc hôm nay).`
      );
    }

    // 2. Check Silent Deals
    const settings = await api.getSettings();
    const silentDays = Number(settings.data.silent_deal_days || 7);
    const { data: silentDeals } = await api.getSilentDeals(silentDays);
    
    if (silentDeals.length > 0) {
      showBrowserNotification(
        'BIM CRM - Cảnh báo Deal "nguội"',
        `Có ${silentDeals.length} deal không có tương tác trong ${silentDays} ngày qua!`
      );
    }
    
    // Update badge in UI
    const badge = document.getElementById('followup-badge');
    if (badge) {
      const count = urgentFollowups.length;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
      if (count > 0) badge.style.animation = 'pulse 2s infinite';
    }
    
  } catch (err) {
    console.error('Error checking notifications', err);
  }
}

function showBrowserNotification(title, body) {
  if (Notification.permission === 'granted') {
    // Prevent duplicate notifications in short timespan
    const lastNotif = sessionStorage.getItem('last_notif_' + title);
    if (lastNotif && Date.now() - Number(lastNotif) < 30 * 60 * 1000) { // 30 min cooldown
      return;
    }
    
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico' // Assuming there is a favicon, or it will just be text
    });
    
    notification.onclick = function() {
      window.focus();
      this.close();
    };
    
    sessionStorage.setItem('last_notif_' + title, Date.now());
  }
}

// Initialize on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add a slight delay so it doesn't interrupt immediate rendering
  setTimeout(requestNotificationPermission, 2000);
});
