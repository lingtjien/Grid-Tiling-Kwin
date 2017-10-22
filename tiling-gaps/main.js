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
  "Preferences (Shift+Ctrl+P)",
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
  this.renderDesktop = function (desktop_index, layer_index)
  {
    return RenderTiles(this.divider, this.tiles, this.ntiles(), desktop_index, layer_index);
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
  
  this.removeDesktop = function (desktop_index)
  {
    if (desktop_index >= this.ndesktops()) {return -1;};
    this.desktops.splice(desktop_index, 1);
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
  
  this.removeTile = function (window_id)
  {
    var removed = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      removed = this.desktops[i].removeTile(window_id);
      if (removed === 0)
      {
        if (this.desktops[i].size() === 0) {removed = this.removeDesktop(i);};
        break;
      };
    };
    return removed;
  };
  
  // divider
  this.setDivider = function (horizontal, vertical, desktop_index)
  {
    if (desktop_index >= this.ndesktops()) {return -1;};
    return this.desktops[desktop_index].setDivider(horizontal, vertical);
  };
  
  this.getDivider = function (desktop_index)
  {
    if (desktop_index >= this.ndesktops()) {return -1;};
    return this.desktops[desktop_index].getDivider();
  };
  
  // rendering
  this.renderLayer = function (layer_index)
  {
    var render = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      render = this.desktops[i].renderDesktop(i, layer_index);
    };
    return render;
  };
  
  this.renderDesktop = function (desktop_index, layer_index)
  {
    if (desktop_index >= this.ndesktops()) {return -1;};
    return this.desktops[desktop_index].renderDesktop(desktop_index, layer_index);
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
  
  this.removeLayer = function (layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    this.layers.splice(layer_index, 1);
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
  
  this.removeDesktop = function (desktop_index, layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].removeDesktop(desktop_index);
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
      if (removed === 0)
      {
        if (this.layers[i].ndesktops === 0) {removed = this.removeLayer(i);};
        break;
      };
    };
    return removed;
  };
  
  // divider
  this.setDivider = function (horizontal, vertical, desktop_index, layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].setDivider(horizontal, vertical, desktop_index);
  };
  
  this.getDivider = function (desktop_index, layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].getDivider(desktop_index);
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
  
  this.renderLayer = function (layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].renderLayer();
  };
  
  this.renderDesktop = function (desktop_index, layer_index)
  {
    if (layer_index >= this.nlayers()) {return -1;};
    return this.layers[layer_index].renderDesktop(desktop_index, layer_index);
  };
};

// ---------
// Functions
// ---------

function RenderClient (x, y, width, height, tile, desktop_index , layer_index)
{
  var client = workspace.getClient(tile.window_id);
  var geometry = 
  {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.floor(width),
    height: Math.floor(height),
  };
  
  client.desktop = desktop_index+1;
  client.geometry = geometry;
  
  client.tiled = 
  {
    desktop_index: desktop_index,
    geometry: geometry,
    layer_index: layer_index,
  };
  return 0;
};

function RenderTiles (divider, tiles, ntiles, desktop_index, layer_index)
{
  if (ntiles === 0) {return -1;};
  
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
    RenderClient(sx, sy, w+gap, h+gap, tiles[0], desktop_index, layer_index);
  }
  if (ntiles === 2)
  {
    RenderClient(sx, sy, lw, h+gap, tiles[0], desktop_index, layer_index);
    RenderClient(hx, sy, rw, h+gap, tiles[1], desktop_index, layer_index);
  };
  if (ntiles === 3)
  {
    if (tiles[0].type === 0.25 && tiles[1].type === 0.5 && tiles[2].type === 0.25)
    {
      RenderClient(sx, sy, lw, th, tiles[0], desktop_index, layer_index);
      RenderClient(hx, sy, rw, h+gap, tiles[1], desktop_index, layer_index);
      RenderClient(sx, hy, lw, bh, tiles[2], desktop_index, layer_index);
    }
    else if (tiles[0].type === 0.25 && tiles[1].type === 0.25 && tiles[2].type === 0.5)
    {
      RenderClient(sx, sy, lw, th, tiles[0], desktop_index, layer_index);
      RenderClient(sx, hy, lw, bh, tiles[1], desktop_index, layer_index);
      RenderClient(hx, sy, rw, h+gap, tiles[2], desktop_index, layer_index);
    }
    else
    {
      RenderClient(sx, sy, lw, h+gap, tiles[0], desktop_index, layer_index);
      RenderClient(hx, sy, rw, th, tiles[1], desktop_index, layer_index);
      RenderClient(hx, hy, rw, bh, tiles[2], desktop_index, layer_index);
    };
  };
  if (ntiles === 4)
  {
    RenderClient(sx, sy, lw, th, tiles[0], desktop_index, layer_index);
    RenderClient(hx, sy, rw, th, tiles[1], desktop_index, layer_index);
    RenderClient(hx, hy, rw, bh, tiles[2], desktop_index, layer_index);
    RenderClient(sx, hy, lw, bh, tiles[3], desktop_index, layer_index);
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

function GeometryChanged (client)
{
  var changed = -1;
  
  var resized_width = (client.tiled.geometry.width !== client.geometry.width);
  var resized_height = (client.tiled.geometry.height !== client.geometry.height);
  
  var moved_x = (client.tiled.geometry.x !== client.geometry.x && !resized_width);
  var moved_y = (client.tiled.geometry.y !== client.geometry.y && !resized_height);
  
  if (layout.layers[client.tiled.layer_index].desktops[client.tiled.desktop_index].length === 1) {return -1;};
  
  if (resized_width)
  {
    
    changed = 0;
  };
  if (resized_height)
  {
    
    changed = 0;
  };
  if (moved_x)
  {
    
    changed = 0;
  };
  if (moved_y)
  {
    
    changed = 0;
  };
  
  return changed;
};

// ---------------------------
// Connecting The KWin Signals
// ---------------------------

var added_clients = {}; // window_id of added clients
var layout = new Layout(); // main class, contains all methods

workspace.clientActivated.connect // clientAdded does not work for a lot of clients
(
  function (client)
  {
    if (client === null || client.windowId in added_clients) {return -1;};
    added_clients[client.windowId] = true;
    
    var tile = MakeTile(client);
    if (tile === -1) {return -1;};
    layout.addTile(tile);
    layout.renderLayout();
    workspace.currentDesktop = client.desktop;
    ConnectClient(client);
    return 0;
  }
);

workspace.clientRemoved.connect
(
  function (client)
  {
    if (!(client.windowId in added_clients)) {return -1;};
    delete added_clients[client.windowId];
    
    var removed = layout.removeTile(client.windowId);
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
      if (GeometryChanged(client) === -1) {return -1;};
      return layout.renderLayout();
    }
  );
//   client.clientStepUserMovedResized.connect
//   (
//     function (client)
//     {
//     }
//   );
  return 0;
};
