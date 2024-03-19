import { clampDivider } from 'config.mjs';

export function List() {
  const windows = [];
  const dividers = [];

  function nminimized() {
    return windows.reduce((n, c) => n + c.minimized, 0);
  }
  function minimized() {
    return nminimized() === windows.length;
  }
  function minSpace() {
    return windows.reduce((sum, c) => sum + c.minSpace, 0);
  }
  function add(window) {
    // the size is the total size of a virtual desktop this column can occupy
    window.windowIndex = windows.length;
    windows.push(window);
    if (windows.length > 0) dividers.push(0); // do not add a new divider when the first client is added to the column
    return window;
  }
  function remove(window) {
    const i = window.windowIndex;
    windows.splice(i, 1);
    if (i === 0) {
      if (dividers.length > 0) dividers.shift();
    } else {
      dividers.splice(i - 1, 1);
    }
    return true;
  }

  function swapClient(amount, windowIndex) {
    const i = windowIndex + amount;
    if (i >= 0 && i < windows.length) {
      const window = windows[windowIndex];
      windows[windowIndex] = windows[i];
      windows[i] = window;
      return window;
    }
  }
  function changeDividerAfter(amount, windowIndex) {
    if (windowIndex < windows.length - 1) dividers[windowIndex] = clampDivider(dividers[windowIndex] + amount);
  }
  function changeDividerBefore(amount, windowIndex) {
    if (windowIndex > 0) dividers[windowIndex - 1] = clampDivider(dividers[windowIndex - 1] - amount);
  }
  function changeDivider(amount, windowIndex) {
    changeDividerAfter(amount, windowIndex);
    changeDividerBefore(amount, windowIndex);
  }
  function render(x, w, areaY, areaHeight, listIndex, screenIndex, desktopIndex, activityId) {
    const height = config.height(areaHeight, windows.length - nminimized());

    let y = config.y(areaY);
    let current = 0;
    let previous = 0;
    for (let [i, window] of windows.entries()) {
      if (window.minimized) continue;

      const divider =
        i === windows.length - 1 || (i < windows.length - 1 && windows[i + 1].minimized) ? 0 : dividers[i];

      current = height * divider;
      const h = height + current - previous;
      const geometry = Qt.rect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));

      // these properties are used internally only so they must be set first as they are used to check
      window.renderGeometry = geometry;
      window.windowIndex = i;
      window.listIndex = listIndex;
      window.screenIndex = screenIndex;
      window.desktopIndex = desktopIndex;
      window.activityId = activityId;

      // these properties are from kwin and will thus trigger additional signals, these properties must be set last to prevent the signals that are hooked into this script from triggering before the internal properties have been set
      window.noBorder = config.borderActive && window.active ? false : !config.border;
      window.desktops = [shared.workspace.desktops[desktopIndex]];
      window.output = shared.workspace.screens[screenIndex];
      window.frameGeometry = geometry;

      y += h + config.gap;
      previous = current;
    }
    return 0;
  }

  return { windows, add, remove, render, nminimized, minSpace };
}
