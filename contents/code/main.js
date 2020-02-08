// ---------
// Algorithm
// ---------

var Algorithm =
{
  toBool: function(value) // QVariant can be compared with == but not === as it is a type of itself
  {
    return value == true; // eslint-disable-line eqeqeq
  },
  trimSplitString: function(input)
  {
    var splitted = [];
    var raw = input.split(',');
    for (var i = 0; i < raw.length; i++)
    {
      var r = raw[i].trim();
      if (r.length > 0)
        splitted.push(r);
    }
    return splitted;
  },
  createMinSpaces: function(clientNames, clientSpaces)
  {
    var minSpaces = {};
    var names = this.trimSplitString(clientNames);
    var spaces = this.trimSplitString(clientSpaces);

    for (var i = 0; i < names.length && i < spaces.length; i++)
      minSpaces[names[i]] = 1 / Number(spaces[i]);
    return minSpaces;
  },
  createGrids: function(rowstring, columnstring)
  {
    var grids = [];
    var rows = this.trimSplitString(rowstring);
    var columns = this.trimSplitString(columnstring);
    for (var i = 0; i < rows.length && i < columns.length; i++)
      grids.push({row: Number(rows[i]), column: Number(columns[i])});
    return grids;
  },
  smallestSpace: function(grids)
  {
    var smallest = 1;
    for (var i = 0; i < grids.length; i++)
    {
      var space = 1 / (grids[i].row * grids[i].column);
      if (space < smallest)
        smallest = space;
    }
    return smallest;
  }
};

// ----------
// Parameters
// ----------

var Parameters =
{
  prefix: 'Grid-Tiling: ',
  grids: Algorithm.createGrids(readConfig('rows', '2, 2').toString(), readConfig('columns', '2, 3').toString()),
  gap: {
    value: Number(readConfig('gap', 16)),
    show: Algorithm.toBool(readConfig('gapShow', true))
  },
  divider: {
    bound: Number(readConfig('dividerBound', 0.4)),
    step: Number(readConfig('dividerStep', 0.05))
  },
  tile: Algorithm.toBool(readConfig('tile', true)),
  border: Algorithm.toBool(readConfig('border', false)),
  margin:
  {
    top: Number(readConfig('marginTop', 0)),
    bottom: Number(readConfig('marginBottom', 0)),
    left: Number(readConfig('marginLeft', 0)),
    right: Number(readConfig('marginRight', 0))
  },
  minSpaces: Algorithm.createMinSpaces(readConfig('minSpaceNames', 'texstudio, inkscape, krita, gimp, designer, creator, kdenlive, kdevelop, chromium, kate, spotify').toString(), readConfig('minSpaceValues', '1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2').toString()),
  ignored: {
    names: Algorithm.trimSplitString('ksmserver, krunner, lattedock, Plasma, plasma, plasma-desktop, plasmashell, plugin-container, '.concat(readConfig('ignoredNames', 'wine, overwatch').toString())),
    captions: Algorithm.trimSplitString(readConfig('ignoredCaptions', 'Trace Bitmap (Shift+Alt+B), Document Properties (Shift+Ctrl+D)').toString())
  }
};
Parameters.smallestSpace = Algorithm.smallestSpace(Parameters.grids);

// --------------
// Layout Classes
// --------------

