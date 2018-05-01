// ----------
// Parameters
// ----------

// readConfig returns an object, so needs to be converted if you want to use === instead of ==
var gap = Number(readConfig("gap", 16));
var dividerBounds = Number(readConfig("dividerBounds", 0.2)); // from this value to 1-value
var dividerStepSize = Number(readConfig("dividerStepSize", 0.05));
var moveThreshold = Number(readConfig("moveThreshold", 0.5)); // move clients outside this fraction of its own size
var opacity = Number(readConfig("opacity", 0.9));
var noOpacity = ToBool(readConfig("noOpacity", false));
var noBorder = ToBool(readConfig("noBorder", true));

var maxRows = 3;
var maxCols = 2;

var margin =
{
  top: Number(readConfig("topMargin", 0)),
  bottom: Number(readConfig("bottomMargin", 0)),
  left: Number(readConfig("leftMargin", 0)),
  right: Number(readConfig("rightMargin", 0)),
};

var fullClients = TrimSplitString(readConfig("fullClients", "texstudio, inkscape, gimp, designer, creator, kdevelop, kdenlive").toString());

var halfClients = TrimSplitString(readConfig("halfClients", "chromium, kate, spotify").toString())

var ignoredClients = TrimSplitString("ksmserver, krunner, lattedock, Plasma, plasma, plasma-desktop, plasmashell, plugin-container, ".concat(readConfig("ignoredClients", "wine, overwatch").toString()));

var ignoredCaptions = TrimSplitString(readConfig("ignoredCaptions", "Trace Bitmap (Shift+Alt+B), Document Properties (Shift+Ctrl+D)").toString());

// -----------------
// Library Functions
// -----------------

function TrimSplitString (string)
{
  var split = string.split(",");
  for (var i = 0; i < split.length; i++)
  {
    if (split[i].trim() === "") {split.splice(i, 1); continue;};
    split[i] = split[i].trim();
  };
  return split;
};

function ToBool (value)
{
  if (value == false) {return false;}
  else {return true;};
};

function GetDesktopTotal ()
{
  return workspace.desktops*workspace.numScreens;
};

function GetDesktopNumber (desktopIndex)
{
  return Math.floor(desktopIndex/workspace.numScreens)+1;
};

function GetScreenNumber (desktopIndex)
{
  return desktopIndex%workspace.numScreens;
};

function GetDesktopIndex ()
{
  return workspace.numScreens*(workspace.currentDesktop-1)+workspace.activeScreen;
};

function GetDesktopRows ()
{
  return workspace.desktopGridHeight;
};
  
function GetDesktopCols ()
{
  return workspace.desktopGridWidth;
};

// --------------
// Layout Classes
// --------------

function Desktop ()
{
  this.clients = [[]]; // clients are stored per column, with every column being an array
  
  this.cols = function ()
  {
    return this.clients.length;
  };
  
  this.rows = function (colIndex)
  {
    return this.clients[colIndex].length;
  };
  
  this.colSize = function (colIndex)
  {
    var sum = 0;
    for (var i = 0; i < this.rows(i); i++)
    {
      sum += this.clients[colIndex][i].minSize;
    }
    return sum;
  };
  
  this.addCol = function (client)
  {
    this.clients.push([]);
    this.dividers.addCol();
    this.addRow(client, this.cols()-1);
  };
  
  this.removeCol = function(colIndex)
  {
    this.clients.splice(colIndex, 1);
    this.removeColDivider(colIndex);
  };
  
  this.addRow = function (client, colIndex)
  {
    this.clients[colIndex].push(client);
    this.addRowDivider(colIndex);
  };
  
  this.removeRow = function (colIndex, rowIndex)
  {
    this.clients[colIndex].splice(rowIndex, 1);
    this.removeRowDivider(colIndex, rowIndex);
  };
  
  this.addClient = function (client)
  {
    // one devided by the number of columns is the maximum size a column can occupy, subtracting the total size of a column from this leaves us with the size that is left for the potential new client
    
    // first try to add new column for client
    if (1/this.cols() >== client.minSize && this.cols() < maxCols && this.cols() <== this.rows())
    {
      this.addCol(client);
      return 0;
    }
    
    // then try to add client to the first column with space
    for (var i = 0; i < this.cols(); i++)
    {
      if (this.rows(i) >== maxRows || 1/this.cols() - this.colSize(i) < client.minSize) continue;
      this.addRow(client, i);
      return 0;
    };
    
    // if both fail then return 
    return -1;
  }
  
  this.removeClient = function (windowId)
  {
    for (var i = 0; i < this.cols(); i++)
    {
      for (var j = 0; j < this.rows(i); j++)
      {
        if (this.clients[i][j].windowId === windowId)
        {
          // if it's the only client in that column then remove the column
          if (this.rows(i) === 1)
          {
            this.removeCol(i);
            return 0;
          }
          // else only remove that single client from the column
          else
          {
            this.removeRow(i, j);
            return 0;
          };
        };
      };  
    };
    return -1;
  };
  
  this.getClient = function (windowId)
  {
    for (var i = 0; i < this.cols(); i++)
    {
      for (var j = 0; j < this.rows(i); j++)
      {
        if (this.clients[i][j].windowId === windowId)
        {
          return this.clients[i][j];
        };
      };  
    };
    return -1;
  };
  
  // dividers, all column have a divider attached to them, which are to the right of the column (or bottom of the row), this means that there is always an extra divider that is to the right (or bottom) of the last client (either row or column), these dividers should be ignored during the rendering.
  this.dividers = 
  [{
    col: 0,
    row: [0],
  }];
  
  this.addColDivider = function ()
  {
    this.dividers.push
    ({
      col: 0,
      row: [0],
    });
  };
  
  this.removeColDivider = function (colIndex)
  {
    this.dividers.splice(colIndex, 1);
  };
  
  this.addRowDivider = function (colIndex)
  {
    this.dividers[colIndex].row.push(0);
  };
  
  this.removeRowDivider = function (rowIndex, colIndex)
  {
    this.dividers[colIndex].row.splice(rowIndex, 1);
  };
  
  // rendering
  this.renderDesktop = function (desktopIndex, layerIndex)
  {
    return RenderClients(this.divider, this.clients, this.nclients(), desktopIndex, layerIndex);
  };
};

