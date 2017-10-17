// workspace (contains all client info)
// options (contains all options)

// ----------
// Parameters
// ----------

var gap = 10;

var margins =
{
  top: 32, // latte top dock height
  bottom: 0,
  left: 0,
  right: 0,
};

var desk_area =
{
  x_min: margins.left,
  y_min: margins.top,
  width: workspace.displayWidth-margins.right-margins.left,
  height: workspace.displayHeight-margins.bottom-margins.top,
};

// the smallest tile, must be either 1, 0.5 or 0.25, defaults to 0.25, so quarters are not needed to be specified
var minimum_tile_type =
{
  kate: 0.5,
  chromium: 0.5,
};

// clients that are not tiled
var ignored_clients =
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
var ignored_captions =
[
  "File Upload",
  "Move to Trash",
  "Quit GIMP",
  "Create a New Image",
  "QEMU",
];

// -----------------
// Class Definitions
// -----------------

function Tile (window_id, type)
{
  this.window_id = window_id; // must be unique for every window
  this.type = type; // either 1/0.5/0.25 = fill/half/quarter, the minimum tile type
};

function Desktop ()
{
  this.divider = 
  {
    left: 0.5, //horizontal left
    right: 0.5, //horizontal right
    top: 0.5, //vertical top
    bottom: 0.5, //vertical bottom
  };
  
  this.tiles = [];
  this.ntiles = function () {return this.tiles.length;};
  
  this.size = function ()
  {
    var sum = 0;
    for (var i = 0; i < this.ntiles(); i++) {sum += this.tiles[i].type;};
    return sum;
  };
  
  this.renderDesktop = function ()
  {
    return RenderTiles(this.tiles, this.ntiles(), this.divider);
  };
  
  this.addTile = function (tile)
  {
    if (this.size()+tile.type >= 1) {return -1;};
    this.tiles.push(tile);
    return 0;
  };
  
  this.removeTile = function (tile_index)
  {
    if (tile_index >= this.ntiles()) {return -1;};
    this.tiles.splice(tile_index, 1);
    return 0;
  };
  
  this.findTile = function (window_id)
  {
    if (this.ntiles() === 0) {return -1;};
    for (var i = 0; i < this.ntiles(); i++)
    {
      if (this.tiles[i].window_id === window_id)
      {
        return i;
      };
    };
    return -1;
  };
};

// all virtual desktops are contained in one layer
function Layer ()
{
  this.desktops = [];
  this.ndesktops =  function () {return this.desktops.length;};
  
  this.renderLayer = function ()
  {
    for (var i = 0; i < this.ndesktops(); i++)
    {
      if (this.desktops[i].renderDesktop() === -1) {return -1};
    };
    return 0;
  };
  
  this.addDesktop = function (desktop)
  {
    if (workspace.desktops-this.ndesktops() < 1) {return -1;};
    this.desktops.push(desktop);
    return 0;
  };
  
  this.removeDesktop = function (desktop_index)
  {
    if (desktop_index >= this.ndesktops()) {return -1;};
    this.desktops.splice(desktop_index, 1);
    return 0;
  };
  
  this.renderDesktop = function (desktop_index)
  {
    if (desktop_index >= this.ndesktops()) {return -1;};
    return this.desktops[desktop_index].renderDesktop();
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
  
  this.removeTile = function (tile_index, desktop_index)
  {
    if (desktop_index >= this.ndesktops()) {return -1;};
    if (this.desktops[desktop_index].removeTile(tile_index) === 0)
    {
      if (this.desktops[desktop_index].size() === 0) {this.removeDesktop(i);};
      return 0;
    };
    return -1;
  };
  
  this.findTile = function (window_id)
  {
    var found = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      found = this.desktops[i].findTile(window_id);
      if (found !== -1) {return {tile_index: found, desktop_index: i};};
    };
    return found;
  };
};

