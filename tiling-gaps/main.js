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
  x_max: workspace.displayWidth-margins.right,
  y_max: workspace.displayHeight-margins.bottom,
};

// the smallest tile, must be either 1, 0.5 or 0.25, defaults to 0.25, so quarters are not needed to be specified
var smallest_tile =
{
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

function Tile (window_id, size)
{
  this.window_id = window_id; // must be unique for every window
  this.size = size; // max 1, which is completely fill one desktop
};

function Desktop ()
{
  this.tiles = [];
  this.ntiles = function () {return this.tiles.length;};
  this.size = function ()
  {
    var sum = 0;
    for (var i = 0; i < this.ntiles(); i++) {sum += this.tiles[i].size;};
    return sum;
  };
  this.available = function (size)
  {
    if (1 - this.size() >= size) {return 0;};
    return -1;
  };
  
  this.addTile = function (tile)
  {
    if (this.size() === 1) {return -1;};
    this.tiles.push(tile);
    return 0;
  };
  
  this.removeTile = function (tile_index)
  {
    if (tile_index >= this.ntiles()) {return -1;};
    this.tiles.splice(tile_index, 1);
    return 0;
  };
  
  this.removeTileWindowId = function (window_id)
  {
    if (this.ntiles() === 0) {return -1;};
    
    for (var i = 0; i < this.ntiles(); i++)
    {
      if (this.tiles[i].window_id === window_id)
      {
        this.removeTile(i);
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
  this.size = function () {return this.ndesktops() / workspace.desktops;};
  
  this.availableId = function (size)
  {
    for (var i = 0; i < this.ndesktops(); i++)
    {
      if (this.desktops[i].available(size) === 0) {return i;};
    };
    return -1;
  };
  
  this.addDesktop = function (desktop)
  {
    if (this.size() >= 1) {return -1;};
    this.desktops.push(desktop);
    return 0;
  };
  
  this.removeDesktop = function (desktop_index)
  {
    if (desktop_index >= this.ndesktops()) {return -1;};
    this.desktops.splice(desktop_index, 1);
    return 0;
  };
  
  this.addTile = function (tile)
  {
    var i = this.availableId(tile.size);
    if (i != -1 )
    {
      this.desktops[i].addTile(tile);
      return 0;
    };
    var desktop = new Desktop();
    if (this.addDesktop(desktop) === -1) {return -1;};
    this.desktops[this.ndesktops() - 1].addTile(tile);
    return 0;
  };
  
  this.removeTile = function (desktop_index, tile_index)
  {
    if (desktop_index >= this.ndesktops()) {return -1;};
    return this.desktops[desktop_index].removeTile(tile_index);
  };
  
  this.removeTileWindowId = function (window_id)
  {
    for (var i = 0; i < this.ndesktops(); i++)
    {
      if (this.desktops[i].removeTileWindowId(window_id) === 0)
      {
        if (this.desktops[i].size() === 0) {this.removeDesktop(i);};
        return 0;
      };
    };
    return -1;
  };
};

function Layout ()
{
  this.layers = [];
  this.nlayers = function () {return this.layers.length;};
  
  this.availableId = function (size)
  {
    for (var i = 0; i < this.nlayers(); i++)
    {
      if (this.layers[i].availableId(size) != -1) {return i;};
    };
    return -1;
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
  
  this.addDesktop = function (desktop)
  {
    for (var i = 0; this.nlayers(); i++)
    {
      if (this.layers[i].size() < 1) 
      {
        this.layers[i].addDesktop(desktop);
        return 0;
      };
    };
    return -1;
  };
  
  this.removeDesktop = function (layer_index, desktop_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].removeDesktop(desktop_index);
  };
  
  this.addTile = function (tile)
  {
    var i = this.availableId(tile.size);
    if (i != -1 )
    {
      this.layers[i].addTile(tile);
      return 0;
    };
    var layer = new Layer();
    this.addLayer(desktop);
    return this.layers[this.nlayers() - 1].addTile(tile);
  };
  
  this.removeTile = function (layer_index, desktop_index, tile_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].removeTile(desktop_index, tile_index);
  };
  
  this.removeTileWindowId = function (window_id)
  {
    for (var i = 0; i < this.nlayers(); i++)
    {
      if (this.layers[i].removeTileWindowId(window_id) === 0) {return 0;};
    };
    return -1;
  };
};

// -------------
// Class Testing
// -------------

var layout = new Layout();

var layer1 = new Layer();
var layer2 = new Layer();

var desktop1 = new Desktop();
var desktop2 = new Desktop();

var tile1 = new Tile(0, 0.25);
var tile2 = new Tile(1, 0.5);

print('Adding Tiles to Desktops');
print(desktop1.addTile(tile1));
print(desktop1.addTile(tile2));
print(desktop2.addTile(tile1));
print(desktop2.addTile(tile2));

print('Adding Desktops to Layers');
print(layer1.addDesktop(desktop1));
print(layer1.addDesktop(desktop2));
print(layer2.addDesktop(desktop1));
print(layer2.addDesktop(desktop2));

print('Adding Layers to Layout')
print(layout.addLayer(layer1));
print(layout.addLayer(layer2));

// -----
// Start
// -----

// // execute when new client is opened
// workspace.clientAdded.connect
// (
//   function(client)
//   {
// //     var geometry = client.geometry
// //     geometry.x = client.x + gap + margins["left"];
// //     geometry.y = client.y + gap + margins["top"];
// //     geometry.width = client.width - gap * 2 - margins["left"] - margins["right"];
// //     geometry.height = client.height * 0.5 - gap - margins["top"];
// //     
// //   //   client.geometry = geometry
// //     
// //     print(client.windowId)
// //     print(client.caption)
// //     print('new client opened')
// //     print(client.geometry.x)
// //     print(client.geometry.y)
// //     print(client.geometry.width)
// //     print(client.geometry.height)
// 
//   };
// );

