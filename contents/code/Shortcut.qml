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
      config.gap.show = !config.gap.show;
      layout.render();
    });

    register('Toggle Border', 'Meta+B', () => {
      config.border = !config.border;
      layout.render();
    });
  }

  function dividers() {
    for (let [text, shortcut, amount] of [
      ['Increase Step', 'Meta+=', config.divider.step],
      ['Decrease Step', 'Meta+-', -config.divider.step],
      ['Increase Max', 'Meta++', config.divider.bound],
      ['Decrease Max', 'Meta+_', -config.divider.bound]
    ]) {
      register(text, shortcut, () => {
        let client = workspace.activeClient;
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
        let client = workspace.activeClient;
        const screen = manager.getScreen(client);
        if (screen && screen.lines[client.lineIndex].swapClient(client.clientIndex, amount))
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