function Layer ()
{
  this.desktops = [];
  this.ndesktops =  function () {return this.desktops.length;};
  
  this.addDesktop = function (desktop)
  {
    if (GetDesktopTotal()-this.ndesktops() < 1) {return -1;};
    this.desktops.push(desktop);
    return 0;
  };
  
  this.removeDesktop = function (desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    this.desktops.splice(desktopIndex, 1);
    return 0;
  };
  
  this.addClient = function (client)
  {
    var added = -1;
    // try to add to current desktop
    var index = GetDesktopIndex();
    while (index >= this.ndesktops())
    {
      var desktop = new Desktop();
      this.addDesktop(desktop);
    };
    added = this.desktops[index].addClient(client);
    if (added === 0) {return added;};
    // try to add to any of the current desktops
    for (var i = 0; i < this.ndesktops(); i++)
    {
      added = this.desktops[i].addClient(client);
      if (added === 0) {return added;};
    };
    // make a new desktop (if possible) and add to that
    var desktop = new Desktop();
    if (this.addDesktop(desktop) === -1) {return -1;};
    return this.desktops[this.ndesktops()-1].addClient(client);
  };
  
  this.removeClient = function (windowId)
  {
    var removed = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      removed = this.desktops[i].removeClient(windowId);
      if (removed === 0)
      {
        if (this.desktops[i].size() === 0) {removed = this.removeDesktop(i);};
        break;
      };
    };
    return removed;
  };
  
  this.getClient = function (windowId)
  {
    var client = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      client = this.desktops[i].getClient(windowId);
      if (client !== -1) {break;};
    };
    return client;
  };
  
  this.switchClientLeft = function (clientIndex, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].switchClientLeft(clientIndex);
  };
  
  this.switchClientRight = function (clientIndex, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].switchClientRight(clientIndex);
  };
  
  this.switchClientUp = function (clientIndex, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].switchClientUp(clientIndex);
  };
  
  this.switchClientDown = function (clientIndex, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].switchClientDown(clientIndex);
  };
  
  this.increaseSize = function (clientIndex, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].increaseSize(clientIndex);
  };
  
  this.decreaseSize = function (clientIndex, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].decreaseSize(clientIndex);
  };
  
  this.movePreviousDesktop = function (clientIndex, desktopIndex)
  {
    var client = this.desktops[desktopIndex].clients[clientIndex];
    for (var i = desktopIndex-1; i >= 0; i--)
    {
      if (this.desktops[i].size()+client.minSize > 1) {continue;};
      this.desktops[desktopIndex].removeClient(client.windowId);
      this.desktops[i].addClient(client);
      return 0;
    };
    return -1;
  };
  
  this.moveNextDesktop = function (clientIndex, desktopIndex)
  {
    // client needs to be a copy, not a reference to the same
    var client = this.desktops[desktopIndex].clients[clientIndex];
    for (var i = desktopIndex+1; i < this.ndesktops(); i++)
    {
      if (this.desktops[i].size()+client.minSize > 1) {continue;};
      this.desktops[desktopIndex].removeClient(client.windowId);
      this.desktops[i].addClient(client);
      return 0;
    };
    var desktop = new Desktop();
    if (this.addDesktop(desktop) !== -1)
    {
      this.desktops[desktopIndex].removeClient(client.windowId);
      this.desktops[this.ndesktops()-1].addClient(client);
      return 0;
    };
    return -1;
  };
  
  // divider
  this.setDivider = function (horizontal, vertical, desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].setDivider(horizontal, vertical);
  };
  
  this.getDivider = function (desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].getDivider();
  };
  
  // rendering
  this.renderLayer = function (layerIndex)
  {
    var render = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      render = this.desktops[i].renderDesktop(i, layerIndex);
    };
    return render;
  };
  
  this.renderDesktop = function (desktopIndex, layerIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    return this.desktops[desktopIndex].renderDesktop(desktopIndex, layerIndex);
  };
};

