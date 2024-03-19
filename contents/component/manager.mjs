import { shared } from 'shared.mjs';
import { config, calc } from 'config.mjs';
import { Layout } from 'layout.mjs';

const floating = {};
const tiled = {};
const layout = Layout();

function ignored(window) {
  if (config.whitelist && config.whitelist.test(window.resourceName)) return false;
  return window.transient || !window.normalWindow || (window.blacklist && config.blacklist.test(window.resourceName));
}

function addProps(window) {
  window.init = {
    noBorder: window.noBorder,
    frameGeometry: window.frameGeometry,
  };
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

function addSignals(window) {
  //TODO
  connect(window, 'moveResizedChanged', () => {
    print('moveResizedChanged', window);
    // const screen = layout.activities[client.activityId].desktops[client.desktopIndex].screens[client.screenIndex];
    // resized(client, screen);
    // moved(client, screen.lines);
    // screen.render(client.screenIndex, client.desktopIndex, client.activityId);
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
  if (
    window &&
    window.activities.length === 1 &&
    !floating.hasOwnProperty(window.internalId) &&
    !tiled.hasOwnProperty(window.internalId) &&
    !ignored(addProps(window))
  ) {
    if (config.tile && tile(window)) {
      layout.render();
      shared.workspace.currentDesktop = window.desktops[0];
    }
    floating[window.internalId] = window;
  }
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

export function tileToggle(window) {
  if (window) {
    if (floating.hasOwnProperty(window.internalId)) {
      return tile(window);
    } else if (tiled.hasOwnProperty(window.internalId)) {
      return unTile(window);
    }
    return add(window);
  }
}

export function resized(client, screen) {
  // TODO
  let diff = {};
  for (const i of Object.keys(client.geometry)) diff[i] = client.geometry[i] - client.geometryRender[i];
  if (diff.width === 0 && diff.height === 0) return;

  const area = workspace.clientArea(0, client.screen, client.desktop);
  const height = calc.height(
    area.height,
    screen.lines[client.lineIndex].clients.length - screen.lines[client.lineIndex].nminimized()
  );
  const width = calc.width(area.width, screen.lines.length - screen.nminimized());
  if (diff.width !== 0) {
    if (diff.x === 0) screen.changeDividerAfter(diff.width / width, client.lineIndex);
    else screen.changeDividerBefore(diff.width / width, client.lineIndex);
  }

  if (diff.height !== 0) {
    if (diff.y === 0) screen.lines[client.lineIndex].changeDividerAfter(diff.height / height, client.clientIndex);
    else screen.lines[client.lineIndex].changeDividerBefore(diff.height / height, client.clientIndex);
  }
}

export function moved(client, lines) {
  // TODO
  const area = workspace.clientArea(0, client.screen, client.desktop);

  let remainder = client.geometry.x + 0.5 * client.geometry.width - config.margin.l - area.x; // middle - start
  const swap_line = lines.find((l) => {
    if (!l.minimized()) {
      remainder -= l.clients[0].geometry.width + config.gap;
      return remainder < 0;
    }
  });
  if (swap_line) {
    remainder = client.geometry.y + 0.5 * client.geometry.height - config.margin.t - area.y;
    const swap_client = swap_line.clients.find((c) => {
      if (!c.minimized) {
        remainder -= c.geometry.height + config.gap;
        return remainder < 0;
      }
    });
    const line = lines[client.lineIndex];
    if (
      swap_client &&
      line.minSpace() - client.minSpace + swap_client.minSpace <= 1 / lines.length &&
      swap_line.minSpace() - swap_client.minSpace + client.minSpace <= 1 / lines.length
    ) {
      line.clients[client.clientIndex] = swap_client;
      swap_line.clients[swap_client.clientIndex] = client;
    }
  }
}

export function getActivity(window) {
  if (window && tiled.hasOwnProperty(window.internalId)) {
    window = tiled[window.internalId];
    return layout.activities[window.activityId];
  }
}

export function getDesktop(window) {
  const activity = getActivity(window);
  if (activity) return activity.desktops[window.desktopIndex];
}

export function getScreen(window) {
  const desktop = getDesktop(window);
  if (desktop) return desktop.screens[window.screenIndex];
}

export function getActiveActivity() {
  const activity = layout.activities[shared.workspace.currentActivity];
  if (activity) return activity;
}

export function getActiveDesktop() {
  const activity = getActiveActivity();
  if (activity) {
    return activity.desktops[shared.workspace.currentDesktop - 1]; // TODO
  }
}

export function getActiveScreen() {
  const desktop = getActiveDesktop();
  if (desktop) {
    return desktop.screens[shared.workspace.activeScreen]; // TODO
  }
}

export function stop() {
  for (const window of Object.values(tiled)) disconnect(window);
  tiled = {};
  floating = {};
}

export function restart() {
  stop();
  start();
}

export function start() {
  for (const window of shared.workspace.windows) add(window);
  layout.render();
}
