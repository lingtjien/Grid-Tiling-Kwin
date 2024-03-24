import { shared, area } from 'shared.mjs';
import { grid } from 'config.mjs';
import { Output } from 'output.mjs';

export function Desktop() {
  const outputs = {}; // key = KWin::Output::serialNumber

  function count() {
    return Object.values(outputs).reduce((n, o) => n + o.count(), 0);
  }

  function add(window, desktopId) {
    const serial = window.output.serialNumber;
    if (!outputs.hasOwnProperty(serial)) outputs[serial] = Output();
    if (outputs[serial].add(window, grid(desktopId, serial))) {
      return window;
    } else {
      for (const o of shared.workspace.screens) {
        const serial = o.serialNumber;
        if (!outputs.hasOwnProperty(serial)) {
          const output = Output();
          if (output.add(window, grid(desktopId, serial))) {
            window.output = o;
            outputs[serial] = output;
            return window;
          }
        }
      }
    }
    // couldn't find any outputs with sufficient space to add window too
  }

  function remove(window) {
    const serial = window.output.serialNumber;
    if (outputs.hasOwnProperty(serial)) {
      const output = outputs[serial];
      if (output.remove(window)) {
        if (!output.count()) delete outputs[serial];
        return window;
      }
    }
  }

  function move(window, serial) {
    // serial = target
    const current = window.output.serialNumber;
    if (current !== serial) {
      if (!outputs.hasOwnProperty(serial)) outputs[serial] = Output();
      if (outputs[serial].add(window) && outputs[current].remove(window)) return window;
    }
  }

  function render(desktopId) {
    const desktop = shared.workspace.desktops.find((d) => d.id === desktopId);
    for (const [serialNumber, output] of Object.entries(outputs)) {
      output.render(
        area(
          desktop,
          shared.workspace.screens.find((s) => s.serialNumber === serialNumber)
        )
      );
    }
  }

  return { outputs, count, add, remove, move, render };
}