function Layout ()
{
  this.layers = [];
  this.nlayers = function () {return this.layers.length;};
  
  this.addLayer = function (layer) 
  {
    this.layers.push(layer);
    return 0;
  };
  
  this.removeLayer = function (layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    this.layers.splice(layerIndex, 1);
    return 0;
  };
  
  this.addDesktop = function (desktop)
  {
    var added = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      added = this.layers[i].addDesktop(desktop);
      if (added === 0) {return added};
    };
    var layer = new Layer();
    this.addLayer(layer);
    return this.layers[this.nlayers() - 1].addDesktop(desktop);
  };
  
  this.removeDesktop = function (desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].removeDesktop(desktopIndex);
  };
  
  this.addClient = function (client)
  {
    var added = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      added = this.layers[i].addClient(client);
      if (added === 0) {return added};
    };
    var layer = new Layer();
    this.addLayer(layer);
    return this.layers[this.nlayers()-1].addClient(client);
  };
  
  this.removeClient = function (windowId)
  {
    removed = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      removed = this.layers[i].removeClient(windowId);
      if (removed === 0)
      {
        if (this.layers[i].ndesktops() === 0) {removed = this.removeLayer(i);};
        break;
      };
    };
    return removed;
  };
  
  this.getClient = function (windowId)
  {
    client = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      client = this.layers[i].getClient(windowId);
      if (client !== -1) {break;};
    };
    return client;
  };
  
  this.switchClientLeft = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].switchClientLeft(clientIndex, desktopIndex);
  };
  
  this.switchClientRight = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].switchClientRight(clientIndex, desktopIndex);
  };
  
  this.switchClientUp = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].switchClientUp(clientIndex, desktopIndex);
  };
  
  this.switchClientDown = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].switchClientDown(clientIndex, desktopIndex);
  };
  
  this.increaseSize = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].increaseSize(clientIndex, desktopIndex);
  };
  
  this.decreaseSize = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].decreaseSize(clientIndex, desktopIndex);
  };
  
  this.movePreviousDesktop = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].movePreviousDesktop(clientIndex, desktopIndex);
  };
  
  this.moveNextDesktop = function (clientIndex, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].moveNextDesktop(clientIndex, desktopIndex);
  };
  
  // divider
  this.setDivider = function (horizontal, vertical, desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].setDivider(horizontal, vertical, desktopIndex);
  };
  
  this.getDivider = function (desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].getDivider(desktopIndex);
  };
  
  // rendering
  this.renderLayout = function ()
  {
    var render = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      render = this.layers[i].renderLayer(i);
    };
    return render;
  };
  
  this.renderLayer = function (layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].renderLayer(layerIndex);
  };
  
  this.renderDesktop = function (desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].renderDesktop(desktopIndex, layerIndex);
  };
};

// --------------
// Type Functions
// --------------

var typeF = {left: true, right: true, top: true, bottom: true, size: 1}; // full
var typeLH = {left: true, right: false, top: true, bottom: true, size: 0.5}; // left half
var typeRH = {left: false, right: true, top: true, bottom: true, size: 0.5}; // right half
var typeTLQ = {left: true, right: false, top: true, bottom: false, size: 0.25}; // top left quarter
var typeTRQ = {left: false, right: true, top: true, bottom: false, size: 0.25}; // top right quarter
var typeBRQ = {left: false, right: true, top: false, bottom: true, size: 0.25}; // bottom right quarter
var typeBLQ = {left: true, right: false, top: false, bottom: true, size: 0.25}; // bottom left quarter

function FindType (type, clients, nclients)
{
  var found = -1;
  for (var i = 0; i < nclients; i++)
  {
    if (clients[i].type === type)
    {
      found = i;
      break;
    };
  };
  return found;
};

