# Kwin Script made by LinG

## Install

### Method 1.
plasmapkg2 --type kwinscript -i tiling-gaps #use -r instead of -i to remove

mkdir -p ~/.local/share/kservices5

ln -sf ~/.local/share/kwin/scripts/tiling-gaps/metadata.desktop ~/.local/share/kservices5/kwin-script-tiling-gaps.desktop

### Method 2.
mkdir /usr/share/kwin/scripts/tiling-gaps

ln -s tiling-gaps/contents /usr/share/kwin/scripts/tiling-gaps/contents

ln -s tiling-gaps/metadata.desktop /usr/share/kwin/scripts/tiling-gaps/metadata.desktop

ln -s tiling-gaps/metadata.desktop /usr/share/kservices5/kwin-script-tiling-gaps.desktop

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
- set shortcut *Tiling-Gaps: Toggle Borders* to *Meta+B*
- set shortcut *Tilin-Gaps: Close Client* to *Meta+W*
- set shortcut *Tiling-Gaps: Close Desktop* to *Meta+Q*
- set shortcut *Tiling-Gaps: Move Next Desktop* to *Meta+End*
- set shortcut *Tiling-Gaps: Move Previous Desktop* to *Meta+Home*
- set shortcut *Tiling-Gaps: Increase Size* to *Meta+=*
- set shortcut *Tiling-Gaps: Decrease Size* to *Meta+-*

## To Do
- make it work for multiple screen setups
- make it work for activities

## Known Issues
- Sometimes when you adjust the settings in the menu, you need to turn the script off, apply it, turn it back on and apply it again to register the new values.
- Some applications do not render correctly on startup sometimes, just use the global shortcut that refreshes the layout
- Maximized clients are not internally remembered so they are brought back to their tiled since when a refresh is called
- Spotify can sometimes not be defined as full or half client, because both the client name and class of spotify are blank (random)
- Not supported by multiple monitors (I don't have more monitors so I can't make it work for multiple monitors but it shouldn't be that hard)
- I don't use activities, so I don't know how this does with activities
