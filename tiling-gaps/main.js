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

function RenderClient (client, number, x, y, width, height)
{
  client.desktop = number;
  client.geometry = 
  {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.floor(width),
    height: Math.floor(height),
  };
  
  print(client.caption);
  print(client.geometry.x);
  print(client.geometry.y);
  print(client.geometry.width);
  print(client.geometry.height);
  
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
    RenderClient(GetClient(tiles[0].window_id), d, sx, sy, w+gap, h+gap);
  }
  if (ntiles === 2)
  {
    RenderClient(GetClient(tiles[0].window_id), d, sx, sy, lw, h+gap);
    RenderClient(GetClient(tiles[1].window_id), d, hx, sy, rw, h+gap);
  };
  if (ntiles === 3)
  {
    if (tiles[0].type === 0.25 && tiles[1].type === 0.5 && tiles[2].type === 0.25)
    {
      RenderClient(GetClient(tiles[0].window_id), d, sx, sy, lw, th);
      RenderClient(GetClient(tiles[1].window_id), d, hx, sy, rw, h+gap);
      RenderClient(GetClient(tiles[2].window_id), d, sx, hy, lw, bh);
    }
    else if (tiles[0].type === 0.25 && tiles[1].type === 0.25 && tiles[2].type === 0.5)
    {
      RenderClient(GetClient(tiles[0].window_id), d, sx, sy, lw, th);
      RenderClient(GetClient(tiles[1].window_id), d, sx, hy, lw, bh);
      RenderClient(GetClient(tiles[2].window_id), d, hx, sy, rw, h+gap);
    }
    else
    {
      RenderClient(GetClient(tiles[0].window_id), d, sx, sy, lw, h+gap);
      RenderClient(GetClient(tiles[1].window_id), d, hx, sy, rw, th);
      RenderClient(GetClient(tiles[2].window_id), d, hx, hy, rw, bh);
    };
  };
  if (ntiles === 4)
  {
    RenderClient(GetClient(tiles[0].window_id), d, sx, sy, lw, th);
    RenderClient(GetClient(tiles[1].window_id), d, hx, sy, rw, th);
    RenderClient(GetClient(tiles[2].window_id), d, hx, hy, rw, bh);
    RenderClient(GetClient(tiles[3].window_id), d, sx, hy, lw, bh);
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
    if (ignored_captions[i].indexOf(c_caption) !== -1) {return -1;};
  };
  
  for (var i = 0; i < ignored_clients.length; i++)
  {
    if (ignored_clients[i].indexOf(c_class) !== -1) {return -1;};
    if (ignored_clients[i].indexOf(c_name) !== -1) {return -1;};
  };
  
  var type = 0.25;
  for (var i = 0; i < tile_types.length; i++)
  {
    if (c_class in tile_types)
    {
      type = tile_types[c_class];
      break;
    };
    if (c_name in tile_types)
    {
      type = tile_types[c_name];
      break;
    };
  };
  print(type);
  var tile = new Tile(client.windowId, type);
  return tile;
};

var new_client;
function GetClient (window_id)
{
  var client = workspace.getClient(window_id);
  
  if (client === undefined && new_client.windowId === window_id)
  {
    var client = new_client;
    new_client = {windowId: undefined};
  }
  
  return client;
};

// ---------------------------
// Connecting The KWin Signals
// ---------------------------

layout = new Layout();

// make this piece of code work
var type = 0.25;
for (var i = 0; i < tile_types.length; i++)
{
  var c_class = "kate";
  if (c_class in tile_types)
  {
    type = tile_types[c_class];
    break;
  };
  if (c_name in tile_types)
  {
    type = tile_types[c_name];
    break;
  };
};
print(type);

// workspace.clientAdded.connect
// (
//   function(client)
//   {
//     new_client = client; // newly added clients are not inside workspace yet, thus need to be stored in global new_client
//     var tile = MakeTile(client);
//     if (tile === -1) {return -1;};
//     layout.addTile(tile);
//     layout.renderLayout();
//     return 0;
//   }
// );
// 
// workspace.clientRemoved.connect
// (
//   function(client)
//   {
//     
//     //rewrite remove tile for only window_id as argument -> get rid of findTile
//     var found = layout.findTile(client.windowId);
//     if (found === -1) {return -1;}
//     layout.removeTile(found.tile_index, found.desktop_index, found.layer_index);
//     layout.renderLayout();
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