function FindLargestType (clients, nclients)
{
  var index = -1;
  var largest = 0;
  for (var i = 0; i < nclients; i++)
  {
    var size = clients[i].type.size;
    if (size >= largest)
    {
      index = i;
      largest = size;
    };
  };
  return index;
};

function SplitType (client, clients, nclients)
{
  if (nclients === 0)
  {
    client.type = typeF;
    return 0;
  };
  
  var index = FindLargestType(clients, nclients);
  
  if (clients[index].type === typeF)
  {
    clients[index].type = typeLH;
    client.type = typeRH;
    return 0;
  };
  
  if (clients[index].type === typeLH)
  {
    if (clients[index].minSize === 0.5)
    {
      clients[1-index].type = typeTRQ;
      client.type = typeBRQ;
      return 0;
    }
    else if (client.minSize === 0.5)
    {
      clients[index].type = typeTLQ;
      clients[1-index].type = typeBLQ;
      client.type = typeRH;
      return 0;
    }
    else
    {
      clients[index].type = typeTLQ;
      client.type = typeBLQ;
      return 0;
    };
  };
  
  if (clients[index].type === typeRH)
  {
    if (clients[index].minSize === 0.5)
    {
      clients[1-index].type = typeTLQ;
      client.type = typeBLQ;
      return 0;
    }
    else if (client.minSize === 0.5)
    {
      clients[index].type = typeBLQ;
      clients[1-index].type = typeTLQ;
      client.type = typeRH;
      return 0;
    }
    else
    {
      clients[index].type = typeTRQ;
      client.type = typeBRQ;
      return 0;
    };
  };
  return -1;
};

function CombineType (clientIndex, clients, nclients)
{
  var type = clients[clientIndex].type;
  if (type === typeLH)
  {
    if (nclients === 2)
    {
      clients[FindType(typeRH, clients, nclients)].type = typeF;
    }
    else if (nclients === 3)
    {
      clients[FindType(typeTRQ, clients, nclients)].type = typeLH;
      clients[FindType(typeBRQ, clients, nclients)].type = typeRH;
    };
  }
  else if (type === typeRH)
  {
    if (nclients === 2)
    {
      clients[FindType(typeLH, clients, nclients)].type = typeF;
    }
    else if (nclients === 3)
    {
      clients[FindType(typeTLQ, clients, nclients)].type = typeLH;
      clients[FindType(typeBLQ, clients, nclients)].type = typeRH;
    };
  }
  else if (type === typeTLQ)
  {
    clients[FindType(typeBLQ, clients, nclients)].type = typeLH;
  }
  else if (type === typeTRQ)
  {
    clients[FindType(typeBRQ, clients, nclients)].type = typeRH;
  }
  else if (type === typeBRQ)
  {
    clients[FindType(typeTRQ, clients, nclients)].type = typeRH;
  }
  else if (type === typeBLQ)
  {
    clients[FindType(typeTLQ, clients, nclients)].type = typeLH;
  }
  else
  {
    return -1;
  };
};

// -------------
// Client Moving
// -------------

function MoveClientLeft (clientIndex, clients, nclients)
{
  if (clients[clientIndex].type === typeRH) {clients[clientIndex].type = typeLH; return 0;};
  if (clients[clientIndex].type === typeTRQ) {clients[clientIndex].type = typeTLQ; return 0;};
  if (clients[clientIndex].type === typeBRQ) {clients[clientIndex].type = typeBLQ; return 0;};
  return -1;
};

function MoveClientRight (clientIndex, clients, nclients)
{
  if (clients[clientIndex].type === typeLH) {clients[clientIndex].type = typeRH; return 0;};
  if (clients[clientIndex].type === typeTLQ) {clients[clientIndex].type = typeTRQ; return 0;};
  if (clients[clientIndex].type === typeBLQ) {clients[clientIndex].type = typeBRQ; return 0;};
  return -1;
};

function MoveClientUp (clientIndex, clients, nclients)
{
  if (clients[clientIndex].type === typeBLQ) {clients[clientIndex].type = typeTLQ; return 0;};
  if (clients[clientIndex].type === typeBRQ) {clients[clientIndex].type = typeTRQ; return 0;};
  return -1;
};

function MoveClientDown (clientIndex, clients, nclients)
{
  if (clients[clientIndex].type === typeTLQ) {clients[clientIndex].type = typeBLQ; return 0;};
  if (clients[clientIndex].type === typeTRQ) {clients[clientIndex].type = typeBRQ; return 0;};
  return -1;
};

function MoveAllClientsLeft (clients, nclients)
{
  for (var i = 0; i < nclients; i++)
  {
    MoveClientLeft(i, clients, nclients);
  };
  return 0;
};

