import { shared } from 'shared.mjs';
import { config, load } from 'config.mjs';
import { activated, add, remove, start, stop } from 'manager.mjs';

let signals = [];

function connect(signal, callback) {
  signals.push({ signal, callback });
  shared.workspace[signal].connect(callback);
}

export function init(workspace, kwin, timer) {
  shared.workspace = workspace;
  shared.kwin = kwin;
  shared.timer = timer;

  load(kwin.readConfig);

  start();

  connect('windowRemoved', remove);
  connect('windowAdded', add);
  if (config.borderActive) connect('windowActivated', activated);
}

export function destroy() {
  for (const { signal, callback } of signals) shared.workspace[signal].disconnect(callback);
  signals = [];
  stop();
}
