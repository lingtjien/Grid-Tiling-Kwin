// ---------
// Algorithm
// ---------

var Algorithm =
{
  toBool: function (value) // QVariant can be compared with == but not === as it is a type of itself
  {
    return value == true; // eslint-disable-line eqeqeq
  },
  min: function (value1, value2)
  {
    return value1 > value2 ? value2 : value1;
  },
  trimSplitString: function (input)
  {
    var split = input.split(',');
    for (var i = 0; i < split.length; i++)
    {
      split[i] = split[i].trim();
      if (split[i] === '') {split.splice(i, 1); continue;}
    }
    return split;
  },
  createMinSpaces: function (clientNames, clientSpaces)
  {
    var minSpaces =
    {
      names: [],
      spaces: [],
      size: function () {return Algorithm.min(this.names.length, this.spaces.length);}
    };

    var names = this.trimSplitString(clientNames);
    var spaces = this.trimSplitString(clientSpaces);

    for (var i = 0; i < Algorithm.min(names.length, spaces.length); i++)
    {
      minSpaces.names.push(names[i]);
      minSpaces.spaces.push(1 / Number(spaces[i]));
    }
    return minSpaces;
  },
  createGrids: function (rowstring, columnstring)
  {
    var grids =
    {
      rows: [],
      columns: [],
      size: function () {return Algorithm.min(this.rows.length, this.columns.length);},
      smallestSpace: function ()
      {
        var smallest = 1;
        for (var i = 0; i < this.size(); i++)
        {
          var space = 1 / (this.rows[i] * this.columns[i]);
          if (space < smallest) {smallest = space;}
        }
        return smallest;
      }
    };

    var rows = this.trimSplitString(rowstring);
    var columns = this.trimSplitString(columnstring);

    for (var i = 0; i < Algorithm.min(rows.length, columns.length); i++)
    {
      grids.rows.push(Number(rows[i]));
      grids.columns.push(Number(columns[i]));
    }

    return grids;
  },
  screenToGrid: function (screen)
  {
    var index = 0;
    if (screen < Parameters.grids.size()) {index = screen;}
    return {row: Parameters.grids.rows[index], column: Parameters.grids.columns[index]};
  }
};

// ----------
// Parameters
// ----------

var Parameters =
{
  grids: Algorithm.createGrids(readConfig('gridRows', '2, 2').toString(), readConfig('gridColumns', '2, 3').toString()),
  gap: Number(readConfig('gap', 16)),
  dividerBounds: Number(readConfig('dividerBounds', 0.3)),
  dividerStepSize: Number(readConfig('dividerStepSize', 0.05)),
  opacity: Number(readConfig('opacity', 0.9)),
  noOpacity: Algorithm.toBool(readConfig('noOpacity', false)),
  noBorder: Algorithm.toBool(readConfig('noBorder', true)),
  margin:
  {
    top: Number(readConfig('topMargin', 0)),
    bottom: Number(readConfig('bottomMargin', 0)),
    left: Number(readConfig('leftMargin', 0)),
    right: Number(readConfig('rightMargin', 0))
  },
  minSpaces: Algorithm.createMinSpaces(readConfig('clientNames', 'texstudio, inkscape, krita, gimp, designer, creator, kdenlive, kdevelop, chromium, kate, spotify').toString(), readConfig('clientSpaces', '1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2').toString()),
  ignoredClients: Algorithm.trimSplitString('ksmserver, krunner, lattedock, Plasma, plasma, plasma-desktop, plasmashell, plugin-container, '.concat(readConfig('ignoredClients', 'wine, overwatch').toString())),
  ignoredCaptions: Algorithm.trimSplitString(readConfig('ignoredCaptions', 'Trace Bitmap (Shift+Alt+B), Document Properties (Shift+Ctrl+D)').toString()),
  floatingClients: Algorithm.trimSplitString(readConfig('floatingClients', '').toString()),
  floatingCaptions: Algorithm.trimSplitString(readConfig('floatingCaptions', '').toString())
};

// ------------------------------------------
// Desktop Screen Row Column Index Converters
// ------------------------------------------

var Converter =
{
  nrow: function ()
  {
    return workspace.desktopGridHeight;
  },
  ncol: function ()
  {
    return workspace.desktopGridWidth * workspace.numScreens; // addional screens add extra columns
  },
  size: function ()
  {
    return this.nrow() * this.ncol();
  },
  desktopIndex: function (desktop, screen)
  {
    return workspace.numScreens * (desktop - 1) + screen;
  },
  desktop: function (desktopIndex)
  {
    return Math.floor(desktopIndex / workspace.numScreens) + 1; // indexing of desktops starts at 1 by Kwin
  },
  screen: function (desktopIndex)
  {
    return desktopIndex % workspace.numScreens;
  },
  currentIndex: function ()
  {
    return workspace.numScreens * (workspace.currentDesktop - 1) + workspace.activeScreen;
  }
};

// --------------
// Layout Classes
// --------------

