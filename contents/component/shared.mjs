export const shared = { workspace: null, kwin: null, timer: null };

export function area(desktop, output) {
  return shared.workspace.clientArea(0, output, desktop);
}

export function setTimeout(callback, interval) {
  return shared.timer.createObject(null, { callback, interval });
}

export function clearTimeout(t) {
  t.stop();
  t.destroy();
}
