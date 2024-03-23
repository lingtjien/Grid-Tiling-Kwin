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
      return window;
    } else {
      for (const { name } of shared.workspace.screens) {
        if (!outputs.hasOwnProperty(name)) {
          const output = Output();
          output.add(window, grid(desktopId, name));
          outputs[name] = output;
          return window;
        }
      }
    }
    // couldn't find any outputs with sufficient space to add window too
  }

  function remove(window) {
    const name = window.output.name;
    if (outputs.hasOwnProperty(name)) {
      const output = outputs[name];
      if (output.remove(window)) {
        if (!output.count()) delete outputs[name];
        return window;
      }
    }
  }

  function move(window, name) {
    // name = target
    const current = window.output.name;
    if (current !== name) {
      if (!outputs.hasOwnProperty(name)) outputs[name] = Output();
      if (outputs[name].add(window) && outputs[current].remove(window)) return window;
    }
  }

  function render(desktopId) {
    const desktop = shared.workspace.desktops.find((d) => d.id === desktopId);
    for (const [name, output] of Object.entries(outputs)) {
      output.render(
        area(
          desktop,
          shared.workspace.screens.find((s) => s.name === name)
        )
      );
    }
  }

  return { outputs, count, add, remove, move, render };
}
