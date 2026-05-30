/* ═══════════════════════════════════════════════════════════════════════════
   TOAST MANAGER - ENHANCED NOTIFICATION SYSTEM
   رفيق القرآن - Quran Companion Platform
   
   Professional toast queue management with animations and accessibility
   
   Last Updated: May 5, 2026
   ═══════════════════════════════════════════════════════════════════════════ */

class ToastManager {
  constructor() {
    this.container = null;
    this.queue = [];
    this.activeToasts = new Map();
    this.maxToasts = 3;
    this.defaultDuration = 5000; // 5 seconds
    this.init();
  }

  init() {
    // Use existing #app-toast container or create new one
    this.container = document.getElementById('app-toast');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'app-toast';
      this.container.setAttribute('role', 'status');
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show a toast notification
   * @param {string|object} options - Message string or options object
   * @returns {string} Toast ID
   */
  show(options) {
    // Handle legacy string format
    if (typeof options === 'string') {
      options = { message: options };
    }

    const toast = {
      id: this.generateId(),
      type: options.type || 'default',
      title: options.title || '',
      message: options.message || '',
      duration: options.duration !== undefined ? options.duration : this.defaultDuration,
      closable: options.closable !== false,
      action: options.action || null,
      icon: this.getIcon(options.type),
    };

    // Add to queue
    this.queue.push(toast);
    this.processQueue();

    return toast.id;
  }

  /**
   * Process the toast queue
   */
  processQueue() {
    // Remove toasts that exceed max limit
    while (this.activeToasts.size >= this.maxToasts && this.queue.length > 0) {
      const oldestId = Array.from(this.activeToasts.keys())[0];
      this.dismiss(oldestId);
    }

    // Show toasts from queue
    while (this.activeToasts.size < this.maxToasts && this.queue.length > 0) {
      const toast = this.queue.shift();
      this.render(toast);
    }
  }

  /**
   * Render a toast
   * @param {object} toast - Toast object
   */
  render(toast) {
    const element = document.createElement('div');
    element.className = `toast toast-${toast.type}`;
    element.setAttribute('role', 'alert');
    element.setAttribute('aria-live', 'assertive');
    element.setAttribute('data-toast-id', toast.id);

    // Build toast HTML
    let html = '';

    // Icon
    if (toast.icon) {
      html += `<div class="toast__icon">${toast.icon}</div>`;
    }

    // Content
    html += '<div class="toast__content">';
    if (toast.title) {
      html += `<div class="toast__title">${this.escapeHtml(toast.title)}</div>`;
    }
    html += `<div class="toast__message">${this.escapeHtml(toast.message)}</div>`;
    html += '</div>';

    // Close button
    if (toast.closable) {
      html += `
        <button 
          class="toast__close" 
          type="button" 
          aria-label="إغلاق الإشعار"
          onclick="window.toastManager.dismiss('${toast.id}')"
        >
          ✕
        </button>
      `;
    }

    // Progress bar (if duration > 0)
    if (toast.duration > 0) {
      html += `
        <div class="toast__progress">
          <div class="toast__progress-bar" style="animation-duration: ${toast.duration}ms;"></div>
        </div>
      `;
    }

    element.innerHTML = html;

    // Add action button if provided
    if (toast.action) {
      const actionDiv = document.createElement('div');
      actionDiv.className = 'toast__action';
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast__action-btn';
      actionBtn.textContent = toast.action.label;
      actionBtn.onclick = () => {
        if (toast.action.onClick) {
          toast.action.onClick();
        }
        this.dismiss(toast.id);
      };
      actionDiv.appendChild(actionBtn);
      element.querySelector('.toast__content').appendChild(actionDiv);
    }

    // Add to container
    this.container.appendChild(element);
    this.activeToasts.set(toast.id, { element, toast });

    // Auto-dismiss after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.duration);
    }

    // Pause progress on hover
    element.addEventListener('mouseenter', () => {
      const progressBar = element.querySelector('.toast__progress-bar');
      if (progressBar) {
        progressBar.style.animationPlayState = 'paused';
      }
    });

    element.addEventListener('mouseleave', () => {
      const progressBar = element.querySelector('.toast__progress-bar');
      if (progressBar) {
        progressBar.style.animationPlayState = 'running';
      }
    });
  }

  /**
   * Dismiss a toast
   * @param {string} id - Toast ID
   */
  dismiss(id) {
    const toastData = this.activeToasts.get(id);
    if (!toastData) return;

    const { element } = toastData;

    // Add exit animation
    element.classList.add('toast-exit');

    // Remove after animation
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.activeToasts.delete(id);
      this.processQueue();
    }, 300);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    const ids = Array.from(this.activeToasts.keys());
    ids.forEach(id => this.dismiss(id));
    this.queue = [];
  }

  /**
   * Get icon for toast type
   * @param {string} type - Toast type
   * @returns {string} Icon HTML
   */
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      default: '',
    };
    return icons[type] || icons.default;
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Convenience methods for different toast types
   */
  success(message, options = {}) {
    return this.show({ ...options, type: 'success', message });
  }

  error(message, options = {}) {
    return this.show({ ...options, type: 'error', message });
  }

  warning(message, options = {}) {
    return this.show({ ...options, type: 'warning', message });
  }

  info(message, options = {}) {
    return this.show({ ...options, type: 'info', message });
  }
}

// Initialize global toast manager
window.toastManager = new ToastManager();

// Override legacy showToast function to use new system
const originalShowToast = window.showToast;
window.showToast = function(options) {
  // If it's a simple string, use new system
  if (typeof options === 'string') {
    return window.toastManager.show({ message: options });
  }
  
  // If it's an object, use new system
  if (typeof options === 'object') {
    return window.toastManager.show(options);
  }
  
  // Fallback to original if needed
  if (originalShowToast) {
    return originalShowToast(options);
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   USAGE EXAMPLES
   ═══════════════════════════════════════════════════════════════════════════

// Simple toast (legacy - still works)
showToast("تم الحفظ بنجاح");

// Success toast
showToast({
  type: 'success',
  message: 'تم حفظ البيانات بنجاح'
});

// Error toast with title
showToast({
  type: 'error',
  title: 'خطأ!',
  message: 'فشل في حفظ البيانات'
});

// Warning toast with custom duration
showToast({
  type: 'warning',
  message: 'يرجى التحقق من البيانات',
  duration: 7000
});

// Info toast with action button
showToast({
  type: 'info',
  message: 'هل تريد التراجع عن هذا الإجراء؟',
  action: {
    label: 'تراجع',
    onClick: () => {
      console.log('Undo clicked');
    }
  }
});

// Toast that doesn't auto-dismiss
showToast({
  type: 'error',
  message: 'خطأ خطير يتطلب انتباهك',
  duration: 0,
  closable: true
});

// Using convenience methods
toastManager.success('تم بنجاح!');
toastManager.error('حدث خطأ!');
toastManager.warning('تحذير!');
toastManager.info('معلومة مفيدة');

// Dismiss specific toast
const toastId = showToast('رسالة مؤقتة');
setTimeout(() => {
  toastManager.dismiss(toastId);
}, 2000);

// Dismiss all toasts
toastManager.dismissAll();

   ═══════════════════════════════════════════════════════════════════════════ */
