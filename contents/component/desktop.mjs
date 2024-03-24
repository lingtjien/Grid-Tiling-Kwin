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
      window.outputSerial = serial;
      return window;
    } else {
      for (const o of shared.workspace.screens) {
        const serial = o.serialNumber;
        if (!outputs.hasOwnProperty(serial)) {
          const output = Output();
          if (output.add(window, grid(desktopId, serial))) {
            outputs[serial] = output;
            window.outputSerial = serial;
            window.output = o;
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
    // TODO set outputSerial correctly
    if (current !== serial) {
      if (!outputs.hasOwnProperty(serial)) outputs[serial] = Output();
      if (outputs[serial].add(window) && outputs[current].remove(window)) return window;
    }
  }

  // provide at least desktopId in overwrite
  function render(desktop, overwrite) {
    for (const [serial, output] of Object.entries(outputs)) {
      overwrite.outputSerial = serial;
      output.render(
        area(
          desktop,
          shared.workspace.screens.find((s) => s.serialNumber === serial)
        ),
        overwrite
      );
    }
  }

  return { outputs, count, add, remove, move, render };
}
