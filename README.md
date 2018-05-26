# Kwin Script That Automatically Tiles Windows

## Install

Normal Installation

```
plasmapkg2 --type kwinscript -i *Name of this directory*
mkdir -p ~/.local/share/kservices5
cd ~/.local/share/kservices5
ln -s ../kwin/scripts/grid-tiling/metadata.desktop kwin-script-grid-tiling.desktop 
```

Local Installation (Advanced)

```
mkdir -p ~/.local/share/kwin/scripts/grid-tiling
cd ~/.local/share/kwin/scripts/grid-tiling
ln -s *path*/contents contents
ln -s *path*/metadata.desktop metadata.desktop
mkdir -p ~/.local/share/kservices5
ln -s ../kwin/scripts/grid-tiling/metadata.desktop kwin-script-grid-tiling.desktop 
```

*Note: `*path*` is the path to where you cloned the repository (the directory where this file is).*
*Note: You can replace `ln -s` for `cp`, if you prefer to copy and not have it linked to your cloned repository (if you do this then you're pretty much manually doing what `plasmapkg2` does), using `ln` instead of `cp` will result in an automatic update when you pull the latest changes*

System Installation

*replace ~/.local/share for /usr/share* in Local Installation (Advanced) Method

## Uninstall  

Delete the linked or copied files that you created during installation. To remove installed scripts by `plasmapkg2`, run the same command again but this time with `-r` instead of `-i` to remove (see manual of `plasmapkg2` for more info)

## Preview
![](preview/tiling-gaps.gif)

## Functionality
- allows to set margins as defined by `topMargin` `bottomMargin` `leftMargin` `rightMargin`
- allows to set the gap size as defined by `gap`
- allows to adjust the opacity as defined by `opacity`
- allows to adjust default opacity toggle `noOpacity`
- allows to adjust default borders toggle `noBorders`
- automatically tile windows, up to any grid size of clients per (internal) virtual desktop, new clients are first attempted to be added to your current desktop, to the column with the least number of clients.
- allows the restriction of minimum tile size of certain clients
- allows to switch between transparant clients (global shortcut)
- allows to switch between bordered clients (global shortcut)
- offers global shortcuts to move clients, both between virtual desktops and inside a virtual desktop
- offers global shortcuts to close all clients on a virtual desktop
- allows to dynamically resize windows up to a minimum as defined by `dividerBounds`
- allows to dynamically resize windows using global shortcuts and user handling
- allows to switch windows by dragging them outside of their own size defined by `moveThreshold`
- also works for applications which enforce their own geometry on startup (most of the time)
- allows to maximize client (with gaps) by global shortcut
- allows to add to ignored lists (clients, captions) defined by `ignoredClients` and `ignoredCaptions`

*Note: ignored clients does not have to be an exact match, whereas ignored captions do.*

*Note: internal virtual desktops are defined inside the script and are not the same as the actual virtual desktop. If you fill all your virtual desktops and create a new client than a new layer will be made, which contains a virtual desktop which is different from the one in the layer underneath it.*

## Recommended Setup
- set window focus policy to `focus follows mouse - mouse precedence`
- set shortcuts `Switch One Desktop *direction*` to `Meta+*Left/Up/Down/Right*`
- set shortcuts `Grid-Tiling: Switch *direction*` to `Meta+Alt+*Left/Up/Down/Right*`
- set shortcuts `Grid-Tiling: Move *direction* Desktop` to `Meta+*Home/PgUp/PgDn/End*`
- set shortcut `Grid-Tiling: Toggle Opacity` to `Meta+O`
- set shortcut `Grid-Tiling: Toggle Borders` to `Meta+P`
- set shortcut `Close Window` to `Meta+W`
- set shortcut `Grid-Tiling: Close Desktop` to `Meta+Q`
- set shortcut `Grid-Tiling: Maximize` to `Meta+M`
- set shortcut `Grid-Tiling: Refresh (Minimize)` to `Meta+N`
- set shortcut `Grid-Tiling: Increase Size` to `Meta+=`
- set shortcut `Grid-Tiling: Decrease Size` to `Meta+-`

## Hiding Window Title Bars
1. System Settings
2. Application Style
3. Window Decorations
4. Your Theme
5. Window Specific Overrides
6. Add
7. **check** `Hide window title bar`
8. `Regular expression to match` = `.*`

## Known Issues
- If you have kwin shortcuts added by the script that you no longer need or use (because they got renamed to something else for example), then you can delete the old unused shortcuts by first selecting kwin in the global shortcuts menu and then pressing the `remove the selected component` button (hover mouse over the button to see the text).
- Sometimes when you adjust the settings in the menu, you need to turn the script off, apply it, turn it back on and apply it again to register the new values (or just re-log).
- Some applications do not render correctly on startup sometimes, just use the global shortcut that refreshes the layout
- Maximized clients are not internally remembered so they are brought back to their tiled size when a refresh is called (not just the global shortcut).
- Spotify can sometimes not be defined as full or half client, because both the client name and class of spotify are blank (random)
- Dynamically resizing windows with the mouse can result in weird visual artifacts when dragged outside of the bounds, just use the global shortcut that refreshes the layout.
- I don't use activities, so I don't know how this does with activities.
- I don't use dynamic virtual desktops, no idea what happends. This was made with the intended use of using a set amount of virtual desktops.

## To Do
- add support for activities (check this commit: ca244ba0dca1d933eb1329d49450603a0f540b65 and do it similarly but with the layer class instead of the desktop class)
