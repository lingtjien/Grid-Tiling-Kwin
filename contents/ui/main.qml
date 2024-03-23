import QtQuick;
import org.kde.kwin;

import '../component/main.mjs' as Main;

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
}
