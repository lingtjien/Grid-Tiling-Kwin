import QtQuick 2.0

Item {
  Delay {
    id: delay
  }

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
  function connectSave(obj, prop, callback) {
    obj[prop + saveName] = callback;
    obj[prop].connect(callback);
  }
  function disconnectRemove(obj, prop) {
    obj[prop].disconnect(obj[prop + saveName]);
    delete obj[prop + saveName];
  }

  Component.onCompleted: {
    manager.init();
    layout.render();

    connectSave(workspace, 'clientRemoved', client => {
      if (manager.remove(client))
        layout.render();
    });

    connectSave(workspace, 'clientAdded', client => {
      delay.set(config.delay, () => {
        if (manager.add(client)) {
          layout.render();
          workspace.currentDesktop = client.desktop;
        }
      });
    });

    for (const method of ['clientMinimized', 'clientUnminimized']) {
      connectSave(workspace, method, client => {
        const screen = manager.getScreen(client);
        if (screen)
          screen.render(client.screenIndex, client.desktopIndex, client.activityId);
      });
    }

    shortcut.init();
  }

  Component.onDestruction: {
    for (const method of ['clientMinimized', 'clientUnminimized'])
      disconnectRemove(workspace, method);
    disconnectRemove(workspace, 'clientAdded');
    disconnectRemove(workspace, 'clientRemoved');
  }
}