function Column ()
{
  this.clients = [];
  this.dividers = [];

  this.nclients = function () {return this.clients.length;};
  this.ndividers = function () {return this.dividers.length;};
  this.nminimized = function ()
  {
    var count = 0;
    for (var i = 0; i < this.nclients(); i++)
    {
      if (this.clients[i].minimized) {count += 1;}
    }
    return count;
  };

  this.minSpace = function ()
  {
    var sum = 0;
    for (var i = 0; i < this.nclients(); i++)
    {
      sum += this.clients[i].minSpace;
    }
    return sum;
  };

  this.addClient = function (client) // the size is the total size of a virtual desktop this column can occupy
  {
    this.clients.push(client);
    if (this.nclients() !== 0) {this.dividers.push(0);} // do not add a new divider when the first client is added to the column
    return 0;
  };

  this.removeClient = function (clientIndex)
  {
    if (clientIndex < 0 || clientIndex >= this.nclients()) {return -1;}
    this.clients.splice(clientIndex, 1);
    if (clientIndex === 0)
    {
      if (this.dividers.length > 0)
      {
        this.dividers.splice(0, 1);
      }
    }
    else
    {
      this.dividers.splice(clientIndex - 1, 1);
    }
    return 0;
  };

  this.getClient = function (windowId)
  {
    for (var i = 0; i < this.nclients(); i++)
    {
      if (this.clients[i].windowId === windowId) {return this.clients[i];}
    }
    return -1;
  };

  this.swapClient = function (direction, clientIndex)
  {
    if (clientIndex < 0 || clientIndex >= this.nclients()) {return -1;}
    var client = this.clients[clientIndex];
    var i = clientIndex + direction; // target to swap client with
    if (i < 0 || i >= this.nclients()) {return -1;}
    this.clients[clientIndex] = this.clients[i];
    this.clients[i] = client;
    return 0;
  };

  this.changeDivider = function (direction, change, clientIndex)
  {
    if (clientIndex < 0 || clientIndex >= this.nclients()) {return -1;}

    // changes the divider that is for the client itself
    if (clientIndex !== this.nclients() - 1 && (direction === 'bottom' || direction === 'both'))
    {
      this.dividers[clientIndex] += change;
      if (this.dividers[clientIndex] > Parameters.dividerBounds) {this.dividers[clientIndex] = Parameters.dividerBounds;}
      if (this.dividers[clientIndex] < -Parameters.dividerBounds) {this.dividers[clientIndex] = -Parameters.dividerBounds;}
    }

    // changes the divider that is for the client before this one
    if (clientIndex !== 0 && (direction === 'top' || direction === 'both'))
    {
      this.dividers[clientIndex - 1] -= change;
      if (this.dividers[clientIndex - 1] > Parameters.dividerBounds) {this.dividers[clientIndex - 1] = Parameters.dividerBounds;}
      if (this.dividers[clientIndex - 1] < -Parameters.dividerBounds) {this.dividers[clientIndex - 1] = -Parameters.dividerBounds;}
    }

    return 0;
  };

  // rendering
  this.render = function (x, width, areaY, areaHeight, columnIndex, desktopIndex, activityName)
  {
    var nminimized = this.nminimized();

    var y = areaY + Parameters.margin.top + Parameters.gap;
    var clientHeight = (areaHeight - Parameters.margin.top - Parameters.margin.bottom - ((this.nclients() - nminimized + 1) * Parameters.gap)) / (this.nclients() - nminimized);

    var current = 0;
    var previous = 0;
    var divider = 0;
    for (var i = 0; i < this.nclients(); i++)
    {
      var client = this.clients[i];
      if (client.minimized) {continue;}

      if (i === this.nclients() - 1 || (i < this.nclients() - 1 && this.clients[i + 1].minimized)) {divider = 0;}
      else {divider = this.dividers[i];}

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
      client.desktopRender = Converter.desktop(desktopIndex);
      client.screenRender = Converter.screen(desktopIndex);
      client.geometryRender = geometry;
      client.clientIndex = i;
      client.columnIndex = columnIndex;
      client.desktopIndex = desktopIndex;
      client.activityName = activityName;

      // these properties are from kwin and will thus trigger additional signals, these properties must be set last to prevent the signals that are hooked into this script from triggering before the internal properties have been set
      client.noBorder = Parameters.noBorder;
      client.opacity = Parameters.noOpacity ? 1 : Parameters.opacity;
      client.desktop = Converter.desktop(desktopIndex);
      client.screen = Converter.screen(desktopIndex);
      client.geometry = geometry;

      y += height + Parameters.gap;

      previous = current;
    }
    return 0;
  };

}

