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

    register('Toggle Maximize/Tiling Desktop', 'Meta+Z', () => {
      const client = workspace.activeClient;
      const screen = manager.getScreen(client);
      if (screen) {
        // activeClient is managed by grid-tiling
        const minimize = screen.nclients() - screen.nminimizedClients() > 1;
        for (const line of screen.lines) {
          for (const cli of line.clients)
            if (cli != client)
              cli.minimized = minimize;
        }
      } else {
        // activeClient is managed by system
        const aScreen = manager.getActiveScreen();
        const minimize = aScreen.nclients() - aScreen.nminimizedClients() >= 1;
        for (const line of aScreen.lines) {
          for (const cli of line.clients)
            cli.minimized = minimize;
        }
        client.setMaximize(minimize, minimize);
      }
    });
  }

  function dividers() {
    for (const [text, shortcut, amount] of [
      ['Increase Step', 'Meta+=', config.divider.step],
      ['Decrease Step', 'Meta+-', -config.divider.step],
      ['Increase Max', 'Meta++', config.divider.bound],
      ['Decrease Max', 'Meta+_', -config.divider.bound]
    ]) {
      register(text, shortcut, () => {
        const client = workspace.activeClient;
        const screen = manager.getScreen(client);
        if (screen) {
          screen.lines[client.lineIndex].changeDivider(amount, client.clientIndex);
          screen.changeDivider(amount, client.lineIndex);
          screen.render(client.screenIndex, client.desktopIndex, client.activityId);
        }
      });
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

    for (const [text, shortcut, amount] of [
      ['Move Next Desktop/Screen', 'Meta+End', 1],
      ['Move Previous Desktop/Screen', 'Meta+Home', -1]
    ]) {
      register(text, shortcut, () => {
        const client = workspace.activeClient;
        if (!client || manager.ignored(client))
          return;
        const last = workspace.numScreens - 1;
        const i = client.screen + amount;
        if (i >= 0 && i < last) {
          workspace.sendClientToScreen(client, i);
        } else if (i < 0) {
          workspace.sendClientToScreen(client, last);
          client.desktop = client.desktop > 1 ? client.desktop - 1 : client.desktop = workspace.desktops;
        } else {
          workspace.sendClientToScreen(client, 0);
          client.desktop = client.desktop < workspace.desktops ? client.desktop + 1 : 1;
        }

        delay.set(config.delay, () => {
          workspace.currentDesktop = client.desktop;
        });
      })
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
