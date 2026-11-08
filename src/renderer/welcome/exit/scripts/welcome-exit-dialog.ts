// Kernel exit confirm (double-Esc) [内核退出确认 (双击 Esc)]

import { windowApi } from '../../../shared/index.js';

// ========== Kernel exit confirm (double-Esc) ==========
const DOUBLE_ESC_INTERVAL = 600;
let exitDialogOpen = false;
let lastEscTime = 0;
let exitFocusIndex = 0;

function showKernelExitDialog(): void {
  exitDialogOpen = true;
  exitFocusIndex = 0;
  updateExitFocus();
  document.getElementById('kernelExitModal')!.style.display = 'flex';
  document.getElementById('kernelExitReturnBtn')?.focus();
}
function closeKernelExitDialog(): void {
  exitDialogOpen = false;
  document.getElementById('kernelExitModal')!.style.display = 'none';
}
function updateExitFocus(): void {
  document.getElementById('kernelExitReturnBtn')?.classList.toggle('focused', exitFocusIndex === 0);
  document.getElementById('kernelExitQuitBtn')?.classList.toggle('focused', exitFocusIndex === 1);
}
export function bindKernelExitDialog(): void {
  document.getElementById('kernelExitReturnBtn')?.addEventListener('click', closeKernelExitDialog);
  document.getElementById('kernelExitQuitBtn')?.addEventListener('click', () => void windowApi.quitApp());
  document.addEventListener('keydown', (e) => {
    if (exitDialogOpen) {
      if (e.key === 'Escape') { e.preventDefault(); closeKernelExitDialog(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        exitFocusIndex = 1 - exitFocusIndex;
        updateExitFocus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (exitFocusIndex === 0) closeKernelExitDialog();
        else void windowApi.quitApp();
      }
      return;
    }
    if (e.key === 'Escape') {
      const now = Date.now();
      if (now - lastEscTime < DOUBLE_ESC_INTERVAL) {
        lastEscTime = 0;
        showKernelExitDialog();
      } else {
        lastEscTime = now;
      }
    }
  }, true);
}