function Desktop (rows, columns)
{
  this.maxRows = rows;
  this.maxCols = columns;

  this.columns = [];
  this.dividers = [];

  this.ncolumns = function () {return this.columns.length;};
  this.ndividers = function () {return this.dividers.length;};
  this.nminimized = function ()
  {
    var count = 0;
    for (var i = 0; i < this.ncolumns(); i++)
    {
      if (this.columns[i].nminimized() === this.columns[i].nclients()) {count += 1;}
    }
    return count;
  };

  this.addColumn = function (column, index)
  {
    if (this.ncolumns() >= this.maxCols) {return -1;}

    // check if adding a new column won't decrease the size of the clients inside any of the existing columns below their minSpace
    for (var i = 0; i < this.ncolumns(); i++)
    {
      if (this.columns[i].minSpace() > 1 / (this.ncolumns() + 1)) {return -1;}
    }

    // do not add a new divider when the first column is added to the desktop
    if (index === undefined)
    {
      this.columns.push(column);
      if (this.ncolumns() > 1) {this.dividers.push(0);}
    }
    else
    {
      this.columns.splice(index, 0, column);
      if (this.ncolumns() > 1) {this.dividers.splice(index, 0, 0);}
    }
    return 0;
  };

  this.removeColumn = function (columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.ncolumns()) {return -1;}
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

  this.smallestColumn = function ()
  {
    var index = -1;
    var space = 1;
    for (var i = 0; i < this.ncolumns(); i++)
    {
      var minSpace = this.columns[i].minSpace();
      if (minSpace < space)
      {
        index = i;
        space = minSpace;
      }
      else if (minSpace === space && index !== -1)
      {
        if (this.columns[i].nclients() < this.columns[index].nclients())
        {
          index = i;
          space = minSpace;
        }
      }
    }
    return index;
  };

  this.addClient = function (client)
  {
    var index = this.smallestColumn();
    if (index !== -1 && this.columns[index].minSpace() + client.minSpace <= 1 / this.ncolumns() && this.columns[index].nclients() < this.maxRows)
    {
      if (this.ncolumns() >= this.maxCols || this.ncolumns() > this.columns[index].nclients())
      {
        return this.columns[index].addClient(client);
      }
    }

    var column = new Column();
    if (client.minSpace > 1 / (this.ncolumns() + 1)) {return -1;}
    if (this.addColumn(column) === -1) {return -1;}
    return this.columns[this.ncolumns() - 1].addClient(client);
  };

  this.removeClient = function (clientIndex, columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.ncolumns()) {return -1;}
    if (this.columns[columnIndex].removeClient(clientIndex) !== 0) {return -1;}
    if (this.columns[columnIndex].nclients() === 0) {return this.removeColumn(columnIndex);}
    return 0;
  };

  this.getClient = function (windowId)
  {
    var client = -1;
    for (var i = 0; i < this.ncolumns(); i++)
    {
      client = this.columns[i].getClient(windowId);
      if (client !== -1) {break;}
    }
    return client;
  };

  this.swapColumn = function (direction, columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.ncolumns()) {return -1;}
    var column = this.columns[columnIndex];
    var i = columnIndex + direction; // target to swap client with
    if (i < 0 || i >= this.ncolumns()) {return -1;}
    this.columns[columnIndex] = this.columns[i];
    this.columns[i] = column;
    return 0;
  };

  this.swapClient = function (direction, clientIndex, columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.ncolumns()) {return -1;}
    var column = this.columns[columnIndex];
    if (clientIndex < 0 || clientIndex >= column.nclients()) {return -1;}
    var client = column.clients[clientIndex];

    var i = columnIndex + direction; // target to swap client with
    if (i < 0 || i >= this.ncolumns()) {return -1;}
    while (this.columns[i].nclients() !== column.nclients())
    {
      i += direction;
      if (i < 0 || i >= this.ncolumns()) {return this.swapColumn(direction, columnIndex);}
    }
    column.clients[clientIndex] = this.columns[i].clients[clientIndex];
    this.columns[i].clients[clientIndex] = client;
    return 0;
  };

  this.moveClient = function (direction, clientIndex, columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.ncolumns()) {return -1;}
    var column = this.columns[columnIndex];
    if (clientIndex < 0 || clientIndex >= column.nclients()) {return -1;}
    var client = column.clients[clientIndex];

    var i = columnIndex + direction; // target to move client to
    while (i >= 0 && i < this.ncolumns() && (this.columns[i].minSpace() + client.minSpace > 1 / this.ncolumns() || this.columns[i].nclients() >= this.maxRows))
    {
      i += direction;
    }

    if (i < 0 || i >= this.ncolumns())
    {
      var c = new Column();
      c.addClient(client);
      if (i < 0)
      {
        if (this.addColumn(c, 0) === -1) {return -1;}
        return this.removeClient(clientIndex, columnIndex + 1);
      }
      else
      {
        if (this.addColumn(c) === -1) {return -1;}
        return this.removeClient(clientIndex, columnIndex);
      }
    }
    else
    {
      this.columns[i].addClient(client);
      return this.removeClient(clientIndex, columnIndex);
    }
  };

  this.changeDivider = function (direction, change, columnIndex)
  {
    if (columnIndex < 0 || columnIndex >= this.ncolumns()) {return -1;}

    // changes the divider that is for the client itself
    if (columnIndex !== this.ncolumns() - 1 && (direction === 'right' || direction === 'both'))
    {
      this.dividers[columnIndex] += change;
      if (this.dividers[columnIndex] > Parameters.dividerBounds) {this.dividers[columnIndex] = Parameters.dividerBounds;}
      if (this.dividers[columnIndex] < -Parameters.dividerBounds) {this.dividers[columnIndex] = -Parameters.dividerBounds;}
    }

    // changes the divider that is for the client before this one
    if (columnIndex !== 0 && (direction === 'left' || direction === 'both'))
    {
      this.dividers[columnIndex - 1] -= change;
      if (this.dividers[columnIndex - 1] > Parameters.dividerBounds) {this.dividers[columnIndex - 1] = Parameters.dividerBounds;}
      if (this.dividers[columnIndex - 1] < -Parameters.dividerBounds) {this.dividers[columnIndex - 1] = -Parameters.dividerBounds;}
    }

    return 0;
  };

  // rendering
  this.render = function (desktopIndex, activityName)
  {
    var check = 0;

    var area = workspace.clientArea(0, Converter.screen(desktopIndex), Converter.desktop(desktopIndex));
    var nminimized = this.nminimized();

    var x = area.x + Parameters.margin.left + Parameters.gap; // first x coordinate
    var columnWidth = (area.width - Parameters.margin.left - Parameters.margin.right - ((this.ncolumns() - nminimized + 1) * Parameters.gap)) / (this.ncolumns() - nminimized); // width per column

    var current = 0;
    var previous = 0;
    var divider = 0;
    for (var i = 0; i < this.ncolumns(); i++)
    {
      if (this.columns[i].nminimized() === this.columns[i].nclients()) {continue;}

      if (i === this.ncolumns() - 1 || (i < this.ncolumns() - 1 && this.columns[i + 1].nminimized() === this.columns[i + 1].nclients())) {divider = 0;}
      else {divider = this.dividers[i];}

      current = columnWidth * divider;
      var width = -previous + columnWidth + current;

      check += this.columns[i].render(x, width, area.y, area.height, i, desktopIndex, activityName);

      x += width + Parameters.gap;
      previous = current;
    }
    return check;
  };

}

