import { shared } from 'shared.mjs';
import { Desktop } from 'desktop.mjs';

export function Activity() {
  const desktops = {}; // key = KWin::VirtualDesktop::id

  function count() {
    return Object.values(desktops).reduce((n, d) => n + d.count(), 0);
  }

  function add(window) {
    const id = !window.desktops.length ? window.desktops[0].id : shared.workspace.currentDesktop.id;
    if (!desktops.hasOwnProperty(id)) desktops[id] = Desktop();
    if (desktops[id].add(window, id)) {
      return window;
    } else {
      for (const d of shared.workspace.desktops) {
        const id = d.id;
        if (!desktops.hasOwnProperty(id)) {
          const desktop = Desktop();
          if (desktop.add(window, id)) {
            window.desktops = [d];
            desktops[id] = desktop;
            return window;
          }
        }
      }
    }
    // couldn't find any desktops with sufficient space to add window too
  }

  function remove(window) {
    const id = window.desktops[0].id;
    if (desktops.hasOwnProperty(id)) {
      const desktop = desktops[id];
      if (desktop.remove(window)) {
        if (!desktop.count()) delete desktops[id];
        return window;
      }
    }
  }

  function move(window, id) {
    // id = target
    const current = window.desktops[0].id;
    if (current !== id) {
      if (!desktops.hasOwnProperty(id)) desktops[id] = Desktop();
      if (desktops[id].add(window) && desktops[current].remove(window)) return window;
    }
  }

  function render() {
    for (const [i, desktop] of Object.entries(desktops)) desktop.render(i);
  }

  return { desktops, count, add, remove, move, render };
}