function Layout ()
{
  this.layers = [];
  this.nlayers = function () {return this.layers.length;};
  
  this.renderLayout = function ()
  {
    for (var i = 0; i < this.nlayers(); i++)
    {
      if (this.layers[i].renderLayer() === -1) {return -1;};
    };
    return 0;
  };
  
  this.addLayer = function (layer) 
  {
    this.layers.push(layer);
    return 0;
  };
  
  this.removeLayer = function (layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    this.layers.splice(layer_index, 1);
    return 0;
  };
  
  this.renderLayer = function (layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].renderLayer();
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
  
  this.removeDesktop = function (desktop_index, layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].removeDesktop(desktop_index);
  };
  
  this.renderDesktop = function (desktop_index, layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].renderDesktop(desktop_index);
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
    var desktop = new Desktop();
    this.layers[this.nlayers()-1].addDesktop(desktop);
    return this.layers[this.nlayers()-1].desktops[0].addTile(tile);
  };
  
  this.removeTile = function (tile_index, desktop_index, layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].removeTile(desktop_index, tile_index);
  };
  
  this.findTile = function (window_id)
  {
    for (var i = 0; i < this.nlayers(); i++)
    {
      var found = this.layers[i].findTile(window_id);
      if (found !== -1) {return {tile_index: found.tile_index, desktop_index: found.desktop_index, layer_index: i};};
    };
    return -1;
  };
};

// ---------
// Functions
// ---------

function Geometry (x, y, width, height)
{
  return Qt.rect
  (
    Math.floor(x),
    Math.floor(y),
    Math.floor(width),
    Math.floor(height)
  );
};

function RenderTiles (tiles, ntiles, divider)
{
  if (ntiles === 0) {return -1;};
  
  var client;
  
  var w = desk_area.width-3*gap; // width
  var h = desk_area.height-3*gap; // height
  
  var tlw = divider.top*w; // top left width
  var tlh = divider.left*h; // top left height
  var trw = (1-divider.top)*w; // top right width
  var trh = divider.right*h; // top right height
  var brw = (1-divider.bottom)*w; // bottom right width
  var brh = (1-divider.right)*h; // bottom right height
  var blw = divider.bottom*w; // bottom left width
  var blh = (1-divider.left)*h; // bottom left height
  
  var sx = gap+desk_area.x_min; // start x
  var htx = sx+tlw+gap; // half top x
  var hbx = sx+blw+gap; // half bottom x
  
  var sy = gap+desk_area.y_min; // start y
  var hly = sy+tlh+gap; // half left y
  var hry = sy+trh+gap; // half right y
  
  if (ntiles === 1)
  {
    client = FindClient(tiles[0].window_id);
    client.geometry = Geometry(sx, sy, w+gap, h+gap);
  }
  if (ntiles === 2)
  {
    client = FindClient(tiles[0].window_id);
    client.geometry = Geometry(sx, sy, (tlw+blw)/2, (tlh+blh)/2);
    client = FindClient(tiles[1].window_id);
    client.geometry = Geometry((htx+hbx)/2, sy, (trw+brw)/2, (trh+brh)/2);
  };
  if (ntiles === 3)
  {
    if (tiles[0].type === 0.25 && tiles[1].type === 0.5 && tiles[2].type === 0.25)
    {
      client = FindClient(tiles[0].window_id);
      client.geometry = Geometry(sx, sy, tlw, tlh);
      client = FindClient(tiles[1].window_id);
      client.geometry = Geometry((htx+hbx)/2, sy, (trw+brw)/2, (trh+brh)/2);
      client = FindClient(tiles[2].window_id);
      client.geometry = Geometry(sx, hly, blw, blw);
    }
    else if (tiles[0].type === 0.25 && tiles[1].type === 0.25 && tiles[2].type === 0.5)
    {
      client = FindClient(tiles[0].window_id);
      client.geometry = Geometry(sx, sy, tlw, tlh);
      client = FindClient(tiles[1].window_id);
      client.geometry = Geometry(sx, hly, blw, blw);
      client = FindClient(tiles[2].window_id);
      client.geometry = Geometry((htx+hbx)/2, sy, (trw+brw)/2, (trh+brh)/2);
    }
    else
    {
      client = FindClient(tiles[0].window_id);
      client.geometry = Geometry(sx, sy, (tlw+blw)/2, (tlh+blh)/2);
      client = FindClient(tiles[1].window_id);
      client.geometry = Geometry(htx, sy, trw, trh);
      client = FindClient(tiles[2].window_id);
      client.geometry = Geometry(hbx, hry, brw, brh);
    };
  };
  if (ntiles === 4)
  {
    client = FindClient(tiles[0].window_id);
    client.geometry = Geometry(sx, sy, tlw, tlh);
    client = FindClient(tiles[1].window_id);
    client.geometry = Geometry(htx, sy, trw, trh);
    client = FindClient(tiles[2].window_id);
    client.geometry = Geometry(hbx, hry, brw, brh);
    client = FindClient(tiles[3].window_id);
    client.geometry = Geometry(sx, hly, blw, blw);
  };
  return -1;
};

