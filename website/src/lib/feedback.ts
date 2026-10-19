/*
 * Short messages ("Saved.") and questions before something is deleted, shown by
 * <Toaster> and <ConfirmHost> in the app frame.
 */

type ToastListener = (message: string, tone: 'ok' | 'error') => void;
let toastListener: ToastListener | null = null;

export function toast(message: string, tone: 'ok' | 'error' = 'ok') {
  toastListener?.(message, tone);
}

export function onToast(listener: ToastListener) {
  toastListener = listener;
  return () => {
    if (toastListener === listener) toastListener = null;
  };
}

export type ConfirmRequest = { title: string; text?: string; confirm: string; danger?: boolean };
type ConfirmListener = (request: ConfirmRequest, answer: (yes: boolean) => void) => void;
let confirmListener: ConfirmListener | null = null;

/** Asks before something is removed. Resolves to true when the person confirms. */
export function confirmAction(request: ConfirmRequest): Promise<boolean> {
  return new Promise((resolve) => {
    if (!confirmListener) resolve(window.confirm(request.title));
    else confirmListener(request, resolve);
  });
}

export function onConfirm(listener: ConfirmListener) {
  confirmListener = listener;
  return () => {
    if (confirmListener === listener) confirmListener = null;
  };
}