function MoveAllClientsRight (clients, nclients)
{
  for (var i = 0; i < nclients; i++)
  {
    MoveClientRight(i, clients, nclients);
  };
  return 0;
};

function MoveAllClientsUp (clients, nclients)
{
  for (var i = 0; i < nclients; i++)
  {
    MoveClientUp(i, clients, nclients);
  };
  return 0;
};

function MoveAllClientsDown (clients, nclients)
{
  for (var i = 0; i < nclients; i++)
  {
    MoveClientDown(i, clients, nclients);
  };
  return 0;
};

function SwitchClientLeft (clientIndex, clients, nclients)
{
  if (clientIndex >= nclients || clients[clientIndex].type.left) {return -1;};
  
  var type = clients[clientIndex].type;
  if (type.size === 0.5)
  {
    MoveAllClientsRight(clients, nclients);
    MoveClientLeft(clientIndex, clients, nclients);
  }
  else if (type.size === 0.25)
  {
    var index = FindType(typeLH, clients, nclients);
    if (index !== -1)
    {
      MoveAllClientsLeft(clients, nclients);
      MoveClientRight(index, clients, nclients);
    }
    else if (type === typeTRQ)
    {
      MoveClientRight(FindType(typeTLQ, clients, nclients), clients, nclients);
      MoveClientLeft(clientIndex, clients, nclients);
    }
    else if (type === typeBRQ)
    {
      MoveClientRight(FindType(typeBLQ, clients, nclients), clients, nclients);
      MoveClientLeft(clientIndex, clients, nclients);
    };
  }
  else
  {
    return -1;
  };
  return 0;
};

function SwitchClientRight (clientIndex, clients, nclients)
{
  if (clientIndex >= nclients || clients[clientIndex].type.right) {return -1;};
  
  var type = clients[clientIndex].type;
  if (type.size === 0.5)
  {
    MoveAllClientsLeft(clients, nclients);
    MoveClientRight(clientIndex, clients, nclients);
  }
  else if (type.size === 0.25)
  {
    var index = FindType(typeRH, clients, nclients);
    if (index !== -1)
    {
      MoveAllClientsRight(clients, nclients);
      MoveClientLeft(index, clients, nclients);
    }
    else if (type === typeTLQ)
    {
      MoveClientLeft(FindType(typeTRQ, clients, nclients), clients, nclients);
      MoveClientRight(clientIndex, clients, nclients);
    }
    else if (type === typeBLQ)
    {
      MoveClientLeft(FindType(typeBRQ, clients, nclients), clients, nclients);
      MoveClientRight(clientIndex, clients, nclients);
    };
  }
  else
  {
    return -1;
  };
  return 0;
};

function SwitchClientUp (clientIndex, clients, nclients)
{
  if (clientIndex >= nclients || clients[clientIndex].type.top) {return -1;};
  
  var type = clients[clientIndex].type;
  if (type === typeBLQ)
  {
    MoveClientDown(FindType(typeTLQ, clients, nclients), clients, nclients);
    MoveClientUp(clientIndex, clients, nclients);
  }
  else if (type === typeBRQ)
  {
    MoveClientDown(FindType(typeTRQ, clients, nclients), clients, nclients);
    MoveClientUp(clientIndex, clients, nclients);
  }
  else
  {
    return -1;
  };
  return 0;
};

function SwitchClientDown (clientIndex, clients, nclients)
{
  if (clientIndex >= nclients || clients[clientIndex].type.bottom) {return -1;};
  
  var type = clients[clientIndex].type;
  if (type === typeTLQ)
  {
    MoveClientUp(FindType(typeBLQ, clients, nclients), clients, nclients);
    MoveClientDown(clientIndex, clients, nclients);
  }
  else if (type === typeTRQ)
  {
    MoveClientUp(FindType(typeBRQ, clients, nclients), clients, nclients);
    MoveClientDown(clientIndex, clients, nclients);
  }
  else
  {
    return -1;
  };
  return 0;
};

function CheckDivider (divider)
{
  if (divider.horizontal < dividerBounds) {divider.horizontal = dividerBounds;};
  if (divider.horizontal > 1-dividerBounds) {divider.horizontal = 1-dividerBounds;};
  if (divider.vertical < dividerBounds) {divider.vertical = dividerBounds;};
  if (divider.vertical > 1-dividerBounds) {divider.vertical = 1-dividerBounds;};
  return 0;
};

