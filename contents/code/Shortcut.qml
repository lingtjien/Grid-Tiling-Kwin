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

  function init() {
    togglers();
    dividers();

    register('Refresh', 'Meta+R', () => {
      //manager.init();
      //layout.render();
      print('---------')
      print('DEBUGGING');
      for (let a in layout.activities) {
        print('---activity---');
        for (let d of layout.activities[a].desktops) {
          print('---desktop---');
          for (let s of d.screens) {
            print('---screen---');
            for (let l of s.lines) {
              print('---line---');
              for (let c of l.clients)
                print(c.name);
            }
          }
        }
      }
    });
  }
}
