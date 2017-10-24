// workspace (contains all client info)
// options (contains all options)

// ----------
// Parameters
// ----------

var gap = 16;

var margins =
{
  top: 32, // latte top dock height
  bottom: 0,
  left: 0,
  right: 0,
};

var deskArea =
{
  xMin: margins.left,
  yMin: margins.top,
  width: workspace.displayWidth-margins.right-margins.left,
  height: workspace.displayHeight-margins.bottom-margins.top,
};

// the smallest tile, must be either 1, 0.5 or 0.25, defaults to 0.25, so quarters are not needed to be specified
var tileTypes =
{
  texstudio: 1,
  inkscape: 1,
  gimp: 1,
  spotify: 0.5,
  kate: 0.5,
};

// clients that are not tiled
var ignoredClients =
[
  "albert",
  "kazam",
  "krunner",
  "ksmserver",
  "lattedock",
  "latte-dock",
  "pinentry",
  "Plasma",
  "plasma",
  "plasma-desktop",
  "plasmashell",
  "plugin-container",
  "simplescreenrecorder",
  "yakuake",
];

// client captions that are not tiled
var ignoredCaptions =
[
  "File Upload",
  "Move to Trash",
  "Quit GIMP",
  "Preferences (Shift+Ctrl+P)",
  "Create a New Image",
  "QEMU",
];

// -----------------
// Class Definitions
// -----------------

function Tile (windowId, type)
{
  this.windowId = windowId; // must be unique for every window
  this.type = type; // either 1/0.5/0.25 = fill/half/quarter, the minimum tile type
};

function Desktop ()
{
  this.tiles = [];
  this.ntiles = function () {return this.tiles.length;};
  
  this.size = function ()
  {
    var sum = 0;
    for (var i = 0; i < this.ntiles(); i++) {sum += this.tiles[i].type;};
    return sum;
  };
  
  this.addTile = function (tile)
  {
    if (this.size()+tile.type > 1) {return -1;};
    this.tiles.push(tile);
    return 0;
  };
  
  this.removeTile = function (windowId)
  {
    if (this.ntiles() === 0) {return -1;};
    for (var i = 0; i < this.ntiles(); i++)
    {
      if (this.tiles[i].windowId === windowId)
      {
        this.tiles.splice(i, 1);
        return 0;
      };
    };
    return -1;
  };
  
  // divider
  this.divider = 
  {
    horizontal: 0.5,
    vertical: 0.5,
  };
  
  this.setDivider = function (horizontal, vertical)
  {
    this.divider.horizontal = horizontal;
    this.divider.vertical = vertical;
    return 0;
  };
  
  this.getDivider = function ( )
  {
    return this.divider;
  };
  
  // rendering
  this.renderDesktop = function (desktopIndex, layerIndex)
  {
    return RenderTiles(this.divider, this.tiles, this.ntiles(), desktopIndex, layerIndex);
  };
};

function Layer ()
{
  this.desktops = [];
  this.ndesktops =  function () {return this.desktops.length;};
  
  this.addDesktop = function (desktop)
  {
    if (workspace.desktops-this.ndesktops() < 1) {return -1;};
    this.desktops.push(desktop);
    return 0;
  };
  
  this.removeDesktop = function (desktopIndex)
  {
    if (desktopIndex >= this.ndesktops()) {return -1;};
    this.desktops.splice(desktopIndex, 1);
    return 0;
  };
  
  this.addTile = function (tile)
  {
    var added = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      added = this.desktops[i].addTile(tile);
      if (added === 0) {return added;};
    };
    var desktop = new Desktop();
    if (this.addDesktop(desktop) === -1) {return -1;};
    return this.desktops[this.ndesktops()-1].addTile(tile);
  };
  
  this.removeTile = function (windowId)
  {
    var removed = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      removed = this.desktops[i].removeTile(windowId);
      if (removed === 0)
      {
        if (this.desktops[i].size() === 0) {removed = this.removeDesktop(i);};
        break;
      };
    };
    return removed;
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
  
  this.addTile = function (tile)
  {
    var added = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      added = this.layers[i].addTile(tile);
      if (added === 0) {return added};
    };
    var layer = new Layer();
    this.addLayer(layer);
    return this.layers[this.nlayers()-1].addTile(tile);
  };
  
  this.removeTile = function (windowId)
  {
    removed = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      removed = this.layers[i].removeTile(windowId);
      if (removed === 0)
      {
        if (this.layers[i].ndesktops === 0) {removed = this.removeLayer(i);};
        break;
      };
    };
    return removed;
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
    return this.layers[layerIndex].renderLayer();
  };
  
  this.renderDesktop = function (desktopIndex, layerIndex)
  {
    if (layerIndex >= this.nlayers()) {return -1;};
    return this.layers[layerIndex].renderDesktop(desktopIndex, layerIndex);
  };
};

// ---------
// Functions
// ---------

function RenderClient (x, y, width, height, tile, desktopIndex , layerIndex)
{
  var client = workspace.getClient(tile.windowId);
  var geometry = 
  {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.floor(width),
    height: Math.floor(height),
  };
  
  client.desktop = desktopIndex+1;
  client.geometry = geometry;
  
  client.tiled = 
  {
    desktopIndex: desktopIndex,
    geometry: geometry,
    layerIndex: layerIndex,
  };
  return 0;
};