function Column()
{
  this.clients = [];
  this.dividers = [];

  this.nminimized = function()
  {
    var count = 0;
    for (var i = 0; i < this.clients.length; i++)
    {
      if (this.clients[i].minimized)
        count += 1;
    }
    return count;
  };

  this.minSpace = function()
  {
    var sum = 0;
    for (var i = 0; i < this.clients.length; i++)
      sum += this.clients[i].minSpace;
    return sum;
  };

  this.addClient = function(client) // the size is the total size of a virtual desktop this column can occupy
  {
    this.clients.push(client);
    if (this.clients.length !== 0)
      this.dividers.push(0); // do not add a new divider when the first client is added to the column
    return 0;
  };

  this.removeClient = function(clientIndex)
  {
    if (clientIndex < 0 || clientIndex >= this.clients.length)
      return -1;
    this.clients.splice(clientIndex, 1);
    if (clientIndex === 0)
    {
      if (this.dividers.length > 0)
        this.dividers.splice(0, 1);
    }
    else
    {
      this.dividers.splice(clientIndex - 1, 1);
    }
    return 0;
  };

  this.swapClient = function(direction, clientIndex)
  {
    if (clientIndex < 0 || clientIndex >= this.clients.length)
      return -1;
    var client = this.clients[clientIndex];
    var i = clientIndex + direction; // target to swap client with
    if (i < 0 || i >= this.clients.length)
      return -1;
    this.clients[clientIndex] = this.clients[i];
    this.clients[i] = client;
    return 0;
  };

  this.changeDivider = function(direction, change, clientIndex)
  {
    if (clientIndex < 0 || clientIndex >= this.clients.length)
      return -1;

    // changes the divider that is for the client itself
    if (clientIndex !== this.clients.length - 1 && (direction === 'bottom' || direction === 'both'))
    {
      this.dividers[clientIndex] += change;
      if (this.dividers[clientIndex] > Parameters.divider.bound)
        this.dividers[clientIndex] = Parameters.divider.bound;
      if (this.dividers[clientIndex] < -Parameters.divider.bound)
        this.dividers[clientIndex] = -Parameters.divider.bound;
    }

    // changes the divider that is for the client before this one
    if (clientIndex !== 0 && (direction === 'top' || direction === 'both'))
    {
      this.dividers[clientIndex - 1] -= change;
      if (this.dividers[clientIndex - 1] > Parameters.divider.bound)
        this.dividers[clientIndex - 1] = Parameters.divider.bound;
      if (this.dividers[clientIndex - 1] < -Parameters.divider.bound)
        this.dividers[clientIndex - 1] = -Parameters.divider.bound;
    }

    return 0;
  };

  // rendering
  this.render = function(x, width, areaY, areaHeight, columnIndex, screenIndex, desktopIndex, activityName)
  {
    var gap = Parameters.gap.show ? Parameters.gap.value : 0;
    var nminimized = this.nminimized();

    var y = areaY + Parameters.margin.top + gap;
    var clientHeight = (areaHeight - Parameters.margin.top - Parameters.margin.bottom - ((this.clients.length - nminimized + 1) * gap)) / (this.clients.length - nminimized);

    var current = 0;
    var previous = 0;
    var divider = 0;
    for (var i = 0; i < this.clients.length; i++)
    {
      var client = this.clients[i];
      if (client.minimized)
        continue;

      if (i === this.clients.length - 1 || (i < this.clients.length - 1 && this.clients[i + 1].minimized))
        divider = 0;
      else
        divider = this.dividers[i];

      current = clientHeight * divider;
      var height = clientHeight + current - previous;

      // rendering the client
      var geometry =
      {
        x: Math.floor(x),
        y: Math.floor(y),
        width: Math.floor(width),
        height: Math.floor(height)
      };

      // these properties are used internally only so they must be set first as they are used to check
      client.geometryRender = geometry;
      client.clientIndex = i;
      client.columnIndex = columnIndex;
      client.screenIndex = screenIndex;
      client.desktopIndex = desktopIndex;
      client.activityName = activityName;

      // these properties are from kwin and will thus trigger additional signals, these properties must be set last to prevent the signals that are hooked into this script from triggering before the internal properties have been set
      client.noBorder = !Parameters.border;
      client.desktop = desktopIndex + 1; // KWin desktop index starting at 1
      client.screen = screenIndex;
      client.geometry = geometry;

      y += height + gap;

      previous = current;
    }
    return 0;
  };
}

