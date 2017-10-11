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

// ----------------
// Data Definitions
// ----------------

function Tile (window_id, size)
{
  this.window_id = window_id; //must be unique for every window
  this.size = size; //max 1, which is completely fill one desktop
};

function Desktop ()
{
  this.tiles = [];
  this.ntiles = function () {return this.tiles.length;};
  this.size = function ()
  {
    sum = 0;
    for (i = 0; i < this.ntiles(); i++) {sum += this.tiles[i].size;};
    return sum;
  };
  
  this.addTile = function (tile)
  {
    if (this.size() === 1) {return -1;};
    this.tiles.push(tile);
    return 0;
  };
  
  this.removeTile = function (window_id)
  {
    if (this.ntiles === 0) {return -1;};
    
    for (i = 0; i < this.size(); i++)
    {
      if (this.tiles[i].window_id === window_id)
      {
        print('hihi');
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
  this.size = function ()
  {
    return workspace.desktops-this.ndesktops;
  };
  
  this.addDesktop = function (desktop)
  {
    if (this.availableSize == 0) {return -1;};
    this.desktop.push(desktop);
    return 0;
  };
  
  this.removeTile = function (window_id)
  {
    var check = -1;
    for (i = 0; i < this.ndesktops; i++)
    {
      check = this.desktops[i].removeTile(window_id);
      if (check === 0) {break;};
    };
    return check;
  };
  
  //returns the first desktop that has enough space
  this.availableDesktopId = function (size)
  {
    desktop = -1;
    for (i = 0; i < this.ndesktops; i++)
    {
      if (this.desktops[i].availableSize() > size)
      {
        desktop = i;
        break;
      }
      return desktop;
    };
    
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
  
  this.addDesktop = function (desktop)
  {
    
    
    return 0;
  };
};

// start of script

// execute when new client is opened
workspace.clientAdded.connect
(
  function(client)
  {
//     var geometry = client.geometry
//     geometry.x = client.x + gap + margins["left"];
//     geometry.y = client.y + gap + margins["top"];
//     geometry.width = client.width - gap * 2 - margins["left"] - margins["right"];
//     geometry.height = client.height * 0.5 - gap - margins["top"];
//     
//   //   client.geometry = geometry
//     
//     print(client.windowId)
//     print(client.caption)
//     print('new client opened')
//     print(client.geometry.x)
//     print(client.geometry.y)
//     print(client.geometry.width)
//     print(client.geometry.height)
    
    var tile = new Tile(client.windowId, 0.5);
    
    var desktop = new Desktop();
    desktop.addTile(tile);
    desktop.removeTile(client.windowId);
    
    
    
    
  }
);

