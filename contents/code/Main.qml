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

  function connect(obj, prop, callback) {
    if (!obj.hasOwnProperty('callbacks'))
      obj.callbacks = [];
    obj.callbacks.push({prop, callback});
    obj[prop].connect(callback);
  }
  function disconnect(obj) {
    for (const {prop, callback} of obj.callbacks)
      obj[prop].disconnect(callback);
    delete obj.callbacks;
  }

  Component.onCompleted: {
    manager.init();
    layout.render();

    connect(workspace, 'clientRemoved', client => {
      if (manager.remove(client))
        layout.render();
    });

    connect(workspace, 'clientAdded', client => {
      delay.set(config.delay, () => {
        if (manager.add(client)) {
          layout.render();
          workspace.currentDesktop = client.desktop;
        }
      });
    });

    for (const method of ['clientMinimized', 'clientUnminimized']) {
      connect(workspace, method, client => {
        const screen = manager.getScreen(client);
        if (screen)
          screen.render(client.screenIndex, client.desktopIndex, client.activityId);
      });
    }

    if (config.borderActive)
      connect(workspace, 'clientActivated', () => layout.render());

    shortcut.init();
  }

  Component.onDestruction: {
    disconnect(workspace);
  }
}