function Screen() // eslint-disable-line no-redeclare
{
  this.columns = [];
  this.dividers = [];

  this.nminimized = function()
  {
    var count = 0;
    for (var i = 0; i < this.columns.length; i++)
    {
      if (this.columns[i].nminimized() === this.columns[i].clients.length)
        count += 1;
    }
    return count;
  };

  this.addColumn = function(column, maxColumns, index)
  {
    if (this.columns.length >= maxColumns)
      return -1;

    // check if adding a new column won't decrease the size of the clients inside any of the existing columns below their minSpace
    for (var i = 0; i < this.columns.length; i++)
    {
      if (this.columns[i].minSpace() > 1 / (this.columns.length + 1))
        return -1;
    }

    // do not add a new divider when the first column is added to the desktop
    if (index === undefined)
    {
      this.columns.push(column);
      if (this.columns.length > 1)
        this.dividers.push(0);
    }
    else
    {
      this.columns.splice(index, 0, column);
      if (this.columns.length > 1)
        this.dividers.splice(index, 0, 0);
    }
    return 0;
  };

  this.removeColumn = function(columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.columns.length)
      return -1;
    this.columns.splice(columnIndex, 1);
    if (columnIndex === 0)
    {
      if (this.dividers.length > 0)
      {
        this.dividers.splice(0, 1);
      }
    }
    else
    {
      this.dividers.splice(columnIndex - 1, 1);
    }
    return 0;
  };

  this.smallestColumn = function()
  {
    var index = -1;
    var space = 1;
    for (var i = 0; i < this.columns.length; i++)
    {
      var minSpace = this.columns[i].minSpace();
      if (minSpace < space)
      {
        index = i;
        space = minSpace;
      }
      else if (minSpace === space && index !== -1)
      {
        if (this.columns[i].clients.length < this.columns[index].clients.length)
        {
          index = i;
          space = minSpace;
        }
      }
    }
    return index;
  };

  this.addClient = function(client, maxRows, maxColumns)
  {
    var index = this.smallestColumn();
    if (index !== -1 && this.columns[index].minSpace() + client.minSpace <= 1 / this.columns.length && this.columns[index].clients.length < maxRows)
    {
      if (this.columns.length >= maxColumns || this.columns.length > this.columns[index].clients.length)
        return this.columns[index].addClient(client);
    }

    if (client.minSpace > 1 / (this.columns.length + 1) || this.addColumn(new Column(), maxColumns) === -1)
      return -1;
    return this.columns[this.columns.length - 1].addClient(client);
  };

  this.removeClient = function(clientIndex, columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.columns.length)
      return -1;
    if (this.columns[columnIndex].removeClient(clientIndex) !== 0)
      return -1;
    if (this.columns[columnIndex].clients.length === 0)
      return this.removeColumn(columnIndex);
    return 0;
  };

  this.swapColumn = function(direction, columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.columns.length)
      return -1;
    var column = this.columns[columnIndex];
    var i = columnIndex + direction; // target to swap client with
    if (i < 0 || i >= this.columns.length)
      return -1;
    this.columns[columnIndex] = this.columns[i];
    this.columns[i] = column;
    return 0;
  };

  this.swapClient = function(direction, clientIndex, columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.columns.length)
      return -1;
    var column = this.columns[columnIndex];
    if (clientIndex < 0 || clientIndex >= column.clients.length)
      return -1;
    var client = column.clients[clientIndex];

    var i = columnIndex + direction; // target to swap client with
    if (i < 0 || i >= this.columns.length)
      return -1;
    while (this.columns[i].clients.length !== column.clients.length)
    {
      i += direction;
      if (i < 0 || i >= this.columns.length)
        return this.swapColumn(direction, columnIndex);
    }
    column.clients[clientIndex] = this.columns[i].clients[clientIndex];
    this.columns[i].clients[clientIndex] = client;
    return 0;
  };

  this.moveClient = function(direction, maxRows, maxColumns, clientIndex, columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.columns.length)
      return -1;
    var column = this.columns[columnIndex];
    if (clientIndex < 0 || clientIndex >= column.clients.length)
      return -1;
    var client = column.clients[clientIndex];

    var i = columnIndex + direction; // target to move client to
    while (i >= 0 && i < this.columns.length && (this.columns[i].minSpace() + client.minSpace > 1 / this.columns.length || this.columns[i].clients.length >= maxRows))
      i += direction;

    if (i < 0 || i >= this.columns.length)
    {
      var c = new Column();
      c.addClient(client);
      if (i < 0)
      {
        if (this.addColumn(c, maxColumns, 0) === -1)
          return -1;
        return this.removeClient(clientIndex, columnIndex + 1);
      }
      else
      {
        if (this.addColumn(c, maxColumns) === -1)
          return -1;
        return this.removeClient(clientIndex, columnIndex);
      }
    }
    else
    {
      this.columns[i].addClient(client);
      return this.removeClient(clientIndex, columnIndex);
    }
  };

  this.changeDivider = function(direction, change, columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.columns.length)
      return -1;

    // changes the divider that is for the client itself
    if (columnIndex !== this.columns.length - 1 && (direction === 'right' || direction === 'both'))
    {
      this.dividers[columnIndex] += change;
      if (this.dividers[columnIndex] > Parameters.divider.bound)
        this.dividers[columnIndex] = Parameters.divider.bound;
      if (this.dividers[columnIndex] < -Parameters.divider.bound)
        this.dividers[columnIndex] = -Parameters.divider.bound;
    }

    // changes the divider that is for the client before this one
    if (columnIndex !== 0 && (direction === 'left' || direction === 'both'))
    {
      this.dividers[columnIndex - 1] -= change;
      if (this.dividers[columnIndex - 1] > Parameters.divider.bound)
        this.dividers[columnIndex - 1] = Parameters.divider.bound;
      if (this.dividers[columnIndex - 1] < -Parameters.divider.bound)
        this.dividers[columnIndex - 1] = -Parameters.divider.bound;
    }

    return 0;
  };

  // rendering
  this.render = function(screenIndex, desktopIndex, activityName)
  {
    var check = 0;

    var area = workspace.clientArea(0, screenIndex, desktopIndex + 1);
    var nminimized = this.nminimized();

    var gap = Parameters.gap.show ? Parameters.gap.value : 0;
    var x = area.x + Parameters.margin.left + gap; // first x coordinate
    var columnWidth = (area.width - Parameters.margin.left - Parameters.margin.right - ((this.columns.length - nminimized + 1) * gap)) / (this.columns.length - nminimized); // width per column

    var current = 0;
    var previous = 0;
    var divider = 0;
    for (var i = 0; i < this.columns.length; i++)
    {
      if (this.columns[i].nminimized() === this.columns[i].clients.length)
        continue;

      if (i === this.columns.length - 1 || (i < this.columns.length - 1 && this.columns[i + 1].nminimized() === this.columns[i + 1].clients.length))
        divider = 0;
      else
        divider = this.dividers[i];

      current = columnWidth * divider;
      var width = -previous + columnWidth + current;

      check += this.columns[i].render(x, width, area.y, area.height, i, screenIndex, desktopIndex, activityName);

      x += width + gap;
      previous = current;
    }
    return check;
  };
}

