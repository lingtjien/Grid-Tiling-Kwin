import QtQuick 2.0

Item {
  readonly property string prefix: 'Grid-Tiling: '

  function register(name, shortcut, method) {
    KWin.registerShortcut(prefix + name, prefix + name, shortcut, method);
  }

  function togglers() {
    register('Tile/Float', 'Meta+T', () => {
      if (manager.toggle(workspace.activeClient))
        layout.render();
    });

    register('Toggle Tile', 'Meta+Shift+T', () => {
      config.tile = !config.tile;
    });

    register('Toggle Gap', 'Meta+G', () => {
      config.gapShow = !config.gapShow;
      layout.render();
    });

    register('Toggle Border', 'Meta+B', () => {
      config.border = !config.border;
      layout.render();
    });

    register('Toggle Minimize Desktop', 'Meta+M', () => {
      const screen = manager.getActiveScreen();
      if (screen) {
        const minimize = screen.nclients() - screen.nminimizedClients() > 1;
        for (const line of screen.lines) {
          for (const client of line.clients)
            client.minimized = minimize;
        }
      }
    });
  }

  function dividers() {
    for (const [suffix, horizontal, vertical] of [
      ['Size', true, true],
      ['Width', true, false],
      ['Height', false, true]
    ]) {
      for (const [prefix, shortcut, amount] of [
        ['Increase', 'Meta+=', config.divider.step],
        ['Decrease', 'Meta+-', -config.divider.step],
        ['Maximize', 'Meta++', config.divider.bound],
        ['Minimize', 'Meta+_', -config.divider.bound]
      ]) {
        register(prefix + ' ' + suffix, shortcut, () => {
          const client = workspace.activeClient;
          const screen = manager.getScreen(client);
          if (screen) {
            if (vertical)
              screen.lines[client.lineIndex].changeDivider(amount, client.clientIndex);
            if (horizontal)
              screen.changeDivider(amount, client.lineIndex);
            screen.render(client.screenIndex, client.desktopIndex, client.activityId);
          }
        });
      }
    }
  }

  function moveSwap() {
    for (const [text, shortcut, amount] of [
      ['Swap Up', 'Meta+Ctrl+Up', -1],
      ['Swap Down', 'Meta+Ctrl+Down', 1]
    ]) {
      register(text, shortcut, () => {
        const client = workspace.activeClient;
        const screen = manager.getScreen(client);
        if (screen && screen.lines[client.lineIndex].swapClient(amount, client.clientIndex))
          screen.render(client.screenIndex, client.desktopIndex, client.activityId);
      });
    }

    for (const [text, shortcut, amount] of [
      ['Move/Swap Left', 'Meta+Ctrl+Left', -1],
      ['Move/Swap Right', 'Meta+Ctrl+Right', 1]
    ]) {
      register(text, shortcut, () => {
        const client = workspace.activeClient;
        const screen = manager.getScreen(client);
        if (screen && (screen.moveClient(amount, client.clientIndex, client.lineIndex, client.screenIndex, client.desktopIndex) || screen.swapLine(amount, client.lineIndex)))
          screen.render(client.screenIndex, client.desktopIndex, client.activityId);
      });
    }
  }

  function init() {
    togglers();
    dividers();
    moveSwap();

    register('Close Desktop', 'Meta+Q', () => {
      for (const client of Object.values(workspace.clientList())) {
        if (client && client.screen === workspace.activeScreen && client.desktop === workspace.currentDesktop && (client.activities.length === 0 || client.activities.includes(workspace.currentActivity)))
          client.closeWindow();
      }
    });

    register('Refresh', 'Meta+R', () => {
      manager.init();
      layout.render();
    });
  }
}
