import { shared } from 'shared.mjs';
import { Desktop } from 'desktop.mjs';

export function Activity() {
  const desktops = {}; // key = KWin::VirtualDesktop::id

  function count() {
    return Object.values(desktops).reduce((n, d) => n + d.count(), 0);
  }

  function add(window) {
    const id = window.desktops[0].id;
    if (!desktops.hasOwnProperty(id)) desktops[id] = Desktop();
    if (desktops[id].add(window, id)) {
      window.desktopId = id;
      return window;
    } else {
      for (const d of shared.workspace.desktops) {
        const id = d.id;
        if (!desktops.hasOwnProperty(id)) desktops[id] = Desktop();
        if (desktops[id].add(window, id)) {
          window.desktopId = id;
          window.desktops = [d];
          return window;
        }
      }
    }
    // couldn't find any desktops with sufficient space to add window too
  }

  function remove(window) {
    const id = window.desktopId;
    if (desktops.hasOwnProperty(id)) {
      const desktop = desktops[id];
      if (desktop.remove(window)) {
        if (!desktop.count()) delete desktops[id];
        return window;
      }
    }
  }

  function moved(window) {
    let start, c, t;
    for (const [i, desktop] of shared.workspace.desktops.entries()) {
      const id = desktop.id;
      if (id === window.desktopId) {
        c = i;
        start = desktop;
      }
      if (id === window.desktops[0].id) t = i;
    }
    const direction = Math.sign(t - c);
    if (direction) {
      const n = shared.workspace.desktops.length;
      let i = t;
      while (i !== c) {
        const desktop = shared.workspace.desktops[i];
        const id = desktop.id;
        if (!desktops.hasOwnProperty(id)) desktops[id] = Desktop();
        const w = Object.assign({}, window);
        if (desktops[id].add(window)) {
          remove(w);
          window.desktopId = id;
          window.desktops = [desktop];
          return window;
        }

        i += direction;
        if (i < 0) i = n - 1;
        if (i >= n) i = 0;
      }
    }
    return window;
  }

  function render() {
    for (const [id, desktop] of Object.entries(desktops)) {
      desktop.render(shared.workspace.desktops.find((d) => d.id === id));
    }
  }

  return { desktops, count, add, remove, moved, render };
}