function Desktop()
{
  this.screens = [];

  this.addScreen = function(screen)
  {
    if (this.screens.length >= workspace.numScreens)
      return -1;
    this.screens.push(screen);
    return 0;
  };

  this.addClient = function(client)
  {
    var i = client.screen;
    do
    {
      while (i >= this.screens.length)
      {
        if (this.addScreen(new Screen()) !== 0)
          return -1;
      }
      if (this.screens[i].addClient(client, Parameters.grids[i].row, Parameters.grids[i].column) === 0)
        return 0;
      if (++i >= workspace.numScreens)
        i = 0;
    }
    while (i !== client.screen);
    return -1;
  };

  this.removeClient = function(clientIndex, columnIndex, screenIndex)
  {
    if (screenIndex < 0 || screenIndex >= this.screens.length)
      return -1;
    if (this.screens[screenIndex].removeClient(clientIndex, columnIndex) !== 0)
      return -1;
    // do not remove the screen to prevent moving of clients when screens are closed
    return 0;
  };

  this.moveClient = function(targetIndex, clientIndex, columnIndex, screenIndex)
  {
    if (screenIndex < 0 || screenIndex >= this.screens.length || targetIndex < 0 || targetIndex === screenIndex)
      return -1;

    var client = this.screens[screenIndex].columns[columnIndex].clients[clientIndex];
    while (targetIndex >= this.screens.length)
    {
      if (this.addScreen(new Screen()) === -1)
        return -1;
    }

    if (this.screens[targetIndex].addClient(client) === -1)
      return -1;
    return this.screens[screenIndex].removeClient(clientIndex, columnIndex);
  };

  this.render = function(desktopIndex, activityName)
  {
    var check = 0;
    for (var i = 0; i < this.screens.length; i++)
      check += this.screens[i].render(i, desktopIndex, activityName);
    return check;
  };
}

function Activity()
{
  this.desktops = [];

  this.addDesktop = function(desktop)
  {
    if (this.desktops.length >= workspace.desktops)
      return -1;
    this.desktops.push(desktop);
    return 0;
  };

  this.addClient = function(client)
  {
    var i = client.desktop - 1;
    do
    {
      while (i >= this.desktops.length)
      {
        if (this.addDesktop(new Desktop()) !== 0)
          return -1;
      }
      if (this.desktops[i].addClient(client) === 0)
        return 0;
      if (++i >= workspace.desktops)
        i = 0;
    }
    while (i !== client.desktop - 1);
    return -1;
  };

  this.removeClient = function(clientIndex, columnIndex, screenIndex, desktopIndex)
  {
    if (desktopIndex < 0 || desktopIndex >= this.desktops.length)
      return -1;
    if (this.desktops[desktopIndex].removeClient(clientIndex, columnIndex, screenIndex) !== 0)
      return -1;
    // do not remove the desktop to prevent moving of clients when desktops are closed
    return 0;
  };

  this.moveClient = function(targetIndex, clientIndex, columnIndex, screenIndex, desktopIndex)
  {
    if (desktopIndex < 0 || desktopIndex >= this.desktops.length || targetIndex < 0 || targetIndex === desktopIndex)
      return -1;

    var client = this.desktops[desktopIndex].screens[screenIndex].columns[columnIndex].clients[clientIndex];
    while (targetIndex >= this.desktops.length)
    {
      if (this.addDesktop(new Desktop()) === -1)
        return -1;
    }

    if (this.desktops[targetIndex].addClient(client) === -1)
      return -1;
    return this.desktops[desktopIndex].removeClient(clientIndex, columnIndex, screenIndex);
  };

  // rendering
  this.render = function(activityName)
  {
    var check = 0;
    for (var i = 0; i < this.desktops.length; i++)
      check += this.desktops[i].render(i, activityName);
    return check;
  };
}

