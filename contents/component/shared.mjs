export const shared = { workspace: null, kwin: null, timer: null };

export function area(desktopId, screenName) {
  return shared.workspace.clientArea(
    0,
    shared.workspace.screens.find((s) => s.name === screenName),
    shared.workspace.desktops.find((d) => d.id === desktopId)
  );
}

export function setTimeout(callback, interval) {
  return shared.timer.createObject(null, { callback, interval });
}

export function clearTimeout(t) {
  t.stop();
  t.destroy();
}