function Activity ()
{
  this.desktops = [];
  this.ndesktops = function () {return this.desktops.length;};

  this.addDesktop = function (desktop)
  {
    if (Converter.size() - this.ndesktops() < 1) {return -1;}
    this.desktops.push(desktop);
    return 0;
  };

  this.removeDesktop = function (desktopIndex)
  {
    if (desktopIndex < 0 || desktopIndex >= this.ndesktops()) {return -1;}
    this.desktops.splice(desktopIndex, 1);
    return 0;
  };

  this.addClient = function (client)
  {
    var grid, desktop;

    // try to add to current desktop
    var index = Converter.currentIndex();
    while (index >= this.ndesktops())
    {
      grid = Algorithm.screenToGrid(Converter.screen(this.ndesktops()));
      desktop = new Desktop(grid.row, grid.column);
      if (this.addDesktop(desktop) !== 0) {return -1;}
    }
    if (this.desktops[index].addClient(client) === 0) {return 0;}

    // try to add to any of the desktops in the current array
    for (var i = 0; i < this.ndesktops(); i++)
    {
      if (this.desktops[i].addClient(client) === 0) {return 0;}
    }

    // make a new desktop (if possible) and add to that
    grid = Algorithm.screenToGrid(Converter.screen(this.ndesktops()));
    desktop = new Desktop(grid.row, grid.column);
    if (this.addDesktop(desktop) !== 0) {return -1;}
    return this.desktops[this.ndesktops() - 1].addClient(client);
  };

  this.removeClient = function (clientIndex, columnIndex, desktopIndex)
  {
    if (desktopIndex < 0 || desktopIndex >= this.ndesktops()) {return -1;}
    if (this.desktops[desktopIndex].removeClient(clientIndex, columnIndex) !== 0) {return -1;}
    // do not remove the desktop to prevent moving of desktops when desktops are closed
    return 0;
  };

  this.getClient = function (windowId)
  {
    var client = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      client = this.desktops[i].getClient(windowId);
      if (client !== -1) {break;}
    }
    return client;
  };

  this.moveDesktop = function (targetIndex, clientIndex, columnIndex, desktopIndex)
  {
    if (desktopIndex < 0 || desktopIndex >= this.ndesktops() || targetIndex < 0 || targetIndex === desktopIndex) {return -1;}

    var client = this.desktops[desktopIndex].columns[columnIndex].clients[clientIndex];
    while (targetIndex >= this.ndesktops())
    {
      var grid = Algorithm.screenToGrid(Converter.screen(this.ndesktops()));
      var desktop = new Desktop(grid.row, grid.column);
      if (this.addDesktop(desktop) === -1) {return -1;}
    }

    if (this.desktops[targetIndex].addClient(client) === -1) {return -1;}
    return this.desktops[desktopIndex].removeClient(clientIndex, columnIndex);
  };

  // rendering
  this.render = function (activityName)
  {
    var check = 0;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      check += this.desktops[i].render(i, activityName);
    }
    return check;
  };

}