function Layout()
{
  this.activities = {};

  this.addClient = function(client)
  {
    if (!this.activities.hasOwnProperty(workspace.currentActivity))
      this.activities[workspace.currentActivity] = new Activity();
    return this.activities[workspace.currentActivity].addClient(client);
  };

  this.removeClient = function(clientIndex, columnIndex, screenIndex, desktopIndex, activityName)
  {
    if (!this.activities.hasOwnProperty(activityName))
      return -1;
    if (this.activities[activityName].removeClient(clientIndex, columnIndex, screenIndex, desktopIndex) !== 0)
      return -1;
    if (this.activities[activityName].desktops.length === 0 || workspace.activities.indexOf(activityName) === -1)
      delete this.activities[activityName];
    return 0;
  };

  this.moveClient = function(client, activityName)
  {
    if (client.activityName === activityName || !this.activities.hasOwnProperty(client.activityName))
      return -1;
    if (!this.activities.hasOwnProperty(activityName))
      this.activities[activityName] = new Activity();
    if (this.removeClient(client.clientIndex, client.columnIndex, client.desktopIndex, client.activityName) !== 0)
      return -1;
    return this.activities[activityName].addClient(client);
  };

  // rendering
  this.render = function()
  {
    var check = 0;
    for (var activityName in this.activities)
      check += this.activities[activityName].render(activityName);
    return check;
  };
}

// --------------
// Client Methods
// --------------

var Client =
{
  valid: function(client)
  {
    return client && client.activities.length <= 1;
  },
  managed: function(client)
  {
    return floatingClients.hasOwnProperty(client.windowId) || tiledClients.hasOwnProperty(client.windowId);
  },
  ignored: function(client)
  {
    if (client.specialWindow || client.dialog || Parameters.ignored.captions.indexOf(client.caption.toString()) !== -1)
      return true;
    for (var i = 0; i < Parameters.ignored.names.length; i++)
    {
      if (client.resourceClass.toString().indexOf(Parameters.ignored.names[i]) !== -1 || client.resourceName.toString().indexOf(Parameters.ignored.names[i]) !== -1)
        return true;
    }
    return false;
  },
  addMinSpace: function(client)
  {
    client.minSpace = Parameters.smallestSpace;
    for (var name in Parameters.minSpaces)
    {
      if (client.resourceClass.toString().indexOf(name) !== -1 || client.resourceName.toString().indexOf(name) !== -1)
      {
        client.minSpace = Parameters.minSpaces[name];
        break;
      }
    }
    return client;
  },
  float: function(client)
  {
    floatingClients[client.windowId] = client;
    client.keepAbove = true;
    if (tiledClients.hasOwnProperty(client.windowId))
    {
      client = tiledClients[client.windowId];
      delete tiledClients[client.windowId];
      if (layout.removeClient(client.clientIndex, client.columnIndex, client.screenIndex, client.desktopIndex, client.activityName) === -1)
        return -1;
    }
    return layout.render();
  },
  tile: function(client)
  {
    if (layout.addClient(Client.addSignals(Client.addMinSpace(client))) !== 0)
      return -1;
    tiledClients[client.windowId] = client;
    client.keepAbove = false;
    if (floatingClients.hasOwnProperty(client.windowId))
      delete floatingClients[client.windowId];
    layout.render();
    workspace.currentDesktop = client.desktop;
    return 0;
  },
  resized: function(client, screen)
  {
    var gap = Parameters.gap.show ? Parameters.gap.value : 0;
    var diff = {
      x: client.geometry.x - client.geometryRender.x,
      y: client.geometry.y - client.geometryRender.y,
      width: client.geometry.width - client.geometryRender.width,
      height: client.geometry.height - client.geometryRender.height
    };
    if (diff.width === 0 && diff.height === 0)
      return -1;

    var area = workspace.clientArea(0, client.screen, client.desktop);
    var nclients = screen.columns[client.columnIndex].clients.length - screen.columns[client.columnIndex].nminimized();
    var ncolumns = screen.columns.length - screen.nminimized();
    var clientHeight = (area.height - Parameters.margin.top - Parameters.margin.bottom - ((nclients + 1) * gap)) / nclients;
    var columnWidth = (area.width - Parameters.margin.left - Parameters.margin.right - ((ncolumns + 1) * gap)) / ncolumns;
    if (diff.width !== 0)
    {
      if (diff.x === 0)
        screen.changeDivider('right', diff.width / columnWidth, client.columnIndex);
      else
        screen.changeDivider('left', diff.width / columnWidth, client.columnIndex);
    }
    if (diff.height !== 0)
    {
      if (diff.y === 0)
        screen.columns[client.columnIndex].changeDivider('bottom', diff.height / clientHeight, client.clientIndex);
      else
        screen.columns[client.columnIndex].changeDivider('top', diff.height / clientHeight, client.clientIndex);
    }
    return 0;
  },
  moved: function(client, columns)
  {
    var gap = Parameters.gap.show ? Parameters.gap.value : 0;
    var area = workspace.clientArea(0, client.screen, client.desktop);
    var i = 0; // column target index
    var remainder = client.geometry.x + 0.5 * client.geometry.width - Parameters.margin.left - area.x;
    for (; i < columns.length && remainder > 0; i++)
    {
      if (columns[i].nminimized() === columns[i].clients.length)
        continue;
      remainder -= columns[i].clients[0].geometry.width + gap;
    }
    if (i-- === 0)
      return -1;

    var j = 0; // client target index
    remainder = client.geometry.y + 0.5 * client.geometry.height - Parameters.margin.top - area.y;
    for (; j < columns[i].clients.length && remainder > 0; j++)
    {
      if (columns[i].clients[j].minimized)
        continue;
      remainder -= columns[i].clients[j].geometry.height + gap;
    }
    if (j-- === 0)
      return -1;

    if (columns[client.columnIndex].minSpace() - client.minSpace + columns[i].clients[j].minSpace > 1 / columns.length) // check if target fit in current
      return 0;
    if (columns[i].minSpace() - columns[i].clients[j].minSpace + client.minSpace > 1 / columns.length) // check if current fit in target
      return 0;

    columns[client.columnIndex].clients[client.clientIndex] = columns[i].clients[j];
    columns[i].clients[j] = client;
    return 0;
  },
  init: function(client)
  {
    if (!Client.valid(client) || Client.managed(client) || Client.ignored(client))
      return -1;
    if (!Parameters.tile || Client.tile(client) !== 0)
      floatingClients[client.windowId] = client;
    return 0;
  }
};

