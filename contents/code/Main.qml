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

  readonly property string saveName: 'Callback'
  function connectSave(object, prop, callback) {
    object[prop + saveName] = callback;
    object[prop].connect(callback);
  }
  function disconnectRemove(object, prop) {
    object[prop].disconnect(object[prop + saveName]);
    delete object[prop + saveName];
  }

  Component.onCompleted: {
    manager.init();
    layout.render();

    connectSave(workspace, 'clientActivated', client => {
      if (manager.add(client)) {
        layout.render();
        workspace.currentDesktop = client.desktop;
      }
    });

    connectSave(workspace, 'clientRemoved', client => {
      if (manager.remove(client))
        layout.render();
    });

    shortcut.init();
  }

  Component.onDestruction: {
    disconnectRemove(workspace, 'clientActivated');
    disconnectRemove(workspace, 'clientRemoved');
  }
}
