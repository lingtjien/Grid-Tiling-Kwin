import QtQuick 2.0

Item {
  property var floating: ({})
  property var tiled: ({})

  function includes(pid) {
    for (const c of Object.values(tiled)) {
      if (c.pid === pid)
        return true;
    }
    return false;
  }

  function ignored(client) {
    if (config.whitelist && config.whitelist.test(client.resourceName))
      return false;
    return client.transient || !client.normalWindow || includes(client.pid) || (config.blacklist && config.blacklist.test(client.resourceName));
  }

  function addProps(client) {
    client.init = {
      noBorder: client.noBorder,
      geometry: client.geometry
    };
    client.minSpace = config.smallestSpace;
    for (const [minSpace, name] of config.minSpace) {
      if (name && name.test(client.resourceName)) {
        client.minSpace = minSpace;
        break;
      }
    }
    return client;
  }

  function tile(client) {
    if (!tiled.hasOwnProperty(client.internalId) && layout.addClient(client)) {
      tiled[client.internalId] = addSignals(client);
      if (floating.hasOwnProperty(client.internalId))
        delete floating[client.internalId];
      return client;
    }
  }

  function unTile(client) {
    if (client.hasOwnProperty('init')) {
      for (const [prop, value] of Object.entries(client.init))
        client[prop] = value;
    }

    client = tiled[client.internalId];
    if (layout.removeClient(client.clientIndex, client.lineIndex, client.screenIndex, client.desktopIndex, client.activityId)) {}
      delete tiled[removeSignals(client).internalId];
    return floating[client.internalId] = client;
  }

  function toggle(client) {
    if (client) {
      if (floating.hasOwnProperty(client.internalId))
        return tile(client);
      else if (tiled.hasOwnProperty(client.internalId))
        return unTile(client);
      else
        return add(client);
    }
  }

  function resized(client, screen) {
    let diff = {};
    for (const i of Object.keys(client.geometry))
      diff[i] = client.geometry[i] - client.geometryRender[i];
    if (diff.width === 0 && diff.height === 0)
      return;

    const area = workspace.clientArea(0, client.screen, client.desktop);
    const height = config.height(area.height, screen.lines[client.lineIndex].clients.length - screen.lines[client.lineIndex].nminimized());
    const width = config.width(area.width, screen.lines.length - screen.nminimized());
    if (diff.width !== 0) {
      if (diff.x === 0)
        screen.changeDividerAfter(diff.width / width, client.lineIndex);
      else
        screen.changeDividerBefore(diff.width / width, client.lineIndex);
    }

    if (diff.height !== 0) {
      if (diff.y === 0)
        screen.lines[client.lineIndex].changeDividerAfter(diff.height / height, client.clientIndex);
      else
        screen.lines[client.lineIndex].changeDividerBefore(diff.height / height, client.clientIndex);
    }
  }

  function moved(client, lines) {
    const area = workspace.clientArea(0, client.screen, client.desktop);

    let remainder = client.geometry.x + 0.5 * client.geometry.width - config.margin.l - area.x; // middle - start
    const swap_line = lines.find(l => {
      if (!l.minimized()) {
        remainder -= l.clients[0].geometry.width + config.gap;
        return remainder < 0;
      }
    });
    if (swap_line) {
      remainder = client.geometry.y + 0.5 * client.geometry.height - config.margin.t - area.y;
      const swap_client = swap_line.clients.find(c => {
        if (!c.minimized) {
          remainder -= c.geometry.height + config.gap;
          return remainder < 0;
        }
      });
      const line = lines[client.lineIndex];
      if (swap_client && line.minSpace() - client.minSpace + swap_client.minSpace <= 1 / lines.length && swap_line.minSpace() - swap_client.minSpace + client.minSpace <= 1 / lines.length) {
        line.clients[client.clientIndex] = swap_client;
        swap_line.clients[swap_client.clientIndex] = client;
      }
    }
  }

  function addSignals(client) {
    connect(client, 'clientFinishUserMovedResized', () => {
      const screen = layout.activities[client.activityId].desktops[client.desktopIndex].screens[client.screenIndex];
      resized(client, screen);
      moved(client, screen.lines);
      screen.render(client.screenIndex, client.desktopIndex, client.activityId);
    });

    connect(client, 'desktopChanged', () => {
      const activity = layout.activities[client.activityId];
      delay.set(config.delay, () => {
        if (client.onAllDesktops) {
          unTile(client);
        } else {
          const start = client.desktopIndex;
          let i = client.desktop - 1;
          const direction = Math.sign(i - start);
          if (direction) {
            while (!activity.moveClient(i, client.clientIndex, client.lineIndex, client.screenIndex, client.desktopIndex))
            {
              i += direction;
              if (i >= workspace.desktops)
                i = 0;
              else if (i < 0)
                i = workspace.desktops - 1;
              if (i === start)
                break;
            }
          }
        }
        activity.render(client.activityId);
      });
    });

    connect(client, 'screenChanged', () => {
      const desktop = layout.activities[client.activityId].desktops[client.desktopIndex];
      const start = client.screenIndex;
      let i = client.screen;
      const direction = Math.sign(i - start);
      delay.set(config.delay, () => {
        if (direction) {
          while (!desktop.moveClient(i, client.clientIndex, client.lineIndex, client.screenIndex, client.desktopIndex))
          {
            i += direction;
            if (i >= workspace.numScreens)
              i = 0;
            else if (i < 0)
              i = workspace.numScreens - 1;
            if (i === start)
              break;
          }
        }
        desktop.render(client.desktopIndex, client.activityId);
      });
    });

    connect(client, 'activitiesChanged', () => {
      const activities = client.activities;
      delay.set(config.delay, () => {
        if (activities.length !== 1 && !layout.moveClient(client, activities[0]))
          unTile(client);
        layout.render();
      });
    });

    return client;
  }

  function removeSignals(client) {
    disconnect(client);
    return client;
  }

  // public
  function add(client) {
    if (client &&
      (workspace.activities.length <= 1 || client.activities.length === 1) &&
      !floating.hasOwnProperty(client.internalId) &&
      !tiled.hasOwnProperty(client.internalId) &&
      !ignored(addProps(client))) {
      if (config.tile && tile(client))
        return client;
      floating[client.internalId] = client;
    }
  }

  function remove(client) {
    if (client) {
      if (tiled.hasOwnProperty(client.internalId)) {
        client = tiled[client.internalId];
        if (layout.removeClient(client.clientIndex, client.lineIndex, client.screenIndex, client.desktopIndex, client.activityId)) {
          delete tiled[removeSignals(client).internalId];
          return true;
        }
      } else if (floating.hasOwnProperty(client.internalId)) {
        delete floating[client.internalId];
      }
    }
  }

  function getActivity(client) {
    if (client && tiled.hasOwnProperty(client.internalId)) {
      client = tiled[client.internalId];
      return layout.activities[client.activityId];
    }
  }

  function getDesktop(client) {
    const activity = getActivity(client);
    if (activity)
      return activity.desktops[client.desktopIndex];
  }

  function getScreen(client) {
    const desktop = getDesktop(client);
    if (desktop)
      return desktop.screens[client.screenIndex];
  }

  function getActiveActivity() {
    const activity = layout.activities[workspace.currentActivity];
    if (activity)
      return activity;
  }

  function getActiveDesktop() {
    const activity = getActiveActivity();
    if (activity) {
      const desktop = activity.desktops[workspace.currentDesktop - 1];
      if (desktop)
        return desktop;
    }
  }

  function getActiveScreen() {
    const desktop = getActiveDesktop();
    if (desktop) {
      const screen = desktop.screens[workspace.activeScreen];
      if (screen)
        return screen;
    }
  }

  function init() {
    for (const client of Object.values(workspace.clientList()))
      add(client);
  }

  Component.onDestruction: {
    for (const client of Object.values(tiled))
      removeSignals(client);
  }
}
