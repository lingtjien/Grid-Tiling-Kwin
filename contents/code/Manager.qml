import QtQuick 2.0

Item {
  property var floating: Object()
  property var tiled: Object()

  function valid(client) {
    return client && client.activities.length <= 1 && !client.isOnAllDesktops;
  }

  function managed(client) {
    return floating.hasOwnProperty(client.windowId) || tiled.hasOwnProperty(client.windowId);
  }

  function ignored(client) {
    return !client.normalWindow ||
    config.ignored.captions.some(c => c === client.caption) ||
    config.ignored.names.some(n => client.name.includes(n));
  }

  function addProps(client) {
    client.name = String(client.resourceName);
    client.init = {
      noBorder: client.noBorder,
      geometry: client.geometry
    };
    client.minSpace = config.smallestSpace;
    for (const [name, minSpace] of config.minSpaces) {
      if (client.name.includes(name)) {
        client.minSpace = minSpace;
        break;
      }
    }
    return client;
  }

  function tile(client) {
    if (!tiled.hasOwnProperty(client.windowId) && layout.addClient(client)) {
      tiled[client.windowId] = client;
      if (floating.hasOwnProperty(client.windowId))
        delete floating[client.windowId];
      return client;
    }
  }

  function unTile(client) {
    if (client.hasOwnProperty('init')) {
      for (const [prop, value] of Object.entries(client.init))
        client[prop] = value;
    }
    if (config.floatAbove)
      client.keepAbove = true;

    client = tiled[client.windowId];
    if (layout.removeClient(client.clientIndex, client.lineIndex, client.screenIndex, client.desktopIndex, client.activityId))
      delete tiled[client.windowId];
    return floating[client.windowId] = client;
  }

  function toggle(client) {
    if (valid(client)) {
      if (floating.hasOwnProperty(client.windowId))
        return tile(client);
      else if (tiled.hasOwnProperty(client.windowId))
        return unTile(client);
    }
  }

  function getScreen(client) {
    if (valid(client) && tiled.hasOwnProperty(client.windowId)) {
      client = tiled[client.windowId];
      return layout.activities[client.activityId].desktops[client.desktopIndex].screens[client.screenIndex];
    }
  }

  //function resized(client, screen) {
    //var gap = config.gap.show ? config.gap.value : 0;
    //var diff = {
      //x: client.geometry.x - client.geometryRender.x,
      //y: client.geometry.y - client.geometryRender.y,
      //width: client.geometry.width - client.geometryRender.width,
      //height: client.geometry.height - client.geometryRender.height
    //};
    //if (diff.width === 0 && diff.height === 0)
      //return -1;

    //var area = workspace.clientArea(0, client.screen, client.desktop);
    //var nclients = screen.columns[client.lineIndex].clients.length - screen.columns[client.lineIndex].nminimized();
    //var ncolumns = screen.columns.length - screen.nminimized();
    //var clientHeight = (area.height - config.margin.top - config.margin.bottom - ((nclients + 1) * gap)) / nclients;
    //var columnWidth = (area.width - config.margin.left - config.margin.right - ((ncolumns + 1) * gap)) / ncolumns;
    //if (diff.width !== 0) {
      //if (diff.x === 0)
        //screen.changeDivider('right', diff.width / columnWidth, client.lineIndex);
      //else
        //screen.changeDivider('left', diff.width / columnWidth, client.lineIndex);
    //}
    //if (diff.height !== 0) {
      //if (diff.y === 0)
        //screen.columns[client.lineIndex].changeDivider('bottom', diff.height / clientHeight, client.clientIndex);
      //else
        //screen.columns[client.lineIndex].changeDivider('top', diff.height / clientHeight, client.clientIndex);
    //}
    //return 0;
  //}

  //function moved(client, columns) {
    //var gap = config.gap.show ? config.gap.value : 0;
    //var area = workspace.clientArea(0, client.screen, client.desktop);
    //var i = 0; // column target index
    //var remainder = client.geometry.x + 0.5 * client.geometry.width - config.margin.left - area.x;
    //for (; i < columns.length && remainder > 0; i++) {
      //if (columns[i].nminimized() === columns[i].clients.length)
        //continue;
      //remainder -= columns[i].clients[0].geometry.width + gap;
    //}
    //if (i-- === 0)
      //return -1;

    //var j = 0; // client target index
    //remainder = client.geometry.y + 0.5 * client.geometry.height - config.margin.top - area.y;
    //for (; j < columns[i].clients.length && remainder > 0; j++) {
      //if (columns[i].clients[j].minimized)
        //continue;
      //remainder -= columns[i].clients[j].geometry.height + gap;
    //}
    //if (j-- === 0)
      //return -1;

    //if (columns[client.lineIndex].minSpace() - client.minSpace + columns[i].clients[j].minSpace > 1 / columns.length) // check if target fit in current
      //return 0;
    //if (columns[i].minSpace() - columns[i].clients[j].minSpace + client.minSpace > 1 / columns.length) // check if current fit in target
      //return 0;

    //columns[client.lineIndex].clients[client.clientIndex] = columns[i].clients[j];
    //columns[i].clients[j] = client;
    //return 0;
  //}

  //function addSignals(client)
  //{
    //client.clientFinishUserMovedResized.connect(function(client)
    //{
      //if (!tiled.hasOwnProperty(client.windowId))
        //return -1;
      //client = tiled[client.windowId];

      //var screen = layout.activities[client.activityId].desktops[client.desktopIndex].screens[client.screenIndex];
      //if (Client.resized(client, screen) === 0 || Client.moved(client, screen.columns) === 0)
        //screen.render(client.screenIndex, client.desktopIndex, client.activityId);
      //return 0;
    //});
    //client.clientStepUserMovedResized.connect(function(client)
    //{
      //if (!tiled.hasOwnProperty(client.windowId))
        //return -1;
      //client = tiled[client.windowId];

      //var screen = layout.activities[client.activityId].desktops[client.desktopIndex].screens[client.screenIndex];
      //if (Client.resized(client, screen) === 0)
        //screen.render(client.screenIndex, client.desktopIndex, client.activityId);
      //return 0;
    //});
    //client.desktopChanged.connect((function()
    //{
      //var c = client;
      //return function()
      //{
        //if (c.desktop === c.desktopIndex + 1 || !tiled.hasOwnProperty(c.windowId))
          //return -1;
        //var activity = layout.activities[c.activityId];
        //var targetIndex = c.desktop - 1;
        //var start = c.desktopIndex;
        //var direction = targetIndex > c.desktopIndex ? 1 : -1;
        //while (activity.moveClient(targetIndex, c.clientIndex, c.lineIndex, c.screenIndex, c.desktopIndex) !== 0)
        //{
          //targetIndex += direction;
          //if (targetIndex >= workspace.desktops)
            //targetIndex = 0;
          //else if (targetIndex < 0)
            //targetIndex = workspace.desktops - 1;
          //if (targetIndex === start)
            //break;
        //}
        //activity.render(c.activityId);
        //workspace.currentDesktop = c.desktop; // switch to the new desktop
      //};
    //})());
    //client.screenChanged.connect((function()
    //{
      //var c = client;
      //return function()
      //{
        //if (c.screen === c.screenIndex || !tiled.hasOwnProperty(c.windowId))
          //return -1;
        //var desktop = layout.activities[c.activityId].desktops[c.desktopIndex];
        //var targetIndex = c.screen;
        //var start = c.screenIndex;
        //var direction = targetIndex > c.desktopIndex ? 1 : -1;
        //while (desktop.moveClient(targetIndex, c.clientIndex, c.lineIndex, c.screenIndex) !== 0)
        //{
          //targetIndex += direction;
          //if (targetIndex >= workspace.numScreens)
            //targetIndex = 0;
          //else if (targetIndex < 0)
            //targetIndex = workspace.numScreens - 1;
          //if (targetIndex === start)
            //break;
        //}
        //desktop.render(c.desktopIndex, c.activityId);
      //};
    //})());
    //client.activitiesChanged.connect(function(client)
    //{
      //if (!tiled.hasOwnProperty(client.windowId))
        //return -1;
      //client = tiled[client.windowId];
      //if (client.activities.length !== 1)
        //return Client.float(client);
      //layout.moveClient(client, client.activities[0]);
      //return layout.render();
    //});
    //return client;
  //};

  function add(client) {
    if (!valid(client) || managed(client) || ignored(addProps(client)))
      return
    if (!config.tile || !tile(client))
      floating[client.windowId] = client;
    return client;
  }

  function remove(client) {
    if (!valid(client))
      return;
    if (tiled.hasOwnProperty(client.windowId)) {
      client = tiled[client.windowId];
      if (layout.removeClient(client.clientIndex, client.lineIndex, client.screenIndex, client.desktopIndex, client.activityId))
        delete tiled[client.windowId];
    } else if (floating.hasOwnProperty(client.windowId)) {
        delete floating[client.windowId];
    }
    return true;
  }

  function init() {
    for (const client of Object.values(workspace.clientList()))
      add(client);
  }
}
