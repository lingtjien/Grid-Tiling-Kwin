import { shared } from 'shared.mjs';
import { Desktop } from 'desktop.mjs';

export function Activity() {
  const desktops = [];

  function count() {
    return desktops.reduce((n, d) => n + d.count(), 0);
  }

  function addDesktop() {
    if (desktops.length < Workspace.desktops.length) {
      const d = Desktop();
      desktops.push(d);
      return d;
    }
  }

  function add(window) {
    const start = shared.workspace.desktops.findIndex(
      window.desktops.length > 1 ? shared.workspace.currentDesktop : window.desktops[0]
    );
    let i = start;
    do {
      while (i >= desktops.length) {
        if (!addDesktop()) return;
      }
      if (desktops[i].add(window, i)) {
        window.desktopIndex = i;
        return window;
      }
      if (++i >= workspace.desktops.length) i = 0;
    } while (i !== start);
  }

  function remove(window) {
    // do not remove the desktop to prevent moving of clients when desktops are closed
    return desktops[window.desktopIndex].remove(window);
  }

  function move(window, desktopIndex) {
    // desktopIndex = target
    if (desktopIndex < 0 || window.desktopIndex === desktopIndex) return;
    while (desktopIndex >= desktops.length) {
      if (!addDesktop()) return;
    }
    if (desktops[desktopIndex].add(window, desktopIndex) && desktops[window.desktopIndex].remove(window)) return window;
  }

  function render(activityId) {
    for (const [i, desktop] of desktops.entries()) desktop.render(i, activityId);
  }

  return { desktops, count, add, remove, render };
}
