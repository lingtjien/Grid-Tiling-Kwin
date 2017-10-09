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

function Tile (window_id, type)
{
  this.window_id = window_id; //must be unique for every window
  this.type = type; //either 1, 0.5 or 0.25
};

// every tiled desktop has at max 4 tiles per layer
function TiledDesktop ()
{
  this.filled = false;
  this.tiles = [];
  this.ntiles = function () {return this.tiles.length;};
  
  this.addTile = function (tile)
  {
    if (this.filled) {return -1;};
    this.tiles.push(tile);
  };
  
  this.removeTile = function (window_id)
  {
    if (this.ntiles === 0) {return -1;};
    if (this.tiles.includes(window_id))
    {
      this.tiles.splice(this.tiles.window_id.indexOf(window_id), 1);
      this.filled = false;
    } else {return -1;};
  };
  
  this.largestAvailableSize = function ()
  {
    if (this.filled) {return -1;}
    
    
  };
};

// all virtual desktops are contained in one layer
function Layer ()
{
  this.filled = false;
  this.desktops = [];
  this.ndesktops =  function () {return this.desktops.length;};
  
  this.addDesktop = function (desktop)
  {
    if (this.filled) {return -1;};
    this.desktop.push(desktop);
  };
  
  this.removeTile = function (window_id)
  {
    var check = -1;
    for (i = 0; i < this.ndesktops; i++)
    {
      check = this.desktops[i].removeTile(window_id);
      if (check === -1) {continue;};
      break;
    };
    return check;
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
    
    
  }
);