function IncreaseSize (client, divider)
{
  var type = client.type;
  if (type.left && !type.right)
  {
    divider.vertical += dividerStepSize;
  }
  else if (!type.left && type.right)
  {
    divider.vertical -= dividerStepSize;
  };
  
  if (type.top && !type.bottom)
  {
    divider.horizontal += dividerStepSize;
  }
  else if (!type.top && type.bottom)
  {
    divider.horizontal -= dividerStepSize;
  };
  CheckDivider(divider);
  return 0;
};

function DecreaseSize (client, divider)
{
  var type = client.type;
  if (type.left && !type.right)
  {
    divider.vertical -= dividerStepSize;
  }
  else if (!type.left && type.right)
  {
    divider.vertical += dividerStepSize;
  };
  
  if (type.top && !type.bottom)
  {
    divider.horizontal -= dividerStepSize;
  }
  else if (!type.top && type.bottom)
  {
    divider.horizontal += dividerStepSize;
  };
  CheckDivider(divider);
  return 0;
};

function GeometryResized (client)
{
//   var client = layout.getClient(windowId);
  var resizedWidth = (client.geometryRender.width !== client.geometry.width);
  var resizedHeight = (client.geometryRender.height !== client.geometry.height);
  if (!resizedWidth && !resizedHeight) {return -1;};
  var diffWidth = client.geometry.width-client.geometryRender.width;
  var diffHeight = client.geometry.height-client.geometryRender.height;
  var divider = layout.getDivider(client.desktopIndex, client.layerIndex);
  
  if (resizedWidth)
  {
    if (client.type.left && !client.type.right)
    {
      divider.vertical += diffWidth/(workspace.displayWidth);
    };
    if (!client.type.left && client.type.right)
    {
      divider.vertical -= diffWidth/(workspace.displayWidth);
    };
  };
  if (resizedHeight)
  {
    if (client.type.top && !client.type.bottom)
    {
      divider.horizontal += diffHeight/(workspace.displayHeight);
    };
    if (!client.type.top && client.type.bottom)
    {
      divider.horizontal -= diffHeight/(workspace.displayHeight);
    };
  };
  CheckDivider(divider);
  return 0;
};

function GeometryMoved (client)
{
//   var client = layout.getClient(windowId);
  var movedX = (client.geometryRender.x !== client.geometry.x && !(client.geometryRender.width !== client.geometry.width));
  var movedY = (client.geometryRender.y !== client.geometry.y && !(client.geometryRender.height !== client.geometry.height));
  if (!movedX && !movedY) {return -1;};
  var diffX = client.geometry.x-client.geometryRender.x;
  var diffY = client.geometry.y-client.geometryRender.y;
  
  if (movedX)
  {
    if (diffX > moveThreshold*client.width)
    {
      layout.switchClientRight(client.clientIndex, client.desktopIndex, client.layerIndex);
    }
    else if (diffX < -moveThreshold*client.width)
    {
      layout.switchClientLeft(client.clientIndex, client.desktopIndex, client.layerIndex);
    };
  };
  if (movedY)
  {
    if (diffY > moveThreshold*client.height)
    {
      layout.switchClientDown(client.clientIndex, client.desktopIndex, client.layerIndex);
    }
    else if (diffY < -moveThreshold*client.height)
    {
      layout.switchClientUp(client.clientIndex, client.desktopIndex, client.layerIndex);
    };
  };
  return 0;
};

// ----------------
// Client Rendering
// ----------------

function SetClient (client, x, y, width, height, desktop, screen, clientIndex, desktopIndex, layerIndex)
{
  var geometry = 
  {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.floor(width),
    height: Math.floor(height),
  };
  
  client.noBorder = noBorder;
  if (noOpacity) {client.opacity = 1;}
  else {client.opacity = opacity;};
  
  client.desktop = desktop;
  client.screen = screen;
  client.geometry = geometry;
  client.geometryRender = geometry;
  client.clientIndex = clientIndex;
  client.desktopIndex = desktopIndex;
  client.layerIndex = layerIndex;
  
  return 0;
};

function SetClientFull (client)
{
  var area = workspace.clientArea(0, client.screen, client.desktop);
  client.geometry = 
  {
    x: Math.floor(gap+area.x+margin.left),
    y: Math.floor(gap+area.y+margin.top),
    width: Math.floor(area.width-margin.left-margin.right-2*gap),
    height: Math.floor(area.height-margin.top-margin.bottom-2*gap),
  };
  return 0;
};

