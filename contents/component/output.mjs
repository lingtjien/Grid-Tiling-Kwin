import { calc, clampDivider, config } from 'config.mjs';
import { List } from 'list.mjs';

export function Output() {
  const lists = [];
  const dividers = [];

  function count() {
    return lists.reduce((n, l) => n + l.windows.length, 0);
  }

  function minimized() {
    return lists.reduce((s, l) => s + l.minimized(), 0);
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
    const i = listIndex + amount;
    const list = lists[listIndex];
    if (list && i >= 0 && i < lists.length) {
      lists[listIndex] = lists[i];
      lists[i] = list;

      for (const w of lists[listIndex].windows) w.windowIndex = i;
      for (const w of lists[i].windows) w.windowIndex = listIndex;

      return list;
    }
  }

  function move(window, amount, grid) {
    const t = window.listIndex + amount;
    let target = lists[t];
    if (!target && lists.length < grid[1]) target = lists[addList(amount < 0)];

    if (target && target.minSpace() + window.minSpace <= 1 / lists.length && target.windows.length < grid[0]) {
      remove(window);
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

  function render(area) {
    const width = calc.width(area.width, lists.length - minimized());

    let x = calc.x(area.x);
    let current = 0;
    let previous = 0;
    for (let [i, list] of lists.entries()) {
      if (list.minimized()) continue;

      const divider = i === lists.length - 1 || (i < lists.length - 1 && lists[i + 1].minimized()) ? 0 : dividers[i];

      current = width * divider;
      const w = -previous + width + current;

      for (const window of list.render(x, area.y, w, area.height)) window.listIndex = i;

      x += w + config.gap;
      previous = current;
    }
  }

  return { lists, count, minimized, add, remove, swap, move, divider, render };
}