// ----------------------------
// Connecting KWin Signals
// ----------------------------

Client.addSignals = function(client)
{
  client.clientFinishUserMovedResized.connect(function(client)
  {
    if (!tiledClients.hasOwnProperty(client.windowId))
      return -1;
    client = tiledClients[client.windowId];

    var screen = layout.activities[client.activityName].desktops[client.desktopIndex].screens[client.screenIndex];
    if (Client.resized(client, screen) === 0 || Client.moved(client, screen.columns) === 0)
      return screen.render(client.screenIndex, client.desktopIndex, client.activityName);
    return 0;
  });
  client.clientStepUserMovedResized.connect(function(client)
  {
    if (!tiledClients.hasOwnProperty(client.windowId))
      return -1;
    client = tiledClients[client.windowId];

    var screen = layout.activities[client.activityName].desktops[client.desktopIndex].screens[client.screenIndex];
    if (Client.resized(client, screen) === 0)
      screen.render(client.screenIndex, client.desktopIndex, client.activityName);
    return 0;
  });
  client.desktopChanged.connect((function()
  {
    var c = client;
    return function()
    {
      if (c.desktop === c.desktopIndex + 1 || !tiledClients.hasOwnProperty(c.windowId))
        return -1;
      var activity = layout.activities[c.activityName];
      var targetIndex = c.desktop - 1;
      var start = c.desktopIndex;
      var direction = targetIndex > c.desktopIndex ? 1 : -1;
      while (activity.moveClient(targetIndex, c.clientIndex, c.columnIndex, c.screenIndex, c.desktopIndex) !== 0)
      {
        targetIndex += direction;
        if (targetIndex >= workspace.desktops)
          targetIndex = 0;
        if (targetIndex < 0)
          targetIndex = workspace.desktops - 1;
        if (targetIndex === start)
          return -1;
      }

      activity.render(c.activityName);
      workspace.currentDesktop = c.desktop; // switch to the new desktop
    };
  })());
  client.screenChanged.connect((function()
  {
    var c = client;
    return function()
    {
      if (c.screen === c.screenIndex || !tiledClients.hasOwnProperty(c.windowId))
        return -1;
      var desktop = layout.activities[c.activityName].desktops[c.desktopIndex];
      var targetIndex = c.screen;
      var start = c.screenIndex;
      var direction = targetIndex > c.desktopIndex ? 1 : -1;
      while (desktop.moveClient(targetIndex, c.clientIndex, c.columnIndex, c.screenIndex) !== 0)
      {
        targetIndex += direction;
        if (targetIndex >= workspace.numScreens)
          targetIndex = 0;
        if (targetIndex < 0)
          targetIndex = workspace.numScreens - 1;
        if (targetIndex === start)
          return -1;
      }

      desktop.render(c.desktopIndex, c.activityName);
    };
  })());
  client.activitiesChanged.connect(function(client)
  {
    if (!tiledClients.hasOwnProperty(client.windowId))
      return -1;
    client = tiledClients[client.windowId];
    if (client.activities.length !== 1)
      return Client.float(client);
    layout.moveClient(client, client.activities[0]);
    return layout.render();
  });
  return client;
};

