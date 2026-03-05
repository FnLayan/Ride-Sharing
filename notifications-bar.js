// notifications-bar.js: احتجناها لاننا نبي اشعارات الرحله توصل لنا وين ماكنا فالويب
(function () {
  const style = document.createElement('style');
  style.textContent = `
    .rs-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: #e4d6c2;          /* أفتح شوي من #cbb796 ونفس العائلة */
      color: #3b2f24;               /* نفس لون النص الأساسي في الريب */
      padding: 10px 14px;
      font-family: 'Tajawal', sans-serif;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,.15);
      border-bottom: 1px solid #cbb796;
    }
    .rs-banner button {
      background: #3b2f24;          /* عكس الألوان: زر غامق ونص فاتح */
      color: #fffdf9;
      border: none;
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 13px;
      cursor: pointer;
    }
    .rs-banner button:hover {
      opacity: .9;
    }
  `;
  document.head.appendChild(style);

  const STORAGE_KEY = 'rs_notifications';
  let currentBanner = null;
  let showingId = null;

  function loadNotifications() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveNotifications(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr || []));
  }

  function getCurrentUserId() {
    return localStorage.getItem('rs_current_user_id') || '';
  }

  function pickNextForCurrentUser() {
    const userId = getCurrentUserId();
    if (!userId) return null;
    const all = loadNotifications();
    const mine = all
      .filter(n => !n.read && n.userId === userId)
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    return mine[0] || null;
  }

  function markAsRead(id) {
    const all = loadNotifications();
    const idx = all.findIndex(n => n.id === id);
    if (idx !== -1) {
      all[idx].read = true;
      saveNotifications(all);
    }
  }

  function removeBanner() {
    if (currentBanner && currentBanner.parentNode) {
      currentBanner.parentNode.removeChild(currentBanner);
    }
    currentBanner = null;
    showingId = null;
  }

  function showNextBanner() {
    const n = pickNextForCurrentUser();
    if (!n) {
      removeBanner();
      return;
    }
    showingId = n.id;

    removeBanner();
    const bar = document.createElement('div');
    bar.className = 'rs-banner';
    bar.innerHTML = `
      <span>${n.message}</span>
      <button type="button">حسنًا</button>
    `;
    bar.querySelector('button').addEventListener('click', () => {
      markAsRead(n.id);
      removeBanner();
      // نشوف إذا فيه إشعار ثاني
      showNextBanner();
    });

    document.body.appendChild(bar);
    currentBanner = bar;
  }

  // ====== دوال عامة نستعملها من الصفحات ======

  // إشعار لشخص واحد
  function addNotification(userId, message, type, rideId) {
    if (!userId || !message) return;
    const all = loadNotifications();
    all.push({
      id: 'nt-' + Date.now() + '-' + Math.random().toString(16).slice(2),
      userId,
      message,
      type: type || 'info',
      rideId: rideId || null,
      createdAt: new Date().toISOString(),
      read: false
    });
    saveNotifications(all);

    // لو الإشعار يخص المستخدم الحالي، نعرضه فورًا
    if (userId === getCurrentUserId()) {
      showNextBanner();
    }
  }

  // إشعار لمجموعة مستخدمين (من غير تكرار)
  function addNotificationMany(userIds, message, type, rideId) {
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    unique.forEach(uid => addNotification(uid, message, type, rideId));
  }

  // نعرض أول إشعار غير مقروء للمستخدم عند فتح أي صفحة
  window.addEventListener('load', () => {
    showNextBanner();
  });

  // تصدير الدوال للعالمية
  window.rsAddNotification = addNotification;
  window.rsAddNotificationMany = addNotificationMany;
})();