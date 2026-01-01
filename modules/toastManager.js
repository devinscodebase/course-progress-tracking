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
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      }

      .toast {
        background: #191919;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        padding: 16px 20px;
        border-radius: 24px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        min-width: 320px;
        max-width: 400px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        pointer-events: auto;
        cursor: pointer;
        transform: translateX(450px);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        font-family: 'Inter', sans-serif;
      }

      .toast.show {
        transform: translateX(0);
        opacity: 1;
      }

      .toast-icon {
        width: 8px;
        height: 8px;
        background: #2d00f7;
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 6px;
      }

      .toast-content {
        flex: 1;
      }

      .toast-title {
        font-family: 'Inter Tight', sans-serif;
        font-weight: 600;
        font-size: 15px;
        margin-bottom: 4px;
        color: #ffffff;
      }

      .toast-message {
        font-size: 13px;
        color: #CCCCCC;
        line-height: 1.5;
      }

      .toast-close {
        font-size: 18px;
        color: #7F7F7F;
        cursor: pointer;
        transition: color 0.2s;
        flex-shrink: 0;
        line-height: 1;
        font-weight: 300;
      }

      .toast-close:hover {
        color: #ffffff;
      }

      @media (max-width: 768px) {
        .toast-container {
          bottom: 10px;
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
        title: 'Μάθημα Ολοκληρώθηκε',
        message: 'Συγχαρητήρια! Προχωρήστε στο επόμενο μάθημα.'
      });
    });

    EventBus.on('course:completed', (data) => {
      this.showSuccess({
        title: 'Κύκλος Μαθημάτων Ολοκληρώθηκε',
        message: 'Συγχαρητήρια! Ολοκληρώσατε όλα τα μαθήματα του κύκλου.'
      });
    });
  },

  showSuccess({ title, message, duration = 4000 }) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-icon"></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <div class="toast-close">×</div>
    `;

    const container = document.getElementById('toast-container');
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    const timeout = setTimeout(() => this.dismissToast(toast), duration);

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