workspace.clientActivated.connect(function(client) // clientAdded does not work for a lot of clients
{
  return Client.init(client);
});

workspace.clientRemoved.connect(function(client)
{
  if (tiledClients.hasOwnProperty(client.windowId))
  {
    client = tiledClients[client.windowId];
    delete tiledClients[client.windowId];
    if (layout.removeClient(client.clientIndex, client.columnIndex, client.screenIndex, client.desktopIndex, client.activityName) !== 0)
      return -1;
    return layout.render();
  }
  else if (floatingClients.hasOwnProperty(client.windowId))
  {
    delete floatingClients[client.windowId];
    return 0;
  }
  else
  {
    return -1;
  }
});

workspace.clientMinimized.connect(function(client)
{
  if (!tiledClients.hasOwnProperty(client.windowId))
    return -1;
  client = tiledClients[client.windowId];
  return layout.activities[client.activityName].desktops[client.desktopIndex].screens[client.screenIndex].render(client.screenIndex, client.desktopIndex, client.activityName);
});

workspace.clientUnminimized.connect(function(client)
{
  if (!tiledClients.hasOwnProperty(client.windowId))
    return -1;
  client = tiledClients[client.windowId];
  return layout.activities[client.activityName].desktops[client.desktopIndex].screens[client.screenIndex].render(client.screenIndex, client.desktopIndex, client.activityName);
});

// ---------
// Shortcuts
// ---------

function GlobalShortcut(name, shortcut, method)
{
  registerShortcut(Parameters.prefix + name, Parameters.prefix + name, shortcut, method);
}

[
  {shortcut: 'Up', direction: -1},
  {shortcut: 'Down', direction: 1}
].forEach(function(entry)
{
  GlobalShortcut('Swap ' + entry.shortcut, 'Meta+Ctrl+' + entry.shortcut, (function()
  {
    var direction = entry.direction;
    return function()
    {
      if (!tiledClients.hasOwnProperty(workspace.activeClient.windowId))
        return -1;
      var client = tiledClients[workspace.activeClient.windowId];
      var screen = layout.activities[client.activityName].desktops[client.desktopIndex].screens[client.screenIndex];

      if (screen.columns[client.columnIndex].swapClient(direction, client.clientIndex) !== 0)
        return -1;

      return screen.render(client.screenIndex, client.desktopIndex, client.activityName);
    };
  })());
});

[
  {text: 'Left', shortcut: 'Left', direction: -1},
  {text: 'Right', shortcut: 'Right', direction: 1}
].forEach(function(entry)
{
  GlobalShortcut('Move/Swap ' + entry.text, 'Meta+Ctrl+' + entry.shortcut, (function()
  {
    var direction = entry.direction;
    return function()
    {
      if (!tiledClients.hasOwnProperty(workspace.activeClient.windowId))
        return -1;
      var client = tiledClients[workspace.activeClient.windowId];
      var screen = layout.activities[client.activityName].desktops[client.desktopIndex].screens[client.screenIndex];
      var grid = Parameters.grids[client.screenIndex];
      if (screen.moveClient(direction, grid.row, grid.column, client.clientIndex, client.columnIndex) !== 0 && screen.swapClient(direction, client.clientIndex, client.columnIndex) !== 0)
        return -1;

      return screen.render(client.screenIndex, client.desktopIndex, client.activityName);
    };
  })());
});

GlobalShortcut('Move Next Desktop/Screen', 'Meta+End', function()
{
  var client = workspace.activeClient;
  if (client.screen < workspace.numScreens - 1)
    return client.screen++;
  else
    client.screen = 0;

  if (client.desktop < workspace.desktops) // indexing of desktops starts at 1 by Kwin
    client.desktop++;
  else
    client.desktop = 0;
  workspace.currentDesktop = client.desktop;
});

