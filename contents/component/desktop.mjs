import { shared, area } from 'shared.mjs';
import { grid } from 'config.mjs';
import { Output } from 'output.mjs';

export function Desktop() {
  const outputs = {}; // key = KWin::Output::name

  function count() {
    return Object.values(outputs).reduce((n, o) => n + o.count(), 0);
  }

  function add(window, desktopId) {
    const name = window.output.name;
    if (!outputs.hasOwnProperty(name)) outputs[name] = Output();
    if (outputs[name].add(window, grid(desktopId, name))) {
      window.outputName = name;
      return window;
    } else {
      for (const o of shared.workspace.screens) {
        const n = o.name;
        if (!outputs.hasOwnProperty(n)) outputs[n] = Output();
        if (outputs[n].add(window, grid(desktopId, n))) {
          window.outputName = n;
          shared.workspace.sendClientToScreen(window, o); // output is read only in api
          return window;
        }
      }
    }
    // couldn't find any outputs with sufficient space to add window too
  }

  function remove(window) {
    const n = window.outputName;
    const output = outputs[n];
    if (output && output.remove(window)) {
      if (!output.count()) delete outputs[n];
      return window;
    }
  }

  function moved(window) {
    let c, t;
    for (const [i, output] of shared.workspace.screens.entries()) {
      const n = output.name;
      if (n === window.outputName) c = i;
      if (n === window.output.name) t = i;
    }
    const direction = Math.sign(t - c);
    if (direction) {
      const max = shared.workspace.screens.length;
      let i = t;
      while (i !== c) {
        const output = shared.workspace.screens[i];
        const n = output.name;
        if (!outputs.hasOwnProperty(n)) outputs[n] = Output();
        const w = Object.assign({}, window);
        if (outputs[n].add(window, grid(window.desktopId, n))) {
          remove(w);
          window.outputName = n;
          shared.workspace.sendClientToScreen(window, output); // output is read only in api
          return window;
        }

        i += direction;
        if (i < 0) i = max - 1;
        if (i >= max) i = 0;
      }
    }
    return window;
  }

  // provide at least desktopId in overwrite
  function render(desktop) {
    for (const [name, output] of Object.entries(outputs)) {
      output.render(
        area(
          desktop,
          shared.workspace.screens.find((s) => s.name === name)
        )
      );
    }
  }

  return { outputs, count, add, remove, moved, render };
}