function RenderTiles (divider, tiles, ntiles, desktopIndex, layerIndex)
{
  if (ntiles === 0) {return -1;};
  
  var w = deskArea.width-3*gap; // width
  var h = deskArea.height-3*gap; // height
  
  var lw = divider.vertical*w; // left width
  var rw = (1-divider.vertical)*w; // right width
  var th = divider.horizontal*h; // top height
  var bh = (1-divider.horizontal)*h; // bottom height
  
  var sx = gap+deskArea.xMin; // start x
  var hx = sx+lw+gap; // half x
  
  var sy = gap+deskArea.yMin; // start y
  var hy = sy+th+gap; // half left y
  
  if (ntiles === 1)
  {
    RenderClient(sx, sy, w+gap, h+gap, tiles[0], desktopIndex, layerIndex);
  }
  if (ntiles === 2)
  {
    RenderClient(sx, sy, lw, h+gap, tiles[0], desktopIndex, layerIndex);
    RenderClient(hx, sy, rw, h+gap, tiles[1], desktopIndex, layerIndex);
  };
  if (ntiles === 3)
  {
    if (tiles[0].type === 0.25 && tiles[1].type === 0.5 && tiles[2].type === 0.25)
    {
      RenderClient(sx, sy, lw, th, tiles[0], desktopIndex, layerIndex);
      RenderClient(hx, sy, rw, h+gap, tiles[1], desktopIndex, layerIndex);
      RenderClient(sx, hy, lw, bh, tiles[2], desktopIndex, layerIndex);
    }
    else if (tiles[0].type === 0.25 && tiles[1].type === 0.25 && tiles[2].type === 0.5)
    {
      RenderClient(sx, sy, lw, th, tiles[0], desktopIndex, layerIndex);
      RenderClient(sx, hy, lw, bh, tiles[1], desktopIndex, layerIndex);
      RenderClient(hx, sy, rw, h+gap, tiles[2], desktopIndex, layerIndex);
    }
    else
    {
      RenderClient(sx, sy, lw, h+gap, tiles[0], desktopIndex, layerIndex);
      RenderClient(hx, sy, rw, th, tiles[1], desktopIndex, layerIndex);
      RenderClient(hx, hy, rw, bh, tiles[2], desktopIndex, layerIndex);
    };
  };
  if (ntiles === 4)
  {
    RenderClient(sx, sy, lw, th, tiles[0], desktopIndex, layerIndex);
    RenderClient(hx, sy, rw, th, tiles[1], desktopIndex, layerIndex);
    RenderClient(hx, hy, rw, bh, tiles[2], desktopIndex, layerIndex);
    RenderClient(sx, hy, lw, bh, tiles[3], desktopIndex, layerIndex);
  };
  return -1;
};

function MakeTile (client)
{  
  if (client.specialWindow) {return -1;};
  
  var clientClass = client.resourceClass.toString();
  var clientName = client.resourceName.toString();
  var clientCaption = client.caption.toString();
  
  for (var i = 0; i < ignoredCaptions.length; i++)
  {
    if (ignoredCaptions[i] === clientCaption) {return -1;};
  };
  
  for (var i = 0; i < ignoredClients.length; i++)
  {
    if (clientClass === '' || clientName === '') {break;};
    if (ignoredClients[i].indexOf(clientClass) !== -1) {return -1;};
    if (ignoredClients[i].indexOf(clientName) !== -1) {return -1;};
  };

  var type = 0.25;
  if (clientClass in tileTypes) {type = tileTypes[clientClass];};
  if (clientName in tileTypes) {type = tileTypes[clientName];};
  
  var tile = new Tile(client.windowId, type);
  return tile;
};

// function GeometryChanged (client)
// {
//   var changed = -1;
//   
//   var resizedWidth = (client.tiled.geometry.width !== client.geometry.width);
//   var resizedHeight = (client.tiled.geometry.height !== client.geometry.height);
//   
//   var movedX = (client.tiled.geometry.x !== client.geometry.x && !resizedWidth);
//   var movedY = (client.tiled.geometry.y !== client.geometry.y && !resizedHeight);
//   
//   if (layout.layers[client.tiled.layerIndex].desktops[client.tiled.desktopIndex].length === 1) {return -1;};
//   
//   if (resizedWidth)
//   {
//     
//     changed = 0;
//   };
//   if (resizedHeight)
//   {
//     
//     changed = 0;
//   };
//   if (movedX)
//   {
//     
//     changed = 0;
//   };
//   if (movedY)
//   {
//     
//     changed = 0;
//   };
//   
//   return changed;
// };

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
    addedClients[client.windowId] = true;
    
    var tile = MakeTile(client);
    if (tile === -1) {return -1;};
    layout.addTile(tile);
    layout.renderLayout();
    workspace.currentDesktop = client.desktop;
//     ConnectClient(client);
    return 0;
  }
);

workspace.clientRemoved.connect
(
  function (client)
  {
    if (!(client.windowId in addedClients)) {return -1;};
    delete addedClients[client.windowId];
    
    var removed = layout.removeTile(client.windowId);
    if (removed === 0)
    {
      layout.renderLayout();
    };
    return removed;
  }
);

// function ConnectClient (client)
// {
//   client.clientFinishUserMovedResized.connect
//   (
//     function (client)
//     {
//       if (GeometryChanged(client) === -1) {return -1;};
//       return layout.renderLayout();
//     }
//   );
// //   client.clientStepUserMovedResized.connect
// //   (
// //     function (client)
// //     {
// //     }
// //   );
//   return 0;
// };
