# Kwin Script That Automatically Tiles Windows

## Install

### Normal Installation

*Note:* `*path*` *is the path to this repository.*

```
plasmapkg2 --type kwinscript -i *path*
mkdir -p ~/.local/share/kservices5
cd ~/.local/share/kservices5
ln -s ../kwin/scripts/grid-tiling/metadata.desktop kwin-script-grid-tiling.desktop 
```

### Local Installation (Advanced)

```
mkdir -p ~/.local/share/kwin/scripts/grid-tiling
cd ~/.local/share/kwin/scripts/grid-tiling
ln -s *path*/contents contents
ln -s *path*/metadata.desktop metadata.desktop
mkdir -p ~/.local/share/kservices5
cd ~/.local/share/kservices5
ln -s ../kwin/scripts/grid-tiling/metadata.desktop kwin-script-grid-tiling.desktop 
```

*Note: You can replace `ln -s` for `cp`, if you prefer to copy and not have it linked to your cloned repository (if you do this then you're pretty much manually doing what `plasmapkg2` does), using `ln` instead of `cp` will result in an automatic update when you pull the latest changes*

### System Installation

*replace `~/.local/share` for `/usr/share` in Local Installation (Advanced) Method*

## Uninstall  

Delete the linked or copied files that you created during installation. To remove installed scripts by `plasmapkg2`, run the same command again but this time with `-r` instead of `-i` to remove (see manual of `plasmapkg2` for more info)

## Functionality
- automatically tile clients, up to any grid size of clients per (internal) virtual desktop, new clients are first attempted to be added to your current desktop, to the column with the least number of clients.
  - the size of the grid (row & column) is supplied in the UI per screen and separated by a comma (first element in row & column are for your first screen and so forth...)
  - you can supply different grid sizes per screen if you have multiple screens
  - if you do not supply a grid size for your additional screen(s) then it will default to the grid size of the first screen

![](https://media.giphy.com/media/1qha5U2v85vIOTeT6f/giphy.gif)
  
- restriction of minimum space a client can occupy on a virtual desktop, as in the amount of clients this client can share a virtual desktop with
  - the minimum is defined by an **integral number** larger or equal to `1`
  - defaults to the maximum which is the number of rows multiplied by columns
  - a size of `1` is the largest which means that it can only ever exist alone on a virtual desktop, size of `2` means that it can exist with one other client together on a virtual desktop and so forth...

![](https://media.giphy.com/media/d5ze8TC9GUQrhElN2Q/giphy.gif)
  
- set margins as defined by `topMargin` `bottomMargin` `leftMargin` `rightMargin`
- set the gap size as defined by `gap`
- set the opacity as defined by `opacity`
- set default opacity toggle `noOpacity`
- set default borders toggle `noBorders`
- toggle between bordered clients (global shortcut: `Grid-Tiling: Toggle Borders`)

![](https://media.giphy.com/media/pzKoeHMevmRZBEr6ej/giphy.gif)

- toggle between opaque clients (global shortcut: `Grid-Tiling: Toggle Opacity`)

![](https://media.giphy.com/media/2vjoPmERuumZhpcDBN/giphy.gif)

- switch clients within a virtual desktop both by dragging them outside the `moveThreshold` by mouse and global shortcuts

![](https://media.giphy.com/media/2WH0gA5A0mDLxBwVop/giphy.gif)
![](https://media.giphy.com/media/1XbN5mJlXUn3hoDoPk/giphy.gif)

- move clients between virtual desktops (global shortcut: `Grid-Tiling: Move *Number*`). This will attempt to move the active client to a desktop and screen depending on the amount of screens (if it fails then it will attempt the next or previous one). If you have only *one screen* then this number is equal to the desktop number, if you have *2 screens* then *Number 1* is `desktop 1` & `screen 1`, *Number 2* `desktop 1` & `screen 2`, *Number 3* `desktop 2` & `screen 1` and so forth...
- move clients between virtual desktops (global shortcut: `Grid-Tiling: Move *Left/Up/Down/Right* Desktop`)

![](https://media.giphy.com/media/2wh560orSSXgoiObR1/giphy.gif)

- close all clients on the current virtual desktop (global shortcut: `Grid-Tiling: Close Desktop`)
- dynamically resize clients both by dragging them by mouse and global shortcuts up to a minimum as defined by `dividerBounds`

![](https://media.giphy.com/media/1bK3hVSqPv7Xt0hrgo/giphy.gif)
![](https://media.giphy.com/media/SiEq2XtSWZEvIIlMlQ/giphy.gif)

- support for minimization
- maximize (global shortcut: `Grid-Tiling: Maximize`), minimizes all other clients
- unminimize all clients on currect virtual desktop (global shortcut: `Grid-Tiling: Unminimize Desktop`)

![](https://media.giphy.com/media/k80kK1UBeeULHR9Joa/giphy.gif)

- add clients to ignored lists (clients, captions) defined by `ignoredClients` and `ignoredCaptions`
- also works for applications which enforce their own geometry on startup (most of the time)

*Note: ignored clients does not have to be an exact match, whereas ignored captions do.*

*Note: internal virtual desktops are defined inside the script and are not the same as the actual virtual desktop. If you fill all your virtual desktops and create a new client than a new layer will be made, which contains a virtual desktop which is different from the one in the layer underneath it.*

## Recommended Setup
- set window focus policy to `focus follows mouse - mouse precedence`
- set shortcuts `Switch One Desktop *Left/Up/Down/Right*` to `Meta+*Left/Up/Down/Right*`
- set shortcuts `Grid-Tiling: Switch *Left/Up/Down/Right*` to `Meta+Ctrl+*Left/Up/Down/Right*`
- set shortcuts `Switch To Window *Left/Up/Down/Right*` to `Meta+Alt+*Left/Up/Down/Right*`
- set shortcuts `Grid-Tiling: Move *Left/Up/Down/Right* Desktop` to `Meta+*Home/PgUp/PgDn/End*`
- set shortcut `Grid-Tiling: Toggle Opacity` to `Meta+O`
- set shortcut `Grid-Tiling: Toggle Borders` to `Meta+P`
- set shortcut `Close Window` to `Meta+W`
- set shortcut `Grid-Tiling: Close Desktop` to `Meta+Q`
- set shortcut `Grid-Tiling: Maximize` to `Meta+M`
- set shortcut `Grid-Tiling: Unminimize Desktop` to `Meta+,`
- set shortcut `Minimize Window` to `Meta+N`
- set shortcut `Grid-Tiling: Refresh` to `Meta+R`
- set shortcut `Grid-Tiling: Increase Size` to `Meta+=`
- set shortcut `Grid-Tiling: Decrease Size` to `Meta+-`

## Known Issues
- If you have kwin shortcuts added by the script that you no longer need or use (because they got renamed to something else for example), then you can delete the old unused shortcuts by first selecting kwin in the global shortcuts menu and then pressing the `remove the selected component` button (hover mouse over the button to see the text). This action does require you to not have the KWin script active.
- Sometimes when you adjust the settings in the menu, you need to turn the script off, apply it, turn it back on and apply it again to register the new values (or just re-log).
- Some applications do not render correctly on startup sometimes, just use the global shortcut that refreshes the layout
- Spotify can sometimes not be defined as full or half client, because both the client name and class of spotify are blank (random)
- Dynamically resizing clients with the mouse can result in weird visual artifacts when dragged outside of the bounds, just use the global shortcut that refreshes the layout.
- I don't use activities, so I don't know how this does with activities.
- I don't use dynamic virtual desktops, no idea what happends. This was made with the intended use of using a set amount of virtual desktops. For the best result make sure you have more virtual desktops than you have clients normally, the script can handle more clients that can fit into all your virtual desktops but it then creates a new layer on top which will make it hard to interact with the clients in the layer underneath.

## Extra Settings Info

These are settings that you can adjust in KWin which are unrelated to this script.

### Transparant Blurry Menu

1. System Settings
2. Application Style
3. Widget Style
4. `configure`
5. Transparency

### Changing Client Border Size

1. System Settings
2. Application Style
3. Window Decorations
4. **select** `Border size`

### Hiding Client Title Bars

1. System Settings
2. Application Style
3. Window Decorations
4. Your Theme
5. Window Specific Overrides
6. Add
7. **check** `Hide window title bar`
8. `Regular expression to match` = `.*`
