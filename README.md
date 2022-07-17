# Kwin Grid-Tiling Script

[![](https://i.imgur.com/TzdWQVM.png)](https://youtu.be/N1Bg-H9Lpzs)

## Install

*Note:* `*path*` *is the path to this repository.*

### Normal Installation

```
kpackagetool5 --type KWin/Script -i *path*
```

### Local Installation (Advanced)

```
mkdir -p ~/.local/share/kwin/scripts/grid-tiling
cd ~/.local/share/kwin/scripts/grid-tiling
ln -s *path*/contents .
ln -s *path*/metadata.json .
```

*Note: You can replace `ln -s` for `cp`, if you prefer to copy and not have it linked to your cloned repository (if you do this then you're pretty much manually doing what `kpackagetool5` does), using `ln` instead of `cp` will result in an automatic update when you pull the latest changes*

### System Installation

*replace `~/.local/share` for `/usr/share` in Local Installation (Advanced) Method*

## Uninstall

Delete the linked or copied files that you created during installation. To remove installed scripts by `kpackagetool5`, run the same command again but this time with `-r` instead of `-i` to remove (see manual of `kpackagetool5` for more info)

## Functionality
- automatically tile clients, up to any custom grid size per desktop and per screen
  - new clients are first attempted to be added the current desktop and screen, to the column with the most amount of space left
  - the size of the grid (row & column) is supplied in the UI seperated by a comma for every virtual desktop and every screen has it's own list
  - you **must** supply a grid for every virtual desktop and screen, that you have and plan to have (`20` virtual desktops and `10` screens max)
- restriction of minimum space a client can occupy on a virtual desktop, as in the amount of clients this client can share a virtual desktop with
  - a size of `1` is the largest and fully takes up a whole virtual desktop, size of `2` means that it takes up at least half of the virtual desktop and so forth...
  - matching is done by regex and it defaults to the maximum which is the number of rows multiplied by columns of the largest grid
- move clients between virtual desktops (supports the default KWin shortcuts). `Grid-Tiling: Move *Next/Previous* Desktop/Screen` moves the client to the next desktop or screen that has space, prioritizes screen over desktop.
- swap clients within a virtual desktop by dragging them on top with most overlap
- move clients within a virtual desktop, first attempts to move the client if that fails it will fallback to switching.
  - `Grid-Tiling: Swap *Up/Down*`
  - `Grid-Tiling: Move/Swap *Left/Right*`
- dynamically resize clients up to a minimum as defined by `dividerBound`
  - dragging client borders by mouse
  - `Grid-Tiling: *Increase/Decrease/Maximize/Minimize* *Size/Width/Height*` using a step size of `dividerStep` or fully.
- minimization of clients (suppports the default KWin shortcuts)
- minimizes all other clients or unminimizes all clients on the current desktop `Grid-Tiling: Toggle Minimize Desktop`
- toggle gap `Grid-Tiling: Toggle Gap`
- toggle between bordered clients `Grid-Tiling: Toggle Border`
- dynamically float and tile clients `Grid-Tiling: Tile/Float`
- toggle new clients start as tile or float `Grid-Tiling: Toggle Tile`
- close all clients on the current virtual desktop `Grid-Tiling: Close Desktop`
- set margins, gap size, default gap state, default tile state, default border state
- set active clients to show border
- ignore clients by `name` or `caption` regex, these clients are completely ignored and can't be tiled.

*Note: ignored client names do not have to match the whole string, whereas ignored captions do.*

## Recommended Setup
- set window focus policy to `focus follows mouse - mouse precedence`
- set shortcuts `Switch One Desktop *Left/Up/Down/Right*` to `Meta+*Left/Up/Down/Right*`
- set shortcuts `Grid-Tiling: Swap *Up/Down*` to `Meta+Ctrl+*Up/Down*`
- set shortcuts `Grid-Tiling: Move/Swap *Left/Right*` to `Meta+Ctrl+*Left/Right*`
- set shortcuts `Switch To Window *Left/Up/Down/Right*` to `Meta+Alt+*Left/Up/Down/Right*`
- set shortcuts `Grid-Tiling: Move *Previous/Next* Desktop` to `Meta+*Home/End*`
- set shortcuts `Window One Desktop *Down/Up*` to `Meta+*PgDn/PgUp*`

- set shortcut `Grid-Tiling: Toggle Minimize Desktop` to `Meta+M`
- set shortcut `Minimize Window` to `Meta+N`

- set shortcut `Grid-Tiling: Increase Size` to `Meta+=`
- set shortcut `Grid-Tiling: Decrease Size` to `Meta+-`
- set shortcut `Grid-Tiling: Maximize Size` to `Meta++`
- set shortcut `Grid-Tiling: Minimize Size` to `Meta+_`

- set shortcut `Grid-Tiling: Toggle Gap` to `Meta+G`
- set shortcut `Grid-Tiling: Toggle Border` to `Meta+B`

- set shortcut `Grid-Tiling: Toggle Tile` to `Meta+Shift+T`
- set shortcut `Grid-Tiling: Tile/Float` to `Meta+T`

- set shortcut `Grid-Tiling: Close Desktop` to `Meta+Q`
- set shortcut `Close Window` to `Meta+W`

- set shortcut `Grid-Tiling: Refresh` to `Meta+R`

*If you use multiple screens you could also consider using the default shortcuts of KWin `Window To *Previous/Next* *Screen*` to `Meta+*PgDn/PgUp*` to easily move clients between screens*

## Useful To Know
- This version of the script uses the latest KWin API methods. If you're using an older version of KWin, choose the appropriate branch.
- After installing a KWin script you can activate it in the system settings, here you'll also find the configuration button.
- When you adjust the settings in the menu, this script needs to be restarted before the settings are applied. You can do this by turning the script off, apply, turn it back on and apply again or a complete KWin restart (re-log/reboot).
- After updates, some of the shortcuts may have been renamed, but KWin still keeps the old ones registered. To remove the no longer used shortcuts, first disable this script, then go to the shortcuts settings window and use the delete button on the `KWin` application that contains the shortcuts to this script.
- Resizing clients with the mouse can result in weird visual artifacts when dragged outside of the bounds, just use the global shortcut that refreshes the layout.
-  This was made with the intended use of using a set amount of virtual desktops. For the best result make sure you have more virtual desktops than you have clients normally. The script can handle more clients but once all desktops are full, all new clients will start as floating instead of tiling until there is space again to tile new clients.
- I don't use dynamic virtual desktops, but it should be able to deal with it as long as the clients are closed when the virtual desktop is removed.
- In X11 the logout dialog is set to normalWindow, to prevent this from tiling, add `ksmserver-logout-greeter` to the ignored name regex.

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

### Disable geometry memory
1. window management
2. window behavior
3. advanced
4. **uncheck** `Allow KDE apps to remember the positions of their own windows`
