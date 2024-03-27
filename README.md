# Kwin Grid-Tiling Script

[![](https://img.youtube.com/vi/N1Bg-H9Lpzs/maxresdefault.jpg)](https://youtu.be/N1Bg-H9Lpzs)

## Install

```
mkdir -p ~/.local/share/kwin/scripts/grid-tiling
cd ~/.local/share/kwin/scripts/grid-tiling
ln -s <path>/contents
ln -s <path>/metadata.json
```

- `<path>` is the path to this repository.
- in order to uninstall, delete the linked or copied files that you created during installation
- to install script system wide, do the process for `/usr/share` instead of `~/.local/share`
- `kpackagetool6` is at this moment of writing broken and unable to install declarative kwin scripts without a `main.js`

## Functionality

- automatically tile windows, up to any custom grid size per desktop and per screen
  - new windows are first attempted to be added to the desktop and screen that the application itself set
  - insufficient space will result in the script automatically trying other screens first before trying other desktops, ultimately resorting to not tiling the new window if none have any space.
- grid size can be configured on a per screen basis using a comma separated list of integers in the configuration user interface
  - screen rows and columns defines the defaults per screen, example: `rows=2,2` and `colums=2,3` results `screen 1: 2x2`, `screen 2: 2x3`
  - rows and columns for screens that were not defined will default to the first element
  - desktop rows, columns and names define overrides based on matching the desktop name using regex
- moving windows within a grid done by drag and drop and global shortcuts
- restriction of minimum space a window can occupy on a desktop, as in the amount of windows this window can share a desktop with, matching based on regex
  - a size of `1` is the largest and fully takes up a desktop, size of `2` means that it takes up at least half of the virtual desktop and so forth...
- settings for many variables: gap, border, tiling, etc... and global shortcuts for toggling them
- supports native KWin signals
  - movement of windows between desktops, screens and activities
  - resizing of windows, provides additional global shortcuts
  - minimization of windows, provides additional global shortcut to toggle for all windows on a desktop
- blacklist and whitelist windows from tiling by matching regex

## Recommended Setup

| Action                               | Shortcut        |
| ------------------------------------ | --------------- |
| Window to Next Desktop               | Meta+End        |
| Window to Previous Desktop           | Meta+Home       |
| Switch to Next Desktop               | Meta+Right      |
| Switch to Previous Desktop           | Meta+Left       |
| Toggle Overview                      | Meta+Space      |
| Move Window to Next Screen           | Meta+PgUp       |
| Move Window to Previous Screen       | Meta+PgDown     |
| Switch to Next Screen                | Meta+Up         |
| Switch to Previous Screen            | Meta+Down       |
| Grid Tiling: Move Left               | Meta+Ctrl+Left  |
| Grid Tiling: Move Right              | Meta+Ctrl+Right |
| Grid Tiling: Move Up                 | Meta+Ctrl+Up    |
| Grid Tiling: Move Down               | Meta+Ctrl+Down  |
| Switch to Window Left                | Meta+Alt+Left   |
| Switch to Window Right               | Meta+Alt+Right  |
| Switch to Window Above               | Meta+Alt+Up     |
| Switch to Window Below               | Meta+Alt+Down   |
| Grid Tiling: Increase Size           | Meta+=          |
| Grid Tiling: Decrease Size           | Meta+-          |
| Grid Tiling: Maximize Size           | Meta++          |
| Grid Tiling: Minimize Size           | Meta+\_         |
| Grid Tiling: Tile/Float              | Meta+T          |
| Grid Tiling: Toggle Gap              | Meta+G          |
| Grid Tiling: Toggle Border           | Meta+B          |
| Minimize Window                      | Meta+N          |
| Grid Tiling: Toggle Minimize Desktop | Meta+M          |
| Window Operations Menu               | Meta+`          |
| Grid Tiling: Refresh                 | Meta+R          |
| Grid Tiling: Reset                   | Meta+Ctrl+R     |
| Close Window                         | Meta+W          |
| Grid Tiling: Close Desktop           | Meta+Q          |

## Additional Info & Tips

- this version of the script uses the latest KWin API methods. If you're using an older version of KWin, choose the appropriate branch
- after installing a KWin script you can activate it in the system settings, here you'll also find the configuration button
- when you adjust the settings in the menu, this script needs to be restarted before the settings are applied. You can do this by turning the script off, apply, turn it back on and apply again or a complete KWin restart (re-log/reboot)
- after updates, some of the shortcuts may have been renamed, but KWin still keeps the old ones registered. To remove the no longer used shortcuts, first disable this script, then go to the shortcuts settings window and use the delete button on the `KWin` application that contains the shortcuts to this script. Restart KWin and then activate the script again and the old unused shortcuts should now all be gone
- script assumes that the amount of desktops does not change. For the best result make sure you have more virtual desktops than you have windows normally. The script can handle more windows but once all desktops and screens are full, all new windows will start as floating instead of tiling until there is space again to tile new windows
- name matching is performed using the javascript `RegExp` class which is build using the string that the user provides and then the `test` method is used on the window class (application) property (equivalent JS code `RegExp(config).test(window.resourceName)`). You can find the value for these properties on a window by opening the Windows Operations Menu (there is a global shortcut for this). For some examples check out the min space section of the configuration interface
- If you never plan on using multiple screens you could also consider repurposing the KWin shortcuts for moving windows between screens to desktops instead. So you have more flexibility to move windows between the grid of desktops, while sacrificing the shortcuts that allow you to move them between screens
- Logging can be obtained from your system log, for example in wayland using `journalctl _COMM=kwin_wayland`

---

[![](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/donate/?hosted_button_id=BUNHJLSFY78PC)