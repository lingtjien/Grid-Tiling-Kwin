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
var smallest_size =
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
  
  this.findSize = function (size)
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
  this.size = function () {return this.ndesktops() / workspace.desktops;};
  
  this.findSize = function (size)
  {
    for (var i = 0; i < this.ndesktops(); i++)
    {
      if (this.desktops[i].findSize(size) !== -1) {return i;};
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
    var found = this.findSize(tile.size);
    if (i !== -1 )
    {
      this.desktops[found].addTile(tile);
      return 0;
    };
    var desktop = new Desktop();
    if (this.addDesktop(desktop) === -1) {return -1;};
    this.desktops[this.ndesktops() - 1].addTile(tile);
    return 0;
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
  
  this.findSize = function (size)
  {
    var found = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      found = this.layers[i].findSize(size);
      if (found !== -1) {return {desktop_index: found, layer_index: i};};
    };
    return found;
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
  
  this.removeDesktop = function (desktop_index, layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].removeDesktop(desktop_index);
  };
  
  this.addTile = function (tile)
  {
    var found = this.findSize(tile.size);
    if (found !== -1 )
    {
      this.layers[found.layer_index].desktops[found.desktop_index].addTile(tile);
      return 0;
    };
    var layer = new Layer();
    this.addLayer(desktop);
    return this.layers[this.nlayers() - 1].addTile(tile);
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

// -------------
// Class Testing
// -------------

var layout = new Layout();

var layer1 = new Layer();
var layer2 = new Layer();

var desktop1 = new Desktop();
var desktop2 = new Desktop();
var desktop3 = new Desktop();
var desktop4 = new Desktop();

var tile1 = new Tile(1, 0.25);
var tile2 = new Tile(2, 0.5);
var tile3 = new Tile(3, 0.25);
var tile4 = new Tile(4, 0.5);
var tile5 = new Tile(5, 0.25);
var tile6 = new Tile(6, 0.5);
var tile7 = new Tile(7, 0.25);
var tile8 = new Tile(8, 0.5);

print('Adding Tiles to Desktops');
print(desktop1.addTile(tile1));
print(desktop1.addTile(tile2));
print(desktop2.addTile(tile3));
print(desktop2.addTile(tile4));
print(desktop3.addTile(tile5));
print(desktop3.addTile(tile6));
print(desktop4.addTile(tile7));
print(desktop4.addTile(tile8));

print('Adding Desktops to Layers');
print(layer1.addDesktop(desktop1));
print(layer1.addDesktop(desktop2));
print(layer2.addDesktop(desktop3));
print(layer2.addDesktop(desktop4));

print('Adding Layers to Layout');
print(layout.addLayer(layer1));
print(layout.addLayer(layer2));

print('Testing Methods');
print(layout.findTile(2).desktop_index);
print(layout.findTile(2).layer_index);

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

