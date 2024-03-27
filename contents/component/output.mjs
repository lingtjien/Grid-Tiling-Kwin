import { calc, clampDivider, config } from 'config.mjs';
import { List } from 'list.mjs';

export function Output() {
  const lists = [];
  const dividers = [];

  function count() {
    return lists.reduce((n, l) => n + l.windows.length, 0);
  }

  function minimized() {
    return lists.reduce((s, l) => s + (l.minimized() === l.windows.length), 0);
  }

  function addList(start = false) {
    // check if adding a new line won't decrease the size of the windows inside any of the existing lines below their minSpace
    if (!lists.some((l) => l.minSpace() > 1 / (lists.length + 1))) {
      if (start) {
        for (const l of lists) {
          for (const w of l.windows) w.listIndex += 1;
        }
        if (lists.unshift(List()) > 1) dividers.unshift(0);
      } else {
        if (lists.push(List()) > 1) dividers.push(0);
      }
      return start ? 0 : lists.length - 1;
    }
  }

  function removeLine(index) {
    for (let i = index + 1; i < lists.length; ++i) {
      for (const w of lists[i].windows) w.listIndex -= 1;
    }
    lists.splice(index, 1);
    if (index === 0) {
      if (dividers.length > 0) dividers.shift();
    } else {
      dividers.splice(index - 1, 1);
    }
  }

  function smallest() {
    if (lists.length) {
      let i = 0;
      let minSpace = lists[i].minSpace();
      for (let j = 1; j < lists.length; ++j) {
        const m = lists[j].minSpace();
        if (m < minSpace) {
          i = j;
          minSpace = m;
        }
      }
      return i;
    }
  }

  function add(window, grid) {
    const i = smallest();
    let list = lists[i];
    if (
      list &&
      list.minSpace() + window.minSpace <= 1 / lists.length &&
      list.windows.length < grid[0] &&
      (lists.length >= grid[1] || lists.length > list.windows.length)
    ) {
      list.add(window);
      window.listIndex = i;
      return window;
    } else if (window.minSpace <= 1 / (lists.length + 1) && lists.length < grid[1]) {
      const j = addList();
      list = lists[j];
      if (list) {
        list.add(window);
        window.listIndex = j;
        return window;
      }
    }
  }

  function remove(window) {
    const i = window.listIndex;
    if (i < lists.length) {
      const list = lists[i];
      if (list.remove(window)) {
        if (!list.windows.length) removeLine(i);
        return window;
      }
    }
  }

  function swap(listIndex, amount) {
    const t = listIndex + amount;
    const target = lists[t];
    if (target) {
      const current = lists[listIndex];

      for (const w of target.windows) w.listIndex = listIndex;
      lists[listIndex] = target;

      for (const w of current.windows) w.listIndex = t;
      lists[t] = current;

      return current;
    }
  }

  function move(window, amount, grid) {
    let t = window.listIndex + amount;
    let target = lists[t];
    if (!target && lists.length < grid[1] && lists[window.listIndex].windows.length > 1) {
      t = addList(amount < 0);
      target = lists[t];
    }

    if (target && target.minSpace() + window.minSpace <= 1 / lists.length && target.windows.length < grid[0]) {
      const c = window.listIndex;
      const current = lists[c];
      current.remove(window);
      if (!current.windows.length) {
        removeLine(c);
        if (t > c) --t;
      }
      target.add(window);
      window.listIndex = t;
      return window;
    }
  }

  function dividerPost(listIndex, amount) {
    if (listIndex < lists.length - 1) dividers[listIndex] = clampDivider(dividers[listIndex] + amount);
  }

  function dividerPre(listIndex, amount) {
    if (listIndex > 0) dividers[listIndex - 1] = clampDivider(dividers[listIndex - 1] - amount);
  }

  function divider(listIndex, amount) {
    dividerPost(listIndex, amount);
    dividerPre(listIndex, amount);
  }

  function resized(window, area) {
    let diff = {};
    for (const [key, value] of Object.entries(window.frameGeometry)) diff[key] = value - window.renderGeometry[key];
    if (diff.width === 0 && diff.height === 0) return;

    const width = calc.width(area.width, lists.length - minimized());
    if (diff.width !== 0) {
      if (diff.x === 0) dividerPost(window.listIndex, diff.width / width);
      else dividerPre(window.listIndex, diff.width / width);
    }

    const height = calc.height(
      area.height,
      lists[window.listIndex].windows.length - lists[window.listIndex].minimized()
    );
    if (diff.height !== 0) {
      if (diff.y === 0) lists[window.listIndex].dividerPost(window.windowIndex, diff.height / height);
      else lists[window.listIndex].dividerPre(window.windowIndex, diff.height / height);
    }
  }

  function overlap(window, area) {
    let remainder = window.frameGeometry.x + 0.5 * window.frameGeometry.width - config.margin.l - area.x; // center
    for (const list of lists) {
      if (!list.minimized()) {
        remainder -= list.windows[0].frameGeometry.width + config.gap;
        if (remainder < 0) return list;
      }
    }
  }

  function moved(window, area) {
    const swapList = overlap(window, area);
    if (swapList) {
      const swapWindow = swapList.overlap(window, area);
      const list = lists[window.listIndex];
      if (
        swapWindow &&
        list.minSpace() - window.minSpace + swapWindow.minSpace <= 1 / lists.length &&
        swapList.minSpace() - swapWindow.minSpace + window.minSpace <= 1 / lists.length
      ) {
        list.windows[window.windowIndex] = swapWindow;
        swapList.windows[swapWindow.windowIndex] = window;
      }
    }
  }

  function render(area) {
    const width = calc.width(area.width, lists.length - minimized());
    let x = calc.x(area.x);
    let current = 0;
    let previous = 0;
    for (let [i, list] of lists.entries()) {
      if (list.minimized() === list.windows.length) continue;

      let divider = dividers[i] || 0;
      if (divider) {
        const l = lists[i + 1];
        if (l && l.minimized() === l.windows.length) divider = 0;
      }

      current = width * divider;
      const w = width + current - previous;

      list.render(x, area.y, w, area.height);

      x += w + config.gap;
      previous = current;
    }
  }

  return { lists, count, minimized, add, remove, swap, move, divider, resized, moved, render };
}
