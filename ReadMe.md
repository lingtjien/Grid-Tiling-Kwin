# Kwin Script made by LinG

## Install

### Method 1. Local Installation
*Note: You can replace ln for cp, if you prefer to copy and not have it linked to your cloned repository*
- mkdir -p ~/.local/share/kwin/scripts/tiling-gaps
- ln -s contents ~/.local/share/kwin/scripts/tiling-gaps/contents
- ln -s metadata.desktop ~/.local/share/kwin/scripts/tiling-gaps/metadata.desktop
- mkdir -p ~/.local/share/kservices5
- ln -s metadata.desktop ~/.local/share/kservices5/kwin-script-tiling-gaps.desktop

### Method 2. System Installation
*replace ~/.local/share for /usr/share* in Method 1

## Preview
![](preview/tiling-gaps.mp4)

## Functionality
- allows to set margins as defined by *topMargin* *bottomMargin* *leftMargin* *rightMargin*
- allows to set the gap size as defined by *gap*
- allows to adjust the opacity as defined by *opacity*
- allows to adjust default opacity toggle *noOpacity*
- allows to adjust default borders toggle *noBorders*
- automatically tile windows, up to a maximum of 4 clients per (internal) virtual desktop
- allows the restriction of minimum tile size of certain clients (full/half clients lists) as defined by *fullClients* and *halfClients*
- allows to switch between transparant clients (global shortcut)
- allows to switch between bordered clients (global shortcut)
- offers global shortcuts to move clients, both between virtual desktops and inside a virtual desktop
- offers global shortcuts to close a client, or all clients on that (internal) virtual desktop
- allows to dynamically resize windows up to a minimum as defined by *dividerBounds*
- allows to dynamically resize windows using global shortcuts and user handling
- allows to switch windows by dragging them outside of their own size defined by *moveThreshold*
- also works for applications which enforce their own geometry on startup (most of the time)
- allows to maximize client (with gaps) by global shortcut
- allows to add to ignored lists (clients, captions) defined by *ignoredClients* and *ignoredCaptions*

*Note: ignored clients does not have to be an exact match, whereas ignored captions do.*

*Note: internal virtual desktops are defined inside the script and are not the same as the actual virtual desktop. If you fill all your virtual desktops and create a new client than a new layer will be made, which contains a virtual desktop which is different from the one in the layer underneath it.*

## Recommended Setup
- set window focus policy to *focus follows mouse - mouse precedence*
- set shortcuts move between virtual desktops to *Meta+Arrows*
- set shortcuts *Tiling-Gaps: Switch* to *Meta+Alt+Arrows*
- set shortcut *Tiling-Gaps: Toggle Opacity* to *Meta+O*
- set shortcut *Tiling-Gaps: Toggle Borders* to *Meta+P*
- set shortcut *Close Window* to *Meta+W*
- set shortcut *Tiling-Gaps: Close Desktop* to *Meta+Q*
- set shortcut *Tiling-Gaps: Maximize* to *Meta+M*
- set shortcut *Tiling-Gaps: Refresh (Minimize)* to *Meta+N*
- set shortcut *Tiling-Gaps: Move Next Desktop* to *Meta+End*
- set shortcut *Tiling-Gaps: Move Previous Desktop* to *Meta+Home*
- set shortcut *Tiling-Gaps: Increase Size* to *Meta+=*
- set shortcut *Tiling-Gaps: Decrease Size* to *Meta+-*

## Known Issues
- Sometimes when you adjust the settings in the menu, you need to turn the script off, apply it, turn it back on and apply it again to register the new values (or just re-log).
- Some applications do not render correctly on startup sometimes, just use the global shortcut that refreshes the layout
- Maximized clients are not internally remembered so they are brought back to their tiled size when a refresh is called (not just the global shortcut)
- Spotify can sometimes not be defined as full or half client, because both the client name and class of spotify are blank (random)
- I don't use activities, so I don't know how this does with activities.
- I don't use dynamic virtual desktops, no idea what happends. This was made with the intended use of using a set amount of virtual desktops.

## To Do
- add support for activities (check this commit: ca244ba0dca1d933eb1329d49450603a0f540b65 and do it similarly but with the layer class instead of the desktop class)
