import { shared } from 'shared.mjs';
import { add, remove, start, stop } from 'manager.mjs';
import { config, load } from 'config.mjs';

const signals = [];

function connect(signal, callback) {
  signals.push({ signal, callback });
  shared.workspace[signal].connect(callback);
}

export function init(workspace, kwin) {
  shared.workspace = workspace;
  shared.kwin = kwin;

  load(kwin.readConfig);

  start();

  connect('windowRemoved', remove);
  connect('windowAdded', add);

  // for (const method of ['clientMinimized', 'clientUnminimized']) {
  //   connect(method, client => {
  //     const screen = Manager.getScreen(client);
  //     if (screen)
  //       screen.render(client.screenIndex, client.desktopIndex, client.activityId);
  //   });
  // }

  // if (config.borderActive)
  // connect('windowActivated', () => layout.render());

  // shortcut.init();
}

export function destroy() {
  for (const { signal, callback } of signals) shared.workspace[signal].disconnect(callback);
  signals = [];
  stop();
}
