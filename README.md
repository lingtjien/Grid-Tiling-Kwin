# Kwin Script That Automatically Tiles Windows

## Install

*Note:* `*path*` *is the path to this repository.*

### Normal Installation

```
kpackagetool5 --type KWin/Script -i *path*
mkdir -p ~/.local/share/kservices5
cd ~/.local/share/kservices5
ln -s *path*/metadata.desktop kwin-script-grid-tiling.desktop
```

### Local Installation (Advanced)

```
mkdir -p ~/.local/share/kwin/scripts/grid-tiling
cd ~/.local/share/kwin/scripts/grid-tiling
ln -s *path*/contents contents
ln -s *path*/metadata.desktop metadata.desktop
mkdir -p ~/.local/share/kservices5
cd ~/.local/share/kservices5
ln -s *path*/metadata.desktop kwin-script-grid-tiling.desktop
```

*Note: You can replace `ln -s` for `cp`, if you prefer to copy and not have it linked to your cloned repository (if you do this then you're pretty much manually doing what `kpackagetool5` does), using `ln` instead of `cp` will result in an automatic update when you pull the latest changes*

### System Installation

*replace `~/.local/share` for `/usr/share` in Local Installation (Advanced) Method*

## Uninstall

Delete the linked or copied files that you created during installation. To remove installed scripts by `kpackagetool5`, run the same command again but this time with `-r` instead of `-i` to remove (see manual of `kpackagetool5` for more info)

## Functionality
- automatically tile clients, up to any grid size of clients per desktop
  - new clients are first attempted to be added the desktop and screen the client was started on, to the column with the most amount of space left
  - the size of the grid (row & column) is supplied in the UI per screen and separated by a comma (first element in row & column are for your first screen and so forth...)
  - you **must** supply a grid for every screens that you have connected (and plan to connect)

![](http://tiny.cc/tiling-2x2)
![](http://tiny.cc/tiling-2x3)

- restriction of minimum space a client can occupy on a virtual desktop, as in the amount of clients this client can share a virtual desktop with
  - a list of comma seperated numbers, larger or equal to `1`
  - defaults to the maximum which is the number of rows multiplied by columns (of the largest grid)
  - a size of `1` is the largest which means that it can only ever exist alone on a virtual desktop, size of `2` means that it can exist with one other client together on a virtual desktop and so forth...

![](http://tiny.cc/minsize-1)
![](http://tiny.cc/minsize-2)

- move clients between virtual desktops (supports the default KWin shortcuts). `Grid-Tiling: Move *Next/Previous* Desktop/Screen` moves the client to the next desktop or screen that has space, prioritizes screen over desktop.

![](http://tiny.cc/move-desktop-screen)

- swap clients within a virtual desktop by dragging them on top with most overlap

![](http://tiny.cc/swap-mouse)

- move clients within a virtual desktop, first attempts to move the client if that fails it will fallback to switching.
  - `Grid-Tiling: Swap *Up/Down*`
  - `Grid-Tiling: Move/Swap *Left/Right*`

![](http://tiny.cc/swap-shortcut)
![](http://tiny.cc/move-shortcut)

- dynamically resize clients up to a minimum as defined by `dividerBound`
  - dragging client borders by mouse
  - `Grid-Tiling: *Increase/Decrease* Size` using a step size of `dividerStep`

![](http://tiny.cc/resize-mouse)
![](http://tiny.cc/resize-shortcut)

- minimization of clients (suppports the default KWin shortcuts)

![](http://tiny.cc/minimize-shortcut)

- minimizes all other clients or unminimizes all clients on the current desktop `Grid-Tiling: Minimize Others/Unminimize Desktop`

![](http://tiny.cc/un-minimize_all-shortcut)

- toggle gap `Grid-Tiling: Toggle Gap`

![](http://tiny.cc/toggle-gap)

- toggle between bordered clients `Grid-Tiling: Toggle Border`

![](http://tiny.cc/toggle-border)

- dynamically float and tile clients `Grid-Tiling: Tile/Float`
- toggle new clients start as tile or float `Grid-Tiling: Toggle Tile`

![](http://tiny.cc/float-tile)

- close all clients on the current virtual desktop `Grid-Tiling: Close Desktop`

![](http://tiny.cc/close-desktop)

- set margins as defined by `marginTop` `marginBottom` `marginLeft` `marginRight`
- set the gap size as defined by `gap`
- set default gap show toggle `gapShow`
- set default tile toggle `tile`
- set default borders toggle `border`
- add clients to ignored lists (clients, captions) defined by `ignoredNames` and `ignoredCaptions`, these clients are completely ignored and can't be tiled.

*Note: ignored client names do not have to be an exact match, whereas ignored captions do.*

## Recommended Setup
- set window focus policy to `focus follows mouse - mouse precedence`
- disable `Allow KDE apps to remember the positions of their own windows`
  1. window management
  2. window behavior
  3. advanced

- set shortcuts `Switch One Desktop *Left/Up/Down/Right*` to `Meta+*Left/Up/Down/Right*`
- set shortcuts `Grid-Tiling: Swap *Up/Down*` to `Meta+Ctrl+*Up/Down*`
- set shortcuts `Grid-Tiling: Move/Swap *Left/Right*` to `Meta+Ctrl+*Left/Right*`
- set shortcuts `Switch To Window *Left/Up/Down/Right*` to `Meta+Alt+*Left/Up/Down/Right*`
- set shortcuts `Grid-Tiling: Move *Previous/Next* Desktop` to `Meta+*Home/End*`
- set shortcuts `Window One Desktop *Down/Up*` to `Meta+*PgDn/PgUp*`

- set shortcut `Grid-Tiling: Minimize Others/Unminimize Desktop` to `Meta+M`
- set shortcut `Minimize Window` to `Meta+N`

- set shortcut `Grid-Tiling: Increase Size` to `Meta+=`
- set shortcut `Grid-Tiling: Decrease Size` to `Meta+-`

- set shortcut `Grid-Tiling: Toggle Gap` to `Meta+G`
- set shortcut `Grid-Tiling: Toggle Border` to `Meta+B`

- set shortcut `Grid-Tiling: Toggle Tile` to `Meta+Shift+T`
- set shortcut `Grid-Tiling: Tile/Float` to `Meta+T`

- set shortcut `Grid-Tiling: Close Desktop` to `Meta+Q`
- set shortcut `Close Window` to `Meta+W`

- set shortcut `Grid-Tiling: Refresh` to `Meta+R`

*If you use multiple screens you could also consider using the default shortcuts of KWin `Window To *Previous/Next* *Screen*` to `Meta+*PgDn/PgUp*` to easily move clients between screens*

## Useful To Know
- This version of the script uses KWin API methods introduced in 5.18, so use the other branch if you use an older version of KWin.
- After installing a KWin script you can activate it in the system settings, here you'll also find the configuration button.
- When you adjust the settings in the menu, this script needs to be restarted before the settings are applied. You can do this by turning the script off, apply, turn it back on and apply again or a complete KWin restart (re-log/reboot).
- If you have KWin shortcuts added by the script that you no longer need or use (because they got renamed to something else for example), then you can delete the old unused shortcuts by first selecting KWin in the global shortcuts menu and then pressing the `remove the selected component` button (hover mouse over the button to see the text). This action does require you to not have the KWin script active.
- Some applications do not always render correctly on startup, this is due to them overwriting the geometry with their own. They sometimes provide settings to disable setting their own geometry. If it still happens, than you can use the global refresh shortcut to let the script set all geometries again.
- Moving clients between desktops using the action menu can sometimes result in wrong placement, just use the global refresh shortcut.
- Spotify can sometimes not be defined as full or half client, because both the client name and class of spotify are blank at startup.
- Dynamically resizing clients with the mouse can result in weird visual artifacts when dragged outside of the bounds, just use the global shortcut that refreshes the layout.
-  This was made with the intended use of using a set amount of virtual desktops. For the best result make sure you have more virtual desktops than you have clients normally. The script can handle more clients but once all desktops are full, all new clients will start as floating instead of tiling until there is space again to tile new clients.
- I don't use dynamic virtual desktops, but it should be able to deal with it as long as the clients are closed when the virtual desktop is removed.

## Extra Settings Info

These are settings that you can adjust in KWin which are unrelated to this script.

### Change Window Action Modifier Key
1. System Settings
2. Window Management
3. Window Behavior
4. Window Actions
5. Modifier Key

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