GlobalShortcut('Move Previous Desktop/Screen', 'Meta+Home', function()
{
  var client = workspace.activeClient;
  if (client.screen > 0)
    return client.screen--;
  else
    client.screen = workspace.numScreens - 1;

  if (client.desktop > 1) // indexing of desktops starts at 1 by Kwin
    client.desktop--;
  else
    client.desktop = workspace.desktops;
  workspace.currentDesktop = client.desktop;
});

[
  {text: 'Increase', shortcut: '=', direction: 1},
  {text: 'Decrease', shortcut: '-', direction: -1}
].forEach(function(entry)
{
  GlobalShortcut(entry.text + ' Size', 'Meta+' + entry.shortcut, (function()
  {
    var direction = entry.direction;
    return function()
    {
      if (!tiledClients.hasOwnProperty(workspace.activeClient.windowId))
        return -1;
      var client = tiledClients[workspace.activeClient.windowId];
      var screen = layout.activities[client.activityName].desktops[client.desktopIndex].screens[client.screenIndex];
      screen.columns[client.columnIndex].changeDivider('both', direction * Parameters.divider.step, client.clientIndex);
      screen.changeDivider('both', direction * Parameters.divider.step, client.columnIndex);

      return screen.render(client.screenIndex, client.desktopIndex, client.activityName);
    };
  })());
});

GlobalShortcut('Minimize Others/Unminimize Desktop', 'Meta+M', function()
{
  if (!layout.activities.hasOwnProperty(workspace.currentActivity))
    return -1;
  var screen = layout.activities[workspace.currentActivity].desktops[workspace.currentDesktop - 1].screens[workspace.activeScreen];
  var i, j, column;
  var nclients = 0, nminimized = 0;
  for (i = 0; i < screen.columns.length; i++)
  {
    nclients += screen.columns[i].clients.length;
    nminimized += screen.columns[i].nminimized();
  }

  if (nclients - nminimized <= 1)
  {
    for (i = 0; i < screen.columns.length; i++)
    {
      column = screen.columns[i];
      for (j = 0; j < column.clients.length; j++)
      {
        column.clients[j].minimized = false;
      }
    }
  }
  else
  {
    if (!tiledClients.hasOwnProperty(workspace.activeClient.windowId))
      return -1;
    var client = tiledClients[workspace.activeClient.windowId];

    for (i = 0; i < screen.columns.length; i++)
    {
      column = screen.columns[i];
      for (j = 0; j < column.clients.length; j++)
      {
        if (column.clients[j].windowId === client.windowId)
          column.clients[j].minimized = false;
        else
          column.clients[j].minimized = true;
      }
    }
  }
  return 0;
});

GlobalShortcut('Tile/Float', 'Meta+T', function()
{
  var client = workspace.activeClient;
  if (!Client.valid(client) || Client.ignored(client))
    return -1;
  else if (floatingClients.hasOwnProperty(client.windowId))
    return Client.tile(client);
  else if (tiledClients.hasOwnProperty(client.windowId))
    return Client.float(client);
  return 0;
});

GlobalShortcut('Toggle Tile', 'Meta+Shift+T', function()
{
  Parameters.tile = !Parameters.tile;
});

GlobalShortcut('Toggle Gap', 'Meta+G', function()
{
  Parameters.gap.show = !Parameters.gap.show;
  return layout.render();
});

GlobalShortcut('Toggle Border', 'Meta+B', function()
{
  Parameters.border = !Parameters.border;
  return layout.render();
});

GlobalShortcut('Close Desktop', 'Meta+Q', function()
{
  // looping is done backwards as the array is decreased in size in every iteration thus forward looping will result in skipping elements
  var clients = workspace.clientList();
  for (var i = clients.length - 1; i >= 0; i--)
  {
    var client = clients[i];
    if (client && client.screen === workspace.activeScreen && client.desktop === workspace.currentDesktop && client.activities.indexOf(workspace.currentActivity) !== -1)
      client.closeWindow();
  }
});

GlobalShortcut('Refresh', 'Meta+R', function()
{
  InitClients();
  return layout.render();
});

// ----
// Main
// ----

var tiledClients = {}; // windowId of added clients
var floatingClients = {}; // windowId of floating clients
var layout = new Layout(); // main class, contains all methods

function InitClients()
{
  var clients = workspace.clientList();
  for (var i = 0; i < clients.length; i++)
    Client.init(clients[i]);
}
InitClients();
