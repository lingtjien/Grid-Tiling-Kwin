import { area, shared, setTimeout } from 'shared.mjs';
import { config, calc } from 'config.mjs';
import { Layout } from 'layout.mjs';

let floating = {};
let tiled = {};
let layout = Layout();

function connect(window, signal, callback) {
  if (!window.hasOwnProperty('connected')) window.connected = [];
  window.connected.push({ signal, callback });
  window[signal].connect(callback);
}
function disconnect(window) {
  for (const { signal, callback } of window.connected) window[signal].disconnect(callback);
  delete window.connected;
  return window;
}

function ignored(window) {
  if (config.whitelist && config.whitelist.test(window.resourceName)) return false;
  return window.transient || !window.normalWindow || (window.blacklist && config.blacklist.test(window.resourceName));
}

function addProps(window) {
  window.init = {
    noBorder: window.noBorder,
    frameGeometry: window.frameGeometry,
  };

  window.activities = [window.activities[0]];
  window.desktops = [window.desktops[0]];

  window.minSpace = config.smallestSpace;
  for (const [minSpace, name] of config.minSpace) {
    if (name && name.test(window.resourceName)) {
      window.minSpace = minSpace;
      break;
    }
  }
  return window;
}

function tile(window) {
  if (!tiled.hasOwnProperty(window.internalId) && layout.add(window)) {
    tiled[window.internalId] = addSignals(window);
    if (floating.hasOwnProperty(window.internalId)) delete floating[window.internalId];
    return window;
  }
}

function unTile(window) {
  if (window.hasOwnProperty('init')) {
    for (const [prop, value] of Object.entries(window.init)) window[prop] = value;
  }

  window = tiled[window.internalId];
  if (layout.remove(window)) {
    layout.render();
  }
  delete tiled[disconnect(window).internalId];
  return (floating[window.internalId] = window);
}

function addSignals(window) {
  connect(window, 'moveResizedChanged', () => {
    const output = getOutput(window);
    const a = area(window.desktops[0], window.output);
    output.resized(window, a);
    // output.moved(window, a);
    output.render(a);
  });

  connect(window, 'desktopsChanged', () => {
    print('desktopsChanged', window);
    // const activity = layout.activities[client.activityId];
    // delay.set(config.delay, () => {
    //   if (client.onAllDesktops) {
    //     unTile(client);
    //   } else {
    //     const start = client.desktopIndex;
    //     let i = client.desktop - 1;
    //     const direction = Math.sign(i - start);
    //     if (direction) {
    //       while (!activity.moveClient(i, client.clientIndex, client.lineIndex, client.screenIndex, client.desktopIndex))
    //       {
    //         i += direction;
    //         if (i >= workspace.desktops)
    //           i = 0;
    //         else if (i < 0)
    //           i = workspace.desktops - 1;
    //         if (i === start)
    //           break;
    //       }
    //     }
    //   }
    //   activity.render(client.activityId);
    // });
  });

  // TODO signal seems to be renamed, all window screen props -> output prop
  // connect(window, 'screenChanged', () => {
  // print('screenChanged', window);
  // const desktop = layout.activities[client.activityId].desktops[client.desktopIndex];
  // const start = client.screenIndex;
  // let i = client.screen;
  // const direction = Math.sign(i - start);
  // delay.set(config.delay, () => {
  //   if (direction) {
  //     while (!desktop.moveClient(i, client.clientIndex, client.lineIndex, client.screenIndex, client.desktopIndex))
  //     {
  //       i += direction;
  //       if (i >= workspace.numScreens)
  //         i = 0;
  //       else if (i < 0)
  //         i = workspace.numScreens - 1;
  //       if (i === start)
  //         break;
  //     }
  //   }
  //   desktop.render(client.desktopIndex, client.activityId);
  // });
  // });

  connect(window, 'activitiesChanged', () => {
    print('activitiesChanged', window);
    // const activities = client.activities;
    // delay.set(config.delay, () => {
    //   if (activities.length !== 1 && !layout.moveClient(client, activities[0]))
    //     unTile(client);
    //   layout.render();
    // });
  });

  return window;
}

export function add(window) {
  setTimeout(() => {
    if (
      window &&
      !floating.hasOwnProperty(window.internalId) &&
      !tiled.hasOwnProperty(window.internalId) &&
      window.activities.length &&
      window.desktops.length &&
      !ignored(addProps(window))
    ) {
      if (config.tile && tile(window)) {
        layout.render();
        shared.workspace.currentDesktop = window.desktops[0];
      }
      floating[window.internalId] = window;
    }
  }, config.delay);
}

export function remove(window) {
  if (window) {
    if (tiled.hasOwnProperty(window.internalId)) {
      window = tiled[window.internalId];
      if (layout.remove(window)) {
        delete tiled[disconnect(window).internalId];
        layout.render();
      }
    } else if (floating.hasOwnProperty(window.internalId)) {
      delete floating[window.internalId];
    }
  }
}

export function toggle() {
  const window = shared.workspace.activeWindow;
  if (window) {
    if (
      (floating.hasOwnProperty(window.internalId) && tile(window)) ||
      (tiled.hasOwnProperty(window.internalId) && unTile(window))
    ) {
      layout.render();
      return window;
    }
    return add(window);
  }
}

export function getActivity(window) {
  if (window && tiled.hasOwnProperty(window.internalId)) {
    window = tiled[window.internalId];
    return layout.activities[window.activities[0]];
  }
}

export function getDesktop(window) {
  const activity = getActivity(window);
  if (activity) return activity.desktops[window.desktops[0].id];
}

export function getOutput(window) {
  const desktop = getDesktop(window);
  if (desktop) return desktop.outputs[window.output.serialNumber];
}

export function getActiveActivity() {
  return layout.activities[shared.workspace.currentActivity];
}

export function getActiveDesktop() {
  const activity = getActiveActivity();
  if (activity) {
    return activity.desktops[shared.workspace.currentDesktop.id];
  }
}

export function getActiveOutput() {
  const desktop = getActiveDesktop();
  if (desktop) {
    return desktop.outputs[shared.workspace.activeScreen.serialNumber];
  }
}

export function render() {
  layout.render();
}

export function stop() {
  for (const window of Object.values(tiled)) disconnect(window);
  tiled = {};
  floating = {};
  layout = Layout();
}

export function restart() {
  stop();
  start();
}

export function start() {
  for (const window of shared.workspace.windows) add(window);
  layout.render();
}