function Layout ()
{
  this.activities = {};

  this.addClient = function (client)
  {
    if (!this.activities.hasOwnProperty(workspace.currentActivity))
    {
      var activity = new Activity();
      this.activities[workspace.currentActivity] = activity;
    }
    return this.activities[workspace.currentActivity].addClient(client);
  };

  this.removeClient = function (clientIndex, columnIndex, desktopIndex, activityName)
  {
    if (!this.activities.hasOwnProperty(activityName)) {return -1;}
    if (this.activities[activityName].removeClient(clientIndex, columnIndex, desktopIndex) !== 0) {return -1;}
    if (this.activities[activityName].ndesktops() === 0 || workspace.activities.indexOf(activityName) === -1) {delete this.activities[activityName];}
    return 0;
  };

  this.getClient = function (windowId)
  {
    var client = -1;
    for (var activityName in this.activities)
    {
      client = this.activities[activityName].getClient(windowId);
      if (client !== -1) {break;}
    }
    return client;
  };

  this.moveClient = function (client, activityName)
  {
    if (client.activityName === activityName || !this.activities.hasOwnProperty(client.activityName)) {return -1;}
    if (!this.activities.hasOwnProperty(activityName))
    {
      var activity = new Activity();
      this.activities[activityName] = activity;
    }
    if (this.removeClient(client.clientIndex, client.columnIndex, client.desktopIndex, client.activityName) !== 0) {return -1;}
    return this.activities[activityName].addClient(client);
  };

  // rendering
  this.render = function ()
  {
    var check = 0;
    for (var activityName in this.activities)
    {
      check += this.activities[activityName].render(activityName);
    }
    return check;
  };

}

// ----
// Data
// ----

var tiledClients = {}; // windowId of added clients
var floatingClients = {}; // windowId of floating clients
var layout = new Layout(); // main class, contains all methods

// --------------
// Client Methods
// --------------

