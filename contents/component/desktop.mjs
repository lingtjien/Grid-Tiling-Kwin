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
        if (!outputs.hasOwnProperty(serial)) outputs[serial] = Output();
        if (outputs[serial].add(window, grid(desktopId, serial))) {
          window.outputSerial = serial;
          shared.workspace.sendClientToScreen(window, o); // output is read only in api
          return window;
        }
      }
    }
    // couldn't find any outputs with sufficient space to add window too
  }

  function remove(window) {
    const serial = window.outputSerial;
    if (outputs.hasOwnProperty(serial)) {
      const output = outputs[serial];
      if (output.remove(window)) {
        if (!output.count()) delete outputs[serial];
        return window;
      }
    }
  }

  function moved(window) {
    let start, c, t;
    for (const [i, screen] of shared.workspace.screens.entries()) {
      const serial = screen.serialNumber;
      if (serial === window.outputSerial) {
        c = i;
        start = screen;
      }
      if (serial === window.output.serialNumber) t = i;
    }
    const direction = Math.sign(t - c);
    if (direction) {
      const n = shared.workspace.screens.length;
      let i = t;
      while (i !== c) {
        const output = shared.workspace.screens[i];
        const serial = output.serialNumber;
        if (!outputs.hasOwnProperty(serial)) outputs[serial] = Output();
        const w = Object.assign({}, window);
        if (outputs[serial].add(window, grid(window.desktopId, serial))) {
          remove(w);
          window.outputSerial = serial;
          shared.workspace.sendClientToScreen(window, output); // output is read only in api
          return window;
        }

        i += direction;
        if (i < 0) i = n - 1;
        if (i >= n) i = 0;
      }
    }
    return window;
  }

  // provide at least desktopId in overwrite
  function render(desktop) {
    for (const [serial, output] of Object.entries(outputs)) {
      output.render(
        area(
          desktop,
          shared.workspace.screens.find((s) => s.serialNumber === serial)
        )
      );
    }
  }

  return { outputs, count, add, remove, moved, render };
}
