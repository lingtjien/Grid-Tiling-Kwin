# Kwin Script That Automatically Tiles Windows

## Install

*Note:* `*path*` *is the path to this repository.*

### Normal Installation

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
- automatically tile clients, up to any grid size of clients per desktop
  - new clients are first attempted to be added to your current desktop, to the column with the least number of clients.
  - the size of the grid (row & column) is supplied in the UI per screen and separated by a comma (first element in row & column are for your first screen and so forth...)
  - you can supply different grid sizes per screen if you have multiple screens
  - if you do not supply a grid size for your additional screen(s) then it will default to the grid size of the first screen

![](http://tiny.cc/tiling-2x2)
![](http://tiny.cc/tiling-2x3)

- restriction of minimum space a client can occupy on a virtual desktop, as in the amount of clients this client can share a virtual desktop with
  - the minimum is defined by an **integer** larger or equal to `1`
  - defaults to the maximum which is the number of rows multiplied by columns (of the largest grid)
  - a size of `1` is the largest which means that it can only ever exist alone on a virtual desktop, size of `2` means that it can exist with one other client together on a virtual desktop and so forth...

![](http://tiny.cc/minsize-1)
![](http://tiny.cc/minsize-2)

- move clients between virtual desktops (supports the default KWin shortcuts). `Grid-Tiling: Move *Next/Previous* Desktop/Screen` moves the client to the next desktop or screen that has space.

![](http://tiny.cc/move-desktop-screen)

- swap clients within a virtual desktop
  - dragging client outside the `moveThreshold`
  - `Grid-Tiling: Swap *Left/Up/Down/Right*`

![](http://tiny.cc/swap-shortcut)
![](http://tiny.cc/swap-mouse)

- move clients within a virtual desktop, first attempts to move the client if that fails it will fallback to switching.
  - `Grid-Tiling: Move/Swap *Left/Right*`

![](http://tiny.cc/move-shortcut)

- dynamically resize clients up to a minimum as defined by `dividerBounds`
  - dragging client borders by mouse
  - `Grid-Tiling: *Increase/Decrease* Size`

![](http://tiny.cc/resize-mouse)
![](http://tiny.cc/resize-shortcut)

- minimization of clients (suppports the default KWin shortcuts)

![](http://tiny.cc/minimize-shortcut)

- maximize, minimizes all other clients on desktop `Grid-Tiling: Maximize`

![](http://tiny.cc/maximize-shortcut)

- unminimize all clients on currect desktop `Grid-Tiling: Unminimize Desktop`

![](http://tiny.cc/unminimize-desktop)

- toggle between bordered clients `Grid-Tiling: Toggle Borders`

![](http://tiny.cc/toggle-border)

- toggle between opaque clients `Grid-Tiling: Toggle Opacity`

![](http://tiny.cc/toggle-opacity)

- dynamically float and tile clients `Grid-Tiling: *Float/Tile*`

![](http://tiny.cc/float-tile)

- close all clients on the current virtual desktop `Grid-Tiling: Close Desktop`

![](http://tiny.cc/close-desktop)

- add clients to ignored lists (clients, captions) defined by `ignoredClients` and `ignoredCaptions`
- set margins as defined by `topMargin` `bottomMargin` `leftMargin` `rightMargin`
- set the gap size as defined by `gap`
- set the opacity as defined by `opacity`
- set default opacity toggle `noOpacity`
- set default borders toggle `noBorders`

*Note: ignored client names do not have to be an exact match, whereas ignored captions do.*

## Recommended Setup
- set window focus policy to `focus follows mouse - mouse precedence`

- set shortcuts `Switch One Desktop *Left/Up/Down/Right*` to `Meta+*Left/Up/Down/Right*`
- set shortcuts `Grid-Tiling: Swap *Up/Down*` to `Meta+Ctrl+*Up/Down*`
- set shortcuts `Grid-Tiling: Move/Swap *Left/Right*` to `Meta+Ctrl+*Left/Right*`
- set shortcuts `Switch To Window *Left/Up/Down/Right*` to `Meta+Alt+*Left/Up/Down/Right*`
- set shortcuts `Grid-Tiling: Move *Previous/Next* Desktop` to `Meta+*Home/End*`
- set shortcuts `Window One Desktop *Down/Up*` to `Meta+*PgDn/PgUp*` 

- set shortcut `Grid-Tiling: Maximize` to `Meta+M`
- set shortcut `Grid-Tiling: Unminimize Desktop` to `Meta+,`
- set shortcut `Minimize Window` to `Meta+N`

- set shortcut `Grid-Tiling: Increase Size` to `Meta+=`
- set shortcut `Grid-Tiling: Decrease Size` to `Meta+-`

- set shortcut `Grid-Tiling: Toggle Opacity` to `Meta+O`
- set shortcut `Grid-Tiling: Toggle Borders` to `Meta+P`

- set shortcut `Grid-Tiling: Float` to `Meta+X`
- set shortcut `Grid-Tiling: Tile` to `Meta+Z`

- set shortcut `Grid-Tiling: Close Desktop` to `Meta+Q`
- set shortcut `Close Window` to `Meta+W`

- set shortcut `Grid-Tiling: Refresh` to `Meta+R`

*If you use multiple screens you could also consider using the default shortcuts of KWin `Window To *Previous/Next* *Screen*` to `Meta+*PgDn/PgUp*` to easily move clients between screens*

## Usefull To Know
- If you have kwin shortcuts added by the script that you no longer need or use (because they got renamed to something else for example), then you can delete the old unused shortcuts by first selecting kwin in the global shortcuts menu and then pressing the `remove the selected component` button (hover mouse over the button to see the text). This action does require you to not have the KWin script active.
- When you adjust the settings in the menu, you need to turn the script off, apply it, turn it back on and apply it again to register the new values (or re-log/reboot).
- Some applications do not render correctly on startup sometimes, just use the global refresh shortcut.
- Moving clients between desktops using the action menu can sometimes result in wrong placement, just use the global refresh shortcut.
- Spotify can sometimes not be defined as full or half client, because both the client name and class of spotify are blank at startup.
- Dynamically resizing clients with the mouse can result in weird visual artifacts when dragged outside of the bounds, just use the global shortcut that refreshes the layout.
- I don't use activities, so I don't know how this does with activities.
- I don't use dynamic virtual desktops, no idea what happends. This was made with the intended use of using a set amount of virtual desktops. For the best result make sure you have more virtual desktops than you have clients normally, the script can handle more clients that can fit into all your virtual desktops but it then creates a new layer on top which will make it hard to interact with the clients in the layer underneath.

## Extra Settings Info

These are settings that you can adjust in KWin which are unrelated to this script.

### Change Window Action Modifier Key
1. System Settings
2. Window Management
3. Window Behavior
4. Window Actions
5. Modifier Key

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