var Client =
{
  properties: function (nclients, ncolumns, desktopIndex)
  {
    var area = workspace.clientArea(0, Converter.screen(desktopIndex), Converter.desktop(desktopIndex));

    return {area: area, clientHeight: (area.height - Parameters.margin.top - Parameters.margin.bottom - ((nclients + 1) * Parameters.gap)) / nclients, columnWidth: (area.width - Parameters.margin.left - Parameters.margin.right - ((ncolumns + 1) * Parameters.gap)) / ncolumns};
  },
  resized: function (diff, client, desktop, properties)
  {
    if (diff.width === 0 && diff.height === 0) {return -1;}

    if (diff.width !== 0)
    {
      if (diff.x === 0)
      {
        desktop.changeDivider('right', diff.width / properties.columnWidth, client.columnIndex);
      }
      else
      {
        desktop.changeDivider('left', diff.width / properties.columnWidth, client.columnIndex);
      }
    }

    if (diff.height !== 0)
    {
      if (diff.y === 0)
      {
        desktop.columns[client.columnIndex].changeDivider('bottom', diff.height / properties.clientHeight, client.clientIndex);
      }
      else
      {
        desktop.columns[client.columnIndex].changeDivider('top', diff.height / properties.clientHeight, client.clientIndex);
      }
    }

    return 0;
  },
  moved: function (diff, client, activity, properties)
  {
    var targetIndex = Converter.desktopIndex(client.desktop, client.screen);
    if (targetIndex < 0 || targetIndex >= activity.ndesktops()) {return -1;}
    var target = activity.desktops[targetIndex];
    var current = activity.desktops[Converter.desktopIndex(client.desktopRender, client.screenRender)];

    var i = 0; // column target index
    var remainder = client.geometry.x + 0.5 * client.geometry.width - Parameters.margin.left - properties.area.x;
    for (; i < target.ncolumns() && remainder > 0; i++)
    {
      if (target.columns[i].nminimized() === target.columns[i].nclients()) {continue;}
      remainder -= target.columns[i].clients[0].geometry.width + Parameters.gap;
    }
    if (i-- === 0) {return -1;}

    var column = target.columns[i];

    var j = 0; // client target index
    remainder = client.geometry.y + 0.5 * client.geometry.height - Parameters.margin.top - properties.area.y;
    for (; j < column.nclients() && remainder > 0; j++)
    {
      if (column.clients[j].minimized) {continue;}
      remainder -= column.clients[j].geometry.height + Parameters.gap;
    }
    if (j-- === 0) {return -1;}

    if (current.columns[client.columnIndex].minSpace() - client.minSpace + target.columns[i].clients[j].minSpace > 1 / current.ncolumns()) {return 0;} // check if target fit in current
    if (target.columns[i].minSpace() - target.columns[i].clients[j].minSpace + client.minSpace > 1 / target.ncolumns()) {return 0;} // check if current fit in target

    current.columns[client.columnIndex].clients[client.clientIndex] = target.columns[i].clients[j];
    target.columns[i].clients[j] = client;
    return 0;
  },
  validate: function (client)
  {
    if (client.specialWindow || client.dialog) {return -1;}

    var clientClass = client.resourceClass.toString();
    var clientName = client.resourceName.toString();
    var clientCaption = client.caption.toString();

    var i;
    var minSpace = Parameters.grids.smallestSpace();
    for (i = 0; i < Parameters.minSpaces.size(); i++)
    {
      if (clientClass.indexOf(Parameters.minSpaces.names[i]) !== -1 || clientName.indexOf(Parameters.minSpaces.names[i]) !== -1)
      {
        minSpace = Parameters.minSpaces.spaces[i];
        break;
      }
    }
    client.minSpace = minSpace;

    if (Parameters.ignoredCaptions.indexOf(clientCaption) !== -1) {return -1;}
    for (i = 0; i < Parameters.ignoredClients.length; i++)
    {
      if (clientClass.indexOf(Parameters.ignoredClients[i]) !== -1 || clientName.indexOf(Parameters.ignoredClients[i]) !== -1) {return -1;}
    }

    if (!floatingClients.hasOwnProperty(client.windowId))
    {
      if (Parameters.floatingCaptions.indexOf(clientCaption) !== -1)
      {
        floatingClients[client.windowId] = true;
        return -1;
      }
      for (i = 0; i < Parameters.floatingClients.length; i++)
      {
        if (clientClass.indexOf(Parameters.floatingClients[i]) !== -1 || clientName.indexOf(Parameters.floatingClients[i]) !== -1)
        {
          floatingClients[client.windowId] = true;
          return -1;
        }
      }
    }

    return 0;
  },
  float: function (client)
  {
    if (floatingClients.hasOwnProperty(client.windowId)) {return -1;}
    floatingClients[client.windowId] = true;
    delete tiledClients[client.windowId];
    layout.removeClient(client.clientIndex, client.columnIndex, client.desktopIndex, client.activityName);
    return layout.render();
  },
  tile: function (client)
  {
    if (tiledClients.hasOwnProperty(client.windowId)) {return -1;}
    if (client.activities.length > 1) {return -1;}
    if (Client.validate(client) !== 0) {return -1;} // on succes adds minSpace to client
    if (layout.addClient(client) !== 0) {return -1;}
    tiledClients[client.windowId] = true;
    layout.render();
    workspace.currentDesktop = client.desktop;

    // -------------------------
    // Connecting Client Signals
    // -------------------------
    client.clientFinishUserMovedResized.connect (function (client)
    {
      client = layout.getClient(client.windowId);
      if (client === -1) {return -1;}

      var activity = layout.activities[client.activityName];
      var desktop = activity.desktops[client.desktopIndex];
      var properties = Client.properties(desktop.columns[client.columnIndex].nclients() - desktop.columns[client.columnIndex].nminimized(), desktop.ncolumns() - desktop.nminimized(), Converter.desktopIndex(client.desktop, client.screen));

      var diff =
      {
        x: client.geometry.x - client.geometryRender.x,
        y: client.geometry.y - client.geometryRender.y,
        width: client.geometry.width - client.geometryRender.width,
        height: client.geometry.height - client.geometryRender.height
      };

      if (Client.resized(diff, client, desktop, properties) === 0) {desktop.render(client.desktopIndex, client.activityName);}
      Client.moved(diff, client, activity, properties);

      return activity.render(client.activityName);
    });
    client.clientStepUserMovedResized.connect (function (client)
    {
      client = layout.getClient(client.windowId);
      if (client === -1) {return -1;}

      var desktop = layout.activities[client.activityName].desktops[client.desktopIndex];
      var properties = Client.properties(desktop.columns[client.columnIndex].nclients() - desktop.columns[client.columnIndex].nminimized(), desktop.ncolumns() - desktop.nminimized(), Converter.desktopIndex(client.desktop, client.screen));

      var diff =
      {
        x: client.geometry.x - client.geometryRender.x,
        y: client.geometry.y - client.geometryRender.y,
        width: client.geometry.width - client.geometryRender.width,
        height: client.geometry.height - client.geometryRender.height
      };

      if (Client.resized(diff, client, desktop, properties) === 0) {desktop.render(client.desktopIndex, client.activityName);}

      return 0;
    });
    client.desktopChanged.connect ((function ()
    {
      var c = client;
      return function ()
      {
        if (c.desktop === c.desktopRender || !tiledClients.hasOwnProperty(c.windowId)) {return -1;}
        var activity = layout.activities[c.activityName];
        var targetIndex = Converter.desktopIndex(c.desktop, c.screen);

        var start = c.desktopIndex;
        var direction = targetIndex > c.desktopIndex ? 1 : -1;
        while (activity.moveDesktop(targetIndex, c.clientIndex, c.columnIndex, c.desktopIndex) !== 0)
        {
          targetIndex += direction;
          if (targetIndex >= Converter.size()) {targetIndex = 0;}
          if (targetIndex < 0) {targetIndex = Converter.size() - 1;}
          if (targetIndex === start) {return -1;}
        }

        activity.render(c.activityName);
        workspace.currentDesktop = c.desktop; // switch to the new desktop
      };
    })());
    client.screenChanged.connect ((function ()
    {
      var c = client;
      return function ()
      {
        if (c.screen === c.screenRender || !tiledClients.hasOwnProperty(c.windowId)) {return -1;}
        var activity = layout.activities[c.activityName];
        var targetIndex = Converter.desktopIndex(c.desktop, c.screen);

        var start = c.desktopIndex;
        var direction = targetIndex > c.desktopIndex ? 1 : -1;
        while (activity.moveDesktop(targetIndex, c.clientIndex, c.columnIndex, c.desktopIndex) !== 0)
        {
          targetIndex += direction;
          if (targetIndex >= Converter.size()) {targetIndex = 0;}
          if (targetIndex < 0) {targetIndex = Converter.size() - 1;}
          if (targetIndex === start) {return -1;}
        }

        activity.render(c.activityName);
      };
    })());
    client.activitiesChanged.connect(function (client)
    {
      client = layout.getClient(client.windowId);
      if (client === -1) {return -1;}

      if (client.activities.length !== 1)
      {
        return Client.float(client);
      }
      layout.moveClient(client, client.activities[0]);
      return layout.render();
    });

    return 0;
  }
};