function CheckClient (client)
{  
  if (client.specialWindow) {return false;};
  
  for (var i = 0; i < ignored_captions.length; i++)
  {
    if (ignored_captions[i].indexOf(client.caption.toString()) === -1) {return false;};
  };
  
  for (var i = 0; i < ignored_clients.length; i++)
  {
    if (ignored_clients[i].indexOf(client.resourceClass.toString()) === -1) {return false;};
    if (ignored_clients[i].indexOf(client.resourceName.toString()) === -1) {return false;};
  };
  
  return true;
};

function FindClient (window_id)
{
  var clients = workspace.clientList();
  for (var i = 0; i<clients.length; i++)
  {
    if (clients[i].windowId === window_id)
    {
      return clients[i];
    };
  };
  return -1;
};

// ---------------------------
// Connecting The KWin Signals
// ---------------------------

layout = new Layout();

// workspace.clientAdded.connect
// (
//   function(client)
//   {
//     if (!CheckClient(client)) {return -1;};
//     print('Adding new tile');
//   }
// );
// workspace.clientRemoved.connect
// (
//   function(client)
//   {
//     
//   }
// );





// -------------
// Class Testing
// -------------

// var layout = new Layout();
// 
// var layer1 = new Layer();
// var layer2 = new Layer();
// 
// var desktop1 = new Desktop();
// var desktop2 = new Desktop();
// var desktop3 = new Desktop();
// var desktop4 = new Desktop();
// 
// var tile1 = new Tile(1, 0.25);
// var tile2 = new Tile(2, 0.5);
// var tile3 = new Tile(3, 0.25);
// var tile4 = new Tile(4, 0.5);
// var tile5 = new Tile(5, 0.25);
// var tile6 = new Tile(6, 0.5);
// var tile7 = new Tile(7, 0.25);
// var tile8 = new Tile(8, 0.5);
// 
// print('Adding Tiles to Desktops');
// print(desktop1.addTile(tile1));
// print(desktop1.addTile(tile2));
// print(desktop2.addTile(tile3));
// print(desktop2.addTile(tile4));
// print(desktop3.addTile(tile5));
// print(desktop3.addTile(tile6));
// print(desktop4.addTile(tile7));
// print(desktop4.addTile(tile8));
// 
// print('Adding Desktops to Layers');
// print(layer1.addDesktop(desktop1));
// print(layer1.addDesktop(desktop2));
// print(layer2.addDesktop(desktop3));
// print(layer2.addDesktop(desktop4));
// 
// print('Adding Layers to Layout');
// print(layout.addLayer(layer1));
// print(layout.addLayer(layer2));
// 
// print('Testing Methods');
// print(layout.findTile(2).desktop_index);
// print(layout.findTile(2).layer_index);
