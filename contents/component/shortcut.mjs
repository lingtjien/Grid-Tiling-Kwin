import { area, shared } from 'shared.mjs';
import { config, grid, setGap } from 'config.mjs';
import { getActiveOutput, getOutput, render, restart, start, toggle as tileFloat } from 'manager.mjs';

export { tileFloat };
export const refresh = start;
export const reset = restart;

export const toggle = {
  tile: () => {
    config.tile = !config.tile;
  },
  gap: () => {
    config.gapShow = !config.gapShow;
    setGap();
    render();
  },
  border: () => {
    config.border = !config.border;
    render();
  },
  minimizeDesktop: () => {
    const output = getActiveOutput();
    if (output) {
      const minimize = output.minimized() < output.count();
      for (const list of output.lists) {
        for (const window of list.windows) window.minimized = minimize;
      }
    }
  },
};

export const resize = {};
for (const [key, direction, size] of [
  ['increase', 1, 'step'],
  ['decrease', -1, 'step'],
  ['maximize', 1, 'bound'],
  ['minimize', -1, 'bound'],
]) {
  resize[key] = () => {
    const window = shared.workspace.activeWindow;
    const output = getOutput(window);
    if (output) {
      const amount = direction * config.divider[size];
      output.lists[window.listIndex].divider(window.windowIndex, amount);
      output.divider(window.listIndex, amount);
      output.render(area(window.desktops[0], window.output));
    }
  };
}

export const move = {};
for (const [key, amount] of [
  ['up', -1],
  ['down', 1],
]) {
  move[key] = () => {
    const window = shared.workspace.activeWindow;
    const output = getOutput(window);
    if (output && output.lists[window.listIndex].swap(window.windowIndex, amount))
      output.render(area(window.desktops[0], window.output));
  };
}
for (const [key, amount] of [
  ['left', -1],
  ['right', 1],
]) {
  move[key] = () => {
    const window = shared.workspace.activeWindow;
    const output = getOutput(window);
    if (
      output &&
      (output.move(window, amount, grid(window.desktops[0].id, window.output.name)) ||
        output.swap(window.listIndex, amount))
    )
      output.render(area(window.desktops[0], window.output));
  };
}

export function closeDesktop() {
  for (const window of shared.workspace.windows) {
    if (
      window &&
      window.output === shared.workspace.activeScreen &&
      window.desktops.includes(shared.workspace.currentDesktop) &&
      window.activities.includes(shared.workspace.currentActivity)
    )
      window.closeWindow();
  }
}
