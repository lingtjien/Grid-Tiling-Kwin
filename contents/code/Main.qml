import QtQuick 2.0

Item {
  Config {
    id: config
  }

  Layout {
    id: layout
  }

  Manager {
    id: manager
  }

  Shortcut {
    id: shortcut
  }

  function clientActivated(client) { // clientAdded does not work for a lot of clients
    if (manager.add(client)) {
      layout.render();
      workspace.currentDesktop = client.desktop;
    }
  }

  function clientRemoved(client) {
    if (manager.remove(client))
      layout.render();
  }

  Component.onCompleted: {
    manager.init();
    layout.render();

    workspace.clientActivated.connect(clientActivated);
    workspace.clientRemoved.connect(clientRemoved);

    shortcut.init();
  }

  Component.onDestruction: {
    workspace.clientActivated.disconnect(clientActivated);
    workspace.clientRemoved.disconnect(clientRemoved);
  }
}
