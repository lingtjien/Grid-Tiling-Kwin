import { calc, clampDivider, config } from 'config.mjs';

export function List() {
  const windows = [];
  const dividers = [];

  function minimized() {
    return windows.reduce((s, w) => s + w.minimized, 0);
  }

  function minSpace() {
    return windows.reduce((s, w) => s + w.minSpace, 0);
  }

  function add(window) {
    window.windowIndex = windows.length;
    windows.push(window);
    if (windows.length > 0) dividers.push(0); // do not add a new divider when the first window is added to the column
  }

  function remove(window) {
    const i = window.windowIndex;
    if (i < windows.length) {
      for (let j = i + 1; j < windows.length; ++j) windows[j].windowIndex -= 1;
      windows.splice(i, 1);
      if (i === 0) {
        if (dividers.length > 0) dividers.shift();
      } else {
        dividers.splice(i - 1, 1);
      }
      return window;
    }
  }

  function swap(windowIndex, amount) {
    const t = windowIndex + amount;
    const target = windows[t];
    if (target) {
      const current = windows[windowIndex];

      target.windowIndex = windowIndex;
      windows[windowIndex] = target;

      current.windowIndex = t;
      windows[t] = current;

      return current;
    }
  }

  function dividerPost(windowIndex, amount) {
    if (windowIndex < windows.length - 1) dividers[windowIndex] = clampDivider(dividers[windowIndex] + amount);
  }

  function dividerPre(windowIndex, amount) {
    if (windowIndex > 0) dividers[windowIndex - 1] = clampDivider(dividers[windowIndex - 1] - amount);
  }

  function divider(windowIndex, amount) {
    dividerPost(windowIndex, amount);
    dividerPre(windowIndex, amount);
  }

  function overlap(window, area) {
    let remainder = window.frameGeometry.y + 0.5 * window.frameGeometry.height - config.margin.t - area.y; // center
    for (const w of windows) {
      if (!w.minimized) {
        remainder -= w.frameGeometry.height + config.gap;
        if (remainder < 0) return w;
      }
    }
  }

  function render(x, y, width, height) {
    height = calc.height(height, windows.length - minimized());
    y = calc.y(y);

    let current = 0;
    let previous = 0;
    for (let [i, window] of windows.entries()) {
      if (window.minimized) continue;

      let divider = dividers[i] || 0;
      if (divider) {
        const w = windows[i + 1];
        if (w && w.minimized) divider = 0;
      }

      current = height * divider;
      const h = height + current - previous;
      const geometry = Qt.rect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(h));

      window.renderGeometry = geometry;

      // these properties are from kwin and will thus trigger additional signals, these properties must be set last to prevent the signals that are hooked into this script from triggering before the internal properties have been set
      window.noBorder = config.borderActive && window.active ? false : !config.border;
      window.frameGeometry = geometry;

      y += h + config.gap;
      previous = current;
    }
  }

  return { windows, minimized, minSpace, add, remove, swap, divider, dividerPre, dividerPost, overlap, render };
}