// ----------------------------
// Connecting Workspace Signals
// ----------------------------

workspace.clientActivated.connect (function (client) // clientAdded does not work for a lot of clients
{
  if (client === null || floatingClients.hasOwnProperty(client.windowId)) {return -1;}
  return Client.tile(client); // validate does floating already, do not check here and float on fail
});

workspace.clientRemoved.connect (function (client)
{
  if (tiledClients.hasOwnProperty(client.windowId))
  {
    delete tiledClients[client.windowId];
    client = layout.getClient(client.windowId);
    if (layout.removeClient(client.clientIndex, client.columnIndex, client.desktopIndex, client.activityName) !== 0) {return -1;}
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

workspace.clientMinimized.connect (function (client)
{
  client = layout.getClient(client.windowId);
  if (client === -1) {return -1;}
  client.minimized = true;
  return layout.activities[client.activityName].desktops[client.desktopIndex].render(client.desktopIndex, client.activityName);
});

workspace.clientUnminimized.connect (function (client)
{
  client = layout.getClient(client.windowId);
  if (client === -1) {return -1;}
  client.minimized = false;
  return layout.activities[client.activityName].desktops[client.desktopIndex].render(client.desktopIndex, client.activityName);
});

// ---------
// Shortcuts
// ---------

[
  {text: 'Up', shortcut: 'Up', method: 'vertical', direction: -1},
  {text: 'Down', shortcut: 'Down', method: 'vertical', direction: 1},
  {text: 'Left', shortcut: '', method: 'horizontal', direction: -1},
  {text: 'Right', shortcut: '', method: 'horizontal', direction: 1}
].forEach(function (entry)
{
  registerShortcut('Grid-Tiling: Swap ' + entry.text, 'Grid-Tiling: Swap ' + entry.text, 'Meta+Ctrl+' + entry.shortcut, (function ()
  {
    var method = entry.method;
    var direction = entry.direction;
    return function ()
    {
      var client = layout.getClient(workspace.activeClient.windowId);
      if (client === -1) {return -1;}
      var desktop = layout.activities[client.activityName].desktops[client.desktopIndex];

      if (method === 'vertical' && desktop.columns[client.columnIndex].swapClient(direction, client.clientIndex) !== 0) {return -1;}
      if (method === 'horizontal' && desktop.swapClient(direction, client.clientIndex, client.columnIndex) !== 0) {return -1;}

      return desktop.render(client.desktopIndex, client.activityName);
    };
  })());
});

[
  {text: 'Left', shortcut: 'Left', direction: -1},
  {text: 'Right', shortcut: 'Right', direction: 1}
].forEach(function (entry)
{
  registerShortcut('Grid-Tiling: Move/Swap ' + entry.text, 'Grid-Tiling: Move/Swap ' + entry.text, 'Meta+Ctrl+' + entry.shortcut, (function ()
  {
    var direction = entry.direction;
    return function ()
    {
      var client = layout.getClient(workspace.activeClient.windowId);
      if (client === -1) {return -1;}
      var desktop = layout.activities[client.activityName].desktops[client.desktopIndex];

      if (desktop.moveClient(direction, client.clientIndex, client.columnIndex) !== 0 && desktop.swapClient(direction, client.clientIndex, client.columnIndex) !== 0) {return -1;}

      return desktop.render(client.desktopIndex, client.activityName);
    };
  })());
});

[
  {text: 'Previous', shortcut: 'Home', direction: -1},
  {text: 'Next', shortcut: 'End', direction: 1}
].forEach (function (entry)
{
  registerShortcut ('Grid-Tiling: Move ' + entry.text + ' Desktop/Screen', 'Grid-Tiling: Move ' + entry.text + ' Desktop/Screen', 'Meta+' + entry.shortcut, (function ()
  {
    var direction = entry.direction;
    return function ()
    {
      var client = workspace.activeClient;
      if (!tiledClients.hasOwnProperty(client.windowId) && !floatingClients.hasOwnProperty(client.windowId)) {return -1;}
      var desktopIndex = Converter.desktopIndex(client.desktop, client.screen);
      client.desktop = Converter.desktop(desktopIndex + direction);
      client.screen = Converter.screen(desktopIndex + direction);
      if (floatingClients.hasOwnProperty(client.windowId)) {workspace.currentDesktop = client.desktop;}
      return 0;
    };
  })());
});

[
  {text: 'Border', shortcut: 'P', variable: 'noBorder'},
  {text: 'Opacity', shortcut: 'O', variable: 'noOpacity'}
].forEach (function (entry)
{
  registerShortcut ('Grid-Tiling: Toggle ' + entry.text, 'Grid-Tiling: Toggle ' + entry.text, 'Meta+' + entry.shortcut, (function ()
  {
    var variable = entry.variable;
    return function ()
    {
      Parameters[variable] = !Parameters[variable];
      return layout.render();
    };
  })());
});

[
  {text: 'Increase', shortcut: '=', direction: 1},
  {text: 'Decrease', shortcut: '-', direction: -1}
].forEach (function (entry)
{
  registerShortcut ('Grid-Tiling: ' + entry.text + ' Size', 'Grid-Tiling: ' + entry.text + ' Size', 'Meta+' + entry.shortcut, (function ()
  {
    var direction = entry.direction;
    return function ()
    {
      var client = layout.getClient(workspace.activeClient.windowId);
      if (client === -1) {return -1;}
      var desktop = layout.activities[client.activityName].desktops[client.desktopIndex];
      desktop.columns[client.columnIndex].changeDivider('both', direction * Parameters.dividerStepSize, client.clientIndex);
      desktop.changeDivider('both', direction * Parameters.dividerStepSize, client.columnIndex);

      return desktop.render(client.desktopIndex, client.activityName);
    };
  })());
});

registerShortcut ('Grid-Tiling: Close Desktop', 'Grid-Tiling: Close Desktop', 'Meta+Q', function ()
{
  // looping is done backwards as the array is decreased in size in every iteration thus forward looping will result in skipping elements
  if (!layout.activities.hasOwnProperty(workspace.currentActivity)) {return -1;}
  var desktop = layout.activities[workspace.currentActivity].desktops[Converter.currentIndex()];

  for (var i = desktop.ncolumns() - 1; i >= 0; i--)
  {
    var column = desktop.columns[i];
    for (var j = column.nclients() - 1; j >= 0; j--)
    {
      column.clients[j].closeWindow();
    }
  }
  return 0; // render is not needed as the close signal is connected
});

registerShortcut ('Grid-Tiling: Maximize', 'Grid-Tiling: Maximize', 'Meta+M', function ()
{
  var client = layout.getClient(workspace.activeClient.windowId);
  if (client === -1) {return -1;}

  if (!layout.activities.hasOwnProperty(workspace.currentActivity)) {return -1;}
  var desktop = layout.activities[client.activityName].desktops[client.desktopIndex];
  for (var i = 0; i < desktop.ncolumns(); i++)
  {
    var column = desktop.columns[i];
    for (var j = 0; j < column.nclients(); j++)
    {
      if (column.clients[j].windowId === client.windowId) {column.clients[j].minimized = false;}
      else {column.clients[j].minimized = true;}
    }
  }
  return 0; // render is not needed as the signal for minimize has been connected to render
});

registerShortcut ('Grid-Tiling: Unminimize Desktop', 'Grid-Tiling: Unminimize Desktop', 'Meta+,', function ()
{
  if (!layout.activities.hasOwnProperty(workspace.currentActivity)) {return -1;}
  var desktop = layout.activities[workspace.currentActivity].desktops[Converter.currentIndex()];

  for (var i = desktop.ncolumns() - 1; i >= 0; i--)
  {
    var column = desktop.columns[i];
    for (var j = column.nclients() - 1; j >= 0; j--)
    {
      column.clients[j].minimized = false;
    }
  }
  return 0; // render is not needed as the signal for unminimize has been connected to render
});

registerShortcut ('Grid-Tiling: Float', 'Grid-Tiling: Float', 'Meta+X', function ()
{
  var client = layout.getClient(workspace.activeClient.windowId);
  if (client === -1) {return -1;}
  return Client.float(client);
});

registerShortcut ('Grid-Tiling: Tile', 'Grid-Tiling: Tile', 'Meta+Z', function ()
{
  var client = workspace.activeClient;
  if (client === null || !floatingClients.hasOwnProperty(client.windowId)) {return -1;}
  Client.tile(client);
  delete floatingClients[client.windowId];
  return 0;
});

registerShortcut ('Grid-Tiling: Refresh', 'Grid-Tiling: Refresh', 'Meta+R', function ()
{
  return layout.render();
});
