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

var dividerBounds = 0.2; // from this value to 1-value

// smallest minType sizes
var fullClients =
[
  "texstudio",
  "inkscape",
  "gimp",
];

var halfClients =
[
  "kate",
  "spotify",
];

// clients that are not tiled
var ignoredClients =
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

// clients must have a property minType, which is either 1.0/0.5/0.25 = fill/half/quarter, the minimum tile minType
function Desktop ()
{
  this.clients = [];
  this.nclients = function () {return this.clients.length;};
  
  this.size = function ()
  {
    var sum = 0;
    for (var i = 0; i < this.nclients(); i++) {sum += this.clients[i].minType;};
    return sum;
  };
  
  this.addClient = function (client)
  {
    if (CheckClient(client) === -1) {return -1;}; // on succes adds minType to client
    if (this.size()+client.minType > 1) {return -1;};
    this.clients.push(client);
    return 0;
  };
  
  this.removeClient = function (windowId)
  {
    if (this.nclients() === 0) {return -1;};
    for (var i = 0; i < this.nclients(); i++)
    {
      if (this.clients[i].windowId === windowId)
      {
        this.clients.splice(i, 1);
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
    return RenderClients(this.divider, this.clients, this.nclients(), desktopIndex, layerIndex);
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
  
  this.addClient = function (client)
  {
    var added = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      added = this.desktops[i].addClient(client);
      if (added === 0) {return added;};
    };
    var desktop = new Desktop();
    if (this.addDesktop(desktop) === -1) {return -1;};
    return this.desktops[this.ndesktops()-1].addClient(client);
  };
  
  this.removeClient = function (windowId)
  {
    var removed = -1;
    for (var i = 0; i < this.ndesktops(); i++)
    {
      removed = this.desktops[i].removeClient(windowId);
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
  
  this.addClient = function (client)
  {
    var added = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      added = this.layers[i].addClient(client);
      if (added === 0) {return added};
    };
    var layer = new Layer();
    this.addLayer(layer);
    return this.layers[this.nlayers()-1].addClient(client);
  };
  
  this.removeClient = function (windowId)
  {
    removed = -1;
    for (var i = 0; i < this.nlayers(); i++)
    {
      removed = this.layers[i].removeClient(windowId);
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

function CheckClient (client)
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
    //     if (clientClass === '' || clientName === '') {break;};
    if (clientClass.indexOf(ignoredClients[i]) !== -1) {return -1;};
    if (clientName.indexOf(ignoredClients[i]) !== -1) {return -1;};
  };
  
  var minType = 0.25;
  for (var i = 0; i < fullClients.length; i++)
  {
    if (clientClass.indexOf(fullClients[i]) !== -1 || clientName.indexOf(fullClients[i]) !== -1)
    {
      minType = 1;
      break;
    };
  };
  for (var i = 0; i < halfClients.length; i++)
  {
    if (clientClass.indexOf(halfClients[i]) !== -1 || clientClass.indexOf(halfClients[i]) !== -1)
    {
      minType = 0.5;
      break;
    };
  };
  
  client.minType = minType;
  return client;
};

function SetClient (x, y, width, height, client, desktopIndex, layerIndex)
{
  var geometry = 
  {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.floor(width),
    height: Math.floor(height),
  };
  
  client.desktop = desktopIndex+1;
  client.geometry = geometry;
  client.geometryRender = geometry;
  client.desktopIndex = desktopIndex;
  client.layerIndex = layerIndex;
  return 0;
};

function AssignType (clients, nclients)
{
  if (nclients === 0) {return -1;};
  if (nclients === 1)
  {
    clients[0].type = "f";
  }
  if (nclients === 2)
  {
    clients[0].type = "lh";
    clients[1].type = "rh";
  };
  if (nclients === 3)
  {
    if (clients[0].minType === 0.25 && clients[1].minType === 0.5 && clients[2].minType === 0.25)
    {
      clients[0].type = "tlq";
      clients[1].type = "rh";
      clients[2].type = "blq";
    }
    else if (clients[0].minType === 0.25 && clients[1].minType === 0.25 && clients[2].minType === 0.5)
    {
      clients[0].type = "tlq";
      clients[1].type = "blq";
      clients[2].type = "rh";
    }
    else
    {
      clients[0].type = "lh";
      clients[1].type = "trq";
      clients[2].type = "brq";
    };
  };
  if (nclients === 4)
  {
    clients[0].type = "tlq";
    clients[1].type = "trq";
    clients[2].type = "brq";
    clients[3].type = "blq";
  };
  return 0;
};

function RenderClients (divider, clients, nclients, desktopIndex, layerIndex)
{
  if (AssignType(clients, nclients) === -1) {return -1;};
  
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
  
  for (var i = 0; i < nclients; i++)
  {
    var client = clients[i];
    if (client.type === "f") // full
    {
      SetClient(sx, sy, w+gap, h+gap, client, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === "lh") // left half
    {
      SetClient(sx, sy, lw, h+gap, client, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === "rh") // right half
    {
      SetClient(hx, sy, rw, h+gap, client, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === "tlq") // top left quarter
    {
      SetClient(sx, sy, lw, th, client, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === "trq") // top right quarter
    {
      SetClient(hx, sy, rw, th, client, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === "brq") // bottom right quarter
    {
      SetClient(hx, hy, rw, bh, client, desktopIndex, layerIndex);
      continue;
    };
    if (client.type === "blq") // bottom left quarter
    {
      SetClient(sx, hy, lw, bh, client, desktopIndex, layerIndex);
      continue;
    };
  };
  return 0;
};

function GeometryChanged (client)
{
  var changed = -1;
  
  var resizedWidth = (client.geometryRender.width !== client.geometry.width);
  var resizedHeight = (client.geometryRender.height !== client.geometry.height);
  
  var movedX = (client.geometryRender.x !== client.geometry.x && !resizedWidth);
  var movedY = (client.geometryRender.y !== client.geometry.y && !resizedHeight);
  
  if (!resizedWidth && !resizedHeight && !movedX && !movedY) {return changed};
  var divider = layout.getDivider(client.desktopIndex, client.layerIndex);
  
  if (resizedWidth)
  {
    var changedWidth = client.geometry.width-client.geometryRender.width;
    
    changed = 0;
  };
  if (resizedHeight)
  {
    
    changed = 0;
  };
  if (movedX)
  {
    
    changed = 0;
  };
  if (movedY)
  {
    
    changed = 0;
  };
  
  return changed;
};

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
    if (layout.addClient(client) === -1) {return -1;};
    addedClients[client.windowId] = true;
    
    layout.renderLayout();
    workspace.currentDesktop = client.desktop;
//     ConnectClient(client); // connect client signals
    return 0;
  }
);

workspace.clientRemoved.connect
(
  function (client)
  {
    if (!(client.windowId in addedClients)) {return -1;};
    delete addedClients[client.windowId];
    
    var removed = layout.removeClient(client.windowId);
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
