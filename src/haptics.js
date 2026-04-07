export function tap() {
  if (navigator.vibrate) navigator.vibrate(10);
}

export function success() {
  if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
}

export function warn() {
  if (navigator.vibrate) navigator.vibrate(50);
}
