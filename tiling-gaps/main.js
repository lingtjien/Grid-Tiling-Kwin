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
var tile_types =
{
  texstudio: 1,
  inkscape: 1,
  gimp: 1,
  spotify: 0.5,
  kate: 0.5,
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
  "Preferences",
  "Create a New Image",
  "QEMU",
];

// -----------------
// Class Definitions
// -----------------

var managed_window_id = {};

function Tile (window_id, type)
{
  this.window_id = window_id; // must be unique for every window
  this.type = type; // either 1/0.5/0.25 = fill/half/quarter, the minimum tile type
};

function Desktop ()
{
  this.divider = 
  {
    horizontal: 0.5,
    vertical: 0.5,
  };
  
  this.tiles = [];
  this.ntiles = function () {return this.tiles.length;};
  
  this.size = function ()
  {
    var sum = 0;
    for (var i = 0; i < this.ntiles(); i++) {sum += this.tiles[i].type;};
    return sum;
  };
  
  this.renderDesktop = function (desktop_index)
  {
    return RenderTiles(this.tiles, this.ntiles(), this.divider, desktop_index);
  };
  
  this.addTile = function (tile)
  {
    if (this.size()+tile.type > 1) {return -1;};
    this.tiles.push(tile);
    return 0;
  };
  
  this.removeTile = function (window_id)
  {
    if (this.ntiles() === 0) {return -1;};
    for (var i = 0; i < this.ntiles(); i++)
    {
      if (this.tiles[i].window_id === window_id)
      {
        this.tiles.splice(i, 1);
        return 0;
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
    var render = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      render = this.desktops[i].renderDesktop(i);
    };
    return render;
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
    return this.desktops[desktop_index].renderDesktop(desktop_index);
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
  
  this.removeTile = function (window_id)
  {
    var removed = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      removed = this.desktops[i].removeTile(window_id);
      if (removed === 0) {return removed;};
    };
    return removed;
  };
};

function Layout ()
{
  this.layers = [];
  this.nlayers = function () {return this.layers.length;};
  
  this.renderLayout = function ()
  {
    var render = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      render = this.layers[i].renderLayer();
    };
    return render;
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
    return this.layers[this.nlayers()-1].addTile(tile);
  };
  
  this.removeTile = function (window_id)
  {
    removed = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      removed = this.layers[i].removeTile(window_id);
      if (removed === 0) {return removed;};
    };
    return removed;
  };
};

// ---------
// Functions
// ---------

function RenderClient (client, d, x, y, width, height)
{
  client.desktop = d;
  client.fullScreen = false;
  client.geometry = 
  {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.floor(width),
    height: Math.floor(height),
  };
  
  return 0;
};

function RenderTiles (tiles, ntiles, divider, desktop_index)
{
  if (ntiles === 0) {return -1;};
  
  var d = desktop_index+1;
  
  var w = desk_area.width-3*gap; // width
  var h = desk_area.height-3*gap; // height
  
  var lw = divider.vertical*w; // left width
  var rw = (1-divider.vertical)*w; // right width
  var th = divider.horizontal*h; // top height
  var bh = (1-divider.horizontal)*h; // bottom height
  
  var sx = gap+desk_area.x_min; // start x
  var hx = sx+lw+gap; // half x
  
  var sy = gap+desk_area.y_min; // start y
  var hy = sy+th+gap; // half left y
  
  if (ntiles === 1)
  {
    RenderClient(workspace.getClient(tiles[0].window_id), d, sx, sy, w+gap, h+gap);
  }
  if (ntiles === 2)
  {
    RenderClient(workspace.getClient(tiles[0].window_id), d, sx, sy, lw, h+gap);
    RenderClient(workspace.getClient(tiles[1].window_id), d, hx, sy, rw, h+gap);
  };
  if (ntiles === 3)
  {
    if (tiles[0].type === 0.25 && tiles[1].type === 0.5 && tiles[2].type === 0.25)
    {
      RenderClient(workspace.getClient(tiles[0].window_id), d, sx, sy, lw, th);
      RenderClient(workspace.getClient(tiles[1].window_id), d, hx, sy, rw, h+gap);
      RenderClient(workspace.getClient(tiles[2].window_id), d, sx, hy, lw, bh);
    }
    else if (tiles[0].type === 0.25 && tiles[1].type === 0.25 && tiles[2].type === 0.5)
    {
      RenderClient(workspace.getClient(tiles[0].window_id), d, sx, sy, lw, th);
      RenderClient(workspace.getClient(tiles[1].window_id), d, sx, hy, lw, bh);
      RenderClient(workspace.getClient(tiles[2].window_id), d, hx, sy, rw, h+gap);
    }
    else
    {
      RenderClient(workspace.getClient(tiles[0].window_id), d, sx, sy, lw, h+gap);
      RenderClient(workspace.getClient(tiles[1].window_id), d, hx, sy, rw, th);
      RenderClient(workspace.getClient(tiles[2].window_id), d, hx, hy, rw, bh);
    };
  };
  if (ntiles === 4)
  {
    RenderClient(workspace.getClient(tiles[0].window_id), d, sx, sy, lw, th);
    RenderClient(workspace.getClient(tiles[1].window_id), d, hx, sy, rw, th);
    RenderClient(workspace.getClient(tiles[2].window_id), d, hx, hy, rw, bh);
    RenderClient(workspace.getClient(tiles[3].window_id), d, sx, hy, lw, bh);
  };
  return -1;
};

function MakeTile (client)
{  
  if (client.specialWindow) {return -1;};
  
  var c_class = client.resourceClass.toString();
  var c_name = client.resourceName.toString();
  var c_caption = client.caption.toString();
  
  for (var i = 0; i < ignored_captions.length; i++)
  {
    if (ignored_captions[i] === c_caption) {return -1;};
  };
  
  for (var i = 0; i < ignored_clients.length; i++)
  {
    if (c_class === '' || c_name === '') {break;};
    if (ignored_clients[i].indexOf(c_class) !== -1) {return -1;};
    if (ignored_clients[i].indexOf(c_name) !== -1) {return -1;};
  };

  var type = 0.25;
  if (c_class in tile_types) {type = tile_types[c_class];};
  if (c_name in tile_types) {type = tile_types[c_name];};
  
  var tile = new Tile(client.windowId, type);
  return tile;
};

// ---------------------------
// Connecting The KWin Signals
// ---------------------------

layout = new Layout();

workspace.clientActivated.connect // clientAdded does not work for a lot of clients
(
  function (client)
  {
    if (client === null || client.windowId in managed_window_id) {return -1;};
    managed_window_id[client.windowId] = true;
    
    var tile = MakeTile(client);
    if (tile === -1) {return -1;};
    layout.addTile(tile);
    layout.renderLayout();
    return 0;
  }
);

workspace.clientRemoved.connect
(
  function (client)
  {
    if (!(client.windowId in managed_window_id)) {return -1;};
    delete managed_window_id[client.windowId];
    
    var removed = layout.removeTile(client.windowId);
    if (removed === 0) {return layout.renderLayout();};
    return -1;
  }
);

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
