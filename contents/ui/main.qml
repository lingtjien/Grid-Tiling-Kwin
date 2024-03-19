import QtQuick;
import org.kde.kwin;

import '../component/main.mjs' as Main;

Item {
  Component.onCompleted: {
    Main.init(Workspace, KWin);
  }

  Component.onDestruction: {
    Main.destroy();
  }
}