function RenderClients (divider, clients, nclients, desktopIndex, layerIndex)
{
  var s = GetScreenNumber(desktopIndex);
  var d = GetDesktopNumber(desktopIndex);
  var area = workspace.clientArea(0, s, d);
  
  var w = area.width-margin.left-margin.right-3*gap; // width
  var h = area.height-margin.top-margin.bottom-3*gap; // height
  
  var lw = divider.vertical*w; // left width
  var rw = (1-divider.vertical)*w; // right width
  var th = divider.horizontal*h; // top height
  var bh = (1-divider.horizontal)*h; // bottom height
  
  var sx = gap+area.x+margin.left; // start x
  var hx = sx+lw+gap; // half x
  
  var sy = gap+area.y+margin.top; // start y
  var hy = sy+th+gap; // half left y
  
  for (var i = 0; i < nclients; i++)
  {
    var client = clients[i];
    if (client.type === typeF)
    {
      SetClient(client, sx, sy, w+gap, h+gap, d, s, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeLH)
    {
      SetClient(client, sx, sy, lw, h+gap, d, s, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeRH)
    {
      SetClient(client, hx, sy, rw, h+gap, d, s, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeTLQ)
    {
      SetClient(client, sx, sy, lw, th, d, s, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeTRQ)
    {
      SetClient(client, hx, sy, rw, th, d, s, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeBRQ)
    {
      SetClient(client, hx, hy, rw, bh, d, s, i, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === typeBLQ)
    {
      SetClient(client, sx, hy, lw, bh, d, s, i, desktopIndex, layerIndex);
      continue;
    };
  };
  return 0;
};

// ---------------
// Client Validity
// ---------------

function CheckClient (client)
{  
  if (client.specialWindow || client.dialog) {return -1;};
  
  var clientClass = client.resourceClass.toString();
  var clientName = client.resourceName.toString();
  var clientCaption = client.caption.toString();
  
  for (var i = 0; i < ignoredCaptions.length; i++)
  {
    if (ignoredCaptions[i] === clientCaption) {return -1;};
  };
  
  for (var i = 0; i < ignoredClients.length; i++)
  {
    if (clientClass.indexOf(ignoredClients[i]) !== -1) {return -1;};
    if (clientName.indexOf(ignoredClients[i]) !== -1) {return -1;};
  };
  
  var minSize = 0.25;
  for (var i = 0; i < halfClients.length; i++)
  {
    if (clientClass.indexOf(halfClients[i]) !== -1 || clientClass.indexOf(halfClients[i]) !== -1)
    {
      minSize = 0.5;
      break;
    };
  };
  for (var i = 0; i < fullClients.length; i++)
  {
    if (clientClass.indexOf(fullClients[i]) !== -1 || clientName.indexOf(fullClients[i]) !== -1)
    {
      minSize = 1;
      break;
    };
  };
  
  client.minSize = minSize;
  return client;
};

// ---------------------------
// Connecting The KWin Signals
// ---------------------------

var addedClients = {}; // windowId of added clients
var layout = new Layout(); // main class, contains all methods

workspace.clientActivated.connect // clientAdded does not work for a lot of clients
(
  function (client)
  {
    if (client === null || client.windowId in addedClients) {return -1;};
    if (CheckClient(client) === -1) {return -1;}; // on succes adds minSize to client
    if (layout.addClient(client) === -1) {return -1;};
    addedClients[client.windowId] = true;
    layout.renderLayout();
    workspace.currentDesktop = client.desktop;
    ConnectClient(client); // connect client signals
    return 0;
  }
);

workspace.clientRemoved.connect
(
  function (client)
  {
    if (!(client.windowId in addedClients)) {return -1;};
    delete addedClients[client.windowId];
    var removed = layout.removeClient(client.windowId);
    if (removed === 0)
    {
      layout.renderLayout();
    };
    return removed;
  }
);

function ConnectClient (client)
{
  client.clientFinishUserMovedResized.connect
  (
    function (client)
    {
      var client = layout.getClient(client.windowId);
      if (client === -1) {return -1;};
      if (GeometryResized(client) === -1 && GeometryMoved(client) === -1) {return -1;};
      return layout.renderDesktop(client.desktopIndex, client.layerIndex);
    }
  );
  client.clientStepUserMovedResized.connect
  (
    function (client)
    {
      var client = layout.getClient(client.windowId);
      if (client === -1) {return -1;};
      if (GeometryResized(client) === -1) {return -1;};
      return layout.renderDesktop(client.desktopIndex, client.layerIndex);
    }
  );
  return 0;
};

// ------------------
// Creating Shortcuts
// ------------------

registerShortcut
(
  "Tiling-Gaps: Move Next Desktop",
  "Tiling-Gaps: Move Next Desktop",
  "Meta+End",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    if (layout.moveNextDesktop(client.clientIndex, client.desktopIndex, client.layerIndex) === -1) {return -1;};
    layout.renderLayer(client.layerIndex);
    workspace.currentDesktop = client.desktop;
    return 0;
  }
);

registerShortcut
(
  "Tiling-Gaps: Move Previous Desktop",
  "Tiling-Gaps: Move Previous Desktop",
  "Meta+Home",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    if (layout.movePreviousDesktop(client.clientIndex, client.desktopIndex, client.layerIndex) === -1) {return -1;};
    layout.renderLayer(client.layerIndex);
    workspace.currentDesktop = client.desktop;
    return 0;
  }
);

registerShortcut
(
  "Tiling-Gaps: Switch Up",
  "Tiling-Gaps: Switch Up",
  "Meta+Alt+Up",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    if (layout.switchClientUp(client.clientIndex, client.desktopIndex, client.layerIndex) === -1) {return -1;};
    return layout.renderDesktop(client.desktopIndex, client.layerIndex);
  }
);

registerShortcut
(
  "Tiling-Gaps: Switch Down",
  "Tiling-Gaps: Switch Down",
  "Meta+Alt+Down",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    if (layout.switchClientDown(client.clientIndex, client.desktopIndex, client.layerIndex) === -1) {return -1;};
    return layout.renderDesktop(client.desktopIndex, client.layerIndex);
  }
);

registerShortcut
(
  "Tiling-Gaps: Switch Left",
  "Tiling-Gaps: Switch Left",
  "Meta+Alt+Left",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    if (layout.switchClientLeft(client.clientIndex, client.desktopIndex, client.layerIndex) === -1) {return -1;};
    return layout.renderDesktop(client.desktopIndex, client.layerIndex);
  }
);

registerShortcut
(
  "Tiling-Gaps: Switch Right",
  "Tiling-Gaps: Switch Right",
  "Meta+Alt+Right",
  function ()
  {
    client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    if (layout.switchClientRight(client.clientIndex, client.desktopIndex, client.layerIndex) === -1) {return -1;};
    return layout.renderDesktop(client.desktopIndex, client.layerIndex);
  }
);

registerShortcut
(
  "Tiling-Gaps: Toggle Border",
  "Tiling-Gaps: Toggle Border",
  "Meta+P",
  function ()
  {
    noBorder = !noBorder;
    return layout.renderLayout();
  }
);

registerShortcut
(
  "Tiling-Gaps: Toggle Opacity",
  "Tiling-Gaps: Toggle Opacity",
  "Meta+O",
  function ()
  {
    noOpacity = !noOpacity;
    return layout.renderLayout();
  }
);

// registerShortcut
// (
//   "Tiling-Gaps: Close Client",
//   "Tiling-Gaps: Close Client",
//   "Meta+W",
//   function ()
//   {
//     var client = layout.getClient(workspace.activeClient.windowId);
//     if (client === -1) {return -1;};
//     client.closeWindow();
//     return layout.renderLayout();
//   }
// );

registerShortcut
(
  "Tiling-Gaps: Close Desktop",
  "Tiling-Gaps: Close Desktop",
  "Meta+Q",
  function ()
  {
    var index = GetDesktopIndex();
    for (var i = 0; i < layout.nlayers(); i++)
    {
      var layer = layout.layers[i];
      if (index >= layer.ndesktops()) {return -1;};
      var desktop = layer.desktops[index];
      for (var j = 0; j < desktop.nclients(); j++)
      {
        desktop.clients[j].closeWindow();
      };
      layout.removeDesktop(index, i);
    };
    return layout.renderLayout();
  }
);

registerShortcut
(
  "Tiling-Gaps: Maximize",
  "Tiling-Gaps: Maximize",
  "Meta+M",
  function ()
  {
    var client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    return SetClientFull(client);
  }
);

registerShortcut
(
  "Tiling-Gaps: Refresh (Minimize)",
  "Tiling-Gaps: Refresh (Minimize)",
  "Meta+N",
  function ()
  {
    return layout.renderLayout();
  }
);

registerShortcut
(
  "Tiling-Gaps: Increase Size",
  "Tiling-Gaps: Increase Size",
  "Meta+=",
  function ()
  {
    var client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    layout.increaseSize(client.clientIndex, client.desktopIndex, client.layerIndex);
    return layout.renderDesktop(client.desktopIndex, client.layerIndex);
  }
);

registerShortcut
(
  "Tiling-Gaps: Decrease Size",
  "Tiling-Gaps: Decrease Size",
  "Meta+-",
  function ()
  {
    var client = layout.getClient(workspace.activeClient.windowId);
    if (client === -1) {return -1;};
    layout.decreaseSize(client.clientIndex, client.desktopIndex, client.layerIndex);
    return layout.renderDesktop(client.desktopIndex, client.layerIndex);
  }
);
