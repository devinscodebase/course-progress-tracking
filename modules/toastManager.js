import { EventBus } from './eventBus.js';

export const ToastManager = {
  init() {
    this.injectStyles();
    this.createToastContainer();
    this.setupListeners();
  },

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      }

      .toast {
        background: linear-gradient(135deg, #6c4cf9 0%, #8b5cf6 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(108, 76, 249, 0.3);
        min-width: 300px;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 12px;
        pointer-events: auto;
        cursor: pointer;
        transform: translateX(450px);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      .toast.show {
        transform: translateX(0);
        opacity: 1;
      }

      .toast-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .toast-content {
        flex: 1;
      }

      .toast-title {
        font-weight: 600;
        font-size: 15px;
        margin-bottom: 4px;
      }

      .toast-message {
        font-size: 13px;
        opacity: 0.9;
        line-height: 1.4;
      }

      .toast-close {
        font-size: 20px;
        opacity: 0.7;
        cursor: pointer;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }

      .toast-close:hover {
        opacity: 1;
      }

      @media (max-width: 768px) {
        .toast-container {
          top: 10px;
          right: 10px;
          left: 10px;
        }

        .toast {
          min-width: unset;
          max-width: unset;
        }
      }
    `;
    document.head.appendChild(style);
  },

  createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toast-container';
    document.body.appendChild(container);
  },

  setupListeners() {
    EventBus.on('lesson:completed', (data) => {
      this.showSuccess({
        title: 'Μάθημα Ολοκληρώθηκε! 🎉',
        message: `Συγχαρητήρια! Προχωρήστε στο επόμενο μάθημα.`
      });
    });

    EventBus.on('course:completed', (data) => {
      this.showSuccess({
        title: 'Κύκλος Μαθημάτων Ολοκληρώθηκε! 🏆',
        message: `Συγχαρητήρια! Ολοκληρώσατε όλα τα μαθήματα του κύκλου.`
      });
    });
  },

  showSuccess({ title, message, duration = 4000 }) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-icon">✅</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <div class="toast-close">×</div>
    `;

    const container = document.getElementById('toast-container');
    container.appendChild(toast);

    // Show animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-dismiss
    const timeout = setTimeout(() => this.dismissToast(toast), duration);

    // Click to dismiss
    toast.addEventListener('click', () => {
      clearTimeout(timeout);
      this.dismissToast(toast);
    });
  },

  dismissToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }
};