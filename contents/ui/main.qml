import QtQuick;
import org.kde.kwin;

import '../component/main.mjs' as Main;
import '../component/shortcut.mjs' as Shortcut;

Item {
  Component {
    id: timer
    Timer {
      property var callback
      running: true
      repeat: false
      onTriggered: {
        callback();
        destroy();
      }
    }
  }

  Component.onCompleted: {
    Main.init(Workspace, KWin, timer);
  }

  Component.onDestruction: {
    Main.destroy();
  }

  readonly property string prefix: 'Grid Tiling: '

  ShortcutHandler {
    name: prefix + 'Tile/Float'
    text: prefix + 'Tile/Float'
    sequence: 'Meta+T'
    onActivated: Shortcut.tileFloat()
  }

  ShortcutHandler {
    name: prefix + 'Toggle Tile'
    text: prefix + 'Toggle Tile'
    sequence: 'Meta+Shift+T'
    onActivated: Shortcut.toggle.tile()
  }

  ShortcutHandler {
    name: prefix + 'Toggle Gap'
    text: prefix + 'Toggle Gap'
    sequence: 'Meta+G'
    onActivated: Shortcut.toggle.gap()
  }

  ShortcutHandler {
    name: prefix + 'Toggle Border'
    text: prefix + 'Toggle Border'
    sequence: 'Meta+B'
    onActivated: Shortcut.toggle.border()
  }

  ShortcutHandler {
    name: prefix + 'Toggle Minimize Desktop'
    text: prefix + 'Toggle Minimize Desktop'
    sequence: 'Meta+M'
    onActivated: Shortcut.toggle.minimizeDesktop()
  }

  ShortcutHandler {
    name: prefix + 'Increase Size'
    text: prefix + 'Increase Size'
    sequence: 'Meta+='
    onActivated: Shortcut.resize.increase()
  }

  ShortcutHandler {
    name: prefix + 'Decrease Size'
    text: prefix + 'Decrease Size'
    sequence: 'Meta+-'
    onActivated: Shortcut.resize.decrease()
  }

  ShortcutHandler {
    name: prefix + 'Maximize Size'
    text: prefix + 'Maximize Size'
    sequence: 'Meta++'
    onActivated: Shortcut.resize.maximize()
  }

  ShortcutHandler {
    name: prefix + 'Minimize Size'
    text: prefix + 'Minimize Size'
    sequence: 'Meta+_'
    onActivated: Shortcut.resize.minimize()
  }

  ShortcutHandler {
    name: prefix + 'Move Up'
    text: prefix + 'Move Up'
    sequence: 'Meta+Ctrl+Up'
    onActivated: Shortcut.move.up()
  }

  ShortcutHandler {
    name: prefix + 'Move Down'
    text: prefix + 'Move Down'
    sequence: 'Meta+Ctrl+Down'
    onActivated: Shortcut.move.down()
  }

  ShortcutHandler {
    name: prefix + 'Move Left'
    text: prefix + 'Move Left'
    sequence: 'Meta+Ctrl+Left'
    onActivated: Shortcut.move.left()
  }

  ShortcutHandler {
    name: prefix + 'Move Right'
    text: prefix + 'Move Right'
    sequence: 'Meta+Ctrl+Right'
    onActivated: Shortcut.move.right()
  }

  ShortcutHandler {
    name: prefix + 'Close Desktop'
    text: prefix + 'Close Desktop'
    sequence: 'Meta+Q'
    onActivated: Shortcut.closeDesktop()
  }

  ShortcutHandler {
    name: prefix + 'Refresh'
    text: prefix + 'Refresh'
    sequence: 'Meta+R'
    onActivated: Shortcut.refresh()
  }

  ShortcutHandler {
    name: prefix + 'Reset'
    text: prefix + 'Reset'
    sequence: 'Meta+Ctrl+R'
    onActivated: Shortcut.reset()
  }
}
