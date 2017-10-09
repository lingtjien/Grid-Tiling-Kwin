// -----------------------
// My personal Kwin Script
// -----------------------

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

// the smallest tile, must be either "full", "half" or "quarter", defaults to "quarter", so quarters are not needed to be specified
var smallest_tile =
{
  kate: "half",
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

class Tile 
{
  constructor(window_id, type)
  {
    this.window_id = window_id;
    this.type = type;
  };
};

// // every entry desktop has at max 4 tiles per layer
// class Desktop
// {
//   constructor(tile)
//   {
//     this.ntiles = 1;
//     this.tile = tile;
//   };
//   
//   addTile(tile)
//   {
//     if (this.ntiles > 3) {return;}
//     this.ntiles++;
//     this.tile.push(tile);
//   };
//   
// };
// 
// var desktops = {};
// 
// // -------------
// // Data Handling
// // -------------
// 
// function NewTile(window_id)
// {
// //first look in the current desktop
//   var type = LargestTileTypeDesktop(workspace.currentDesktop);
//   
//   
// //   if (type === null) 
// //   {
// //     var desktop = FindDesktopSpace();
// //     tiles.type.push(FindTileType(desktop));
// //     tiles.desktop.push(desktop);
// //   }
// //   else 
// //   {
// //     tiles.type.push(type);
// //     tiles.desktop.push(current_desktop);
// //   }
//   
// };
// 
// function LargestTileTypeDesktop(desktop_id)
// {
//   print('hihi');
//   print(desktop[desktop_id]);
//   
//   return "quarter";
// };
// 
// 
// 
// // function NewTileType(desktop)
// // {
// //   var indexes = FindTileIndex(desktop);
// //   if (indexes.length === 0) {return "full";} 
// //   else if (indexes.length === 1) 
// //   {
// //     tiles.type[indexes[0]] = "half";
// //     return "half";
// //   }
// //   else if (indexes.length === 2)
// //   {
// //     tiles.type[indexes[0]] = "half";
// //     tiles.type[indexes[1]] = "quarter";
// //     return "quarter";
// //   } 
// //   else if (indexes.length === 3)
// //   {
// //     tiles.type[indexes[0]] = "quarter";
// //     tiles.type[indexes[1]] = "quarter";
// //     tiles.type[indexes[2]] = "quarter";
// //     return "quarter";
// //   } 
// //   else 
// //   {
// //     return null;
// //   }
// //   
// // };
// // 
// // function FindTileIndex(desktop)
// // {
// //   var indexes = [];
// //   for (i = 0; i < tiles.desktop.length; i++) {
// //     if (tiles.desktop[i] === desktop) {
// //       indexes.push(i);
// //     }
// //   }
// //   return indexes;
// // }
// 
// // start of script
// 
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
//     NewTile(client.windowId);
//     
//   }
// );
// 
