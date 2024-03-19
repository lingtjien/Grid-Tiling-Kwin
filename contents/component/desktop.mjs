import { shared } from 'shared.mjs';
import { Screen } from 'screen.mjs';

export function Desktop() {
  const screens = [];

  function count() {
    return screens.reduce((n, s) => n + s.count(), 0);
  }

  function addScreen() {
    if (screens.length < shared.workspace.screens.length) {
      const s = Screen();
      this.screens.push(s);
      return s;
    }
  }

  function add(window, desktopIndex) {
    const start = shared.workspace.screens.findIndex(window.output);
    let i = start;
    do {
      while (i >= screens.length) {
        if (!addScreen()) return;
      }
      if (screens[i].add(window, config.grid[i][desktopIndex])) {
        window.screenIndex = i;
        return window;
      }
      if (++i >= workspace.screens.length) i = 0;
    } while (i !== start);
  }

  function remove(window) {
    // do not remove the screen to prevent moving of clients when screens are closed
    return screens[window.screenIndex].remove(window);
  }

  function move(window, screenIndex) {
    // screenIndex = target
    if (screenIndex < 0 || window.screenIndex === screenIndex) return;
    while (screenIndex >= screens.length) {
      if (!addScreen()) return;
    }
    if (screens[screenIndex].add(window) && screens[window.screenIndex].remove(window)) return window;
  }

  function render(desktopIndex, activityId) {
    for (const [i, screen] of screens.entries()) screen.render(i, desktopIndex, activityId);
  }

  return { screens, count, add, remove, move, render };
}
