# Kwin Script made by LinG

Install using:
plasmapkg2 --type kwinscript -i tiling-gaps

Uninstall using:
plasmapkg2 --type kwinscript -r tiling-gaps

## Intro

![](example/tiling-gaps.mp4)

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
- also works for applications which enforce their own geometry on startup
- allows to add to ignored lists (clients, captions) defined by *ignoredClients* and *ignoredCaptions*

* Note: ignored clients does not have to be an exact match, whereas ignored captions do.
* Note: internal virtual desktops are defined inside the script and are not the same as the actual virtual desktop. If you fill all your virtual desktops and create a new client than a new layer will be made, which contains a virtual desktop which is different from the one in the layer underneath it.

## Recommended Setup
- set window focus policy to *focus follows mouse - mouse precedence*
- set shortcuts move between virtual desktops to *Meta+Arrows*
- set shortcuts *Tiling-Gaps: Switch* to *Meta+Alt+Arrows*
- set shortcut *Tiling-Gaps: Toggle Opacity* to *Meta+O*
- set shortcut *Tiling-Gaps: Toggle Borders* to *Meta+P*
- set shortcut *Tilin-Gaps: Close Client* to *Meta+W*
- set shortcut *Tiling-Gaps: Close Desktop* to *Meta+Q*
- set shortcut *Tiling-Gaps: Move Next Desktop* to *Meta+End*
- set shortcut *Tiling-Gaps: Move Previous Desktop* to *Meta+Home*
- set shortcut *Tiling-Gaps: Increase Size* to *Meta+=*
- set shortcut *Tiling-Gaps: Decrease Size* to *Meta+-*
