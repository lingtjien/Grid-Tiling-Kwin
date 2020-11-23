.import 'desktop.js' as Desktop;
/* global Desktop:false */

const create = () => ({ // eslint-disable-line no-unused-vars
  desktops: [],
  nclients() {
    return this.desktops.reduce((n, d) => n + d.nclients(), 0);
  },
  addDesktop() {
    if (this.desktops.length < workspace.desktops) {
      const d = Desktop.create();
      this.desktops.push(d);
      return d;
    }
  },
  addClient(client) {
    const start = client.desktop - 1;
    let i = start;
    do {
      while (i >= this.desktops.length) {
        if (!this.addDesktop())
          return;
      }
      const c = this.desktops[i].addClient(client);
      if (c)
        return c;
      if (++i >= workspace.desktops)
        i = 0;
    } while (i !== start);
  },
  removeClient(clientIndex, lineIndex, screenIndex, desktopIndex) {
    // do not remove the desktop to prevent moving of clients when desktops are closed
    return this.desktops[desktopIndex].removeClient(clientIndex, lineIndex, screenIndex);
  },
  moveClient(clientIndex, lineIndex, screenIndex, desktopIndex, i) {
    // desktopIndex = old, i = target desktopIndex
    if (i < 0 || i === desktopIndex)
      return;

    const client = this.desktops[desktopIndex].screens[screenIndex].lines[lineIndex].clients[clientIndex];
    while (i >= this.desktops.length) {
      if (!this.addDesktop())
        return;
    }

    if (this.desktops[i].addClient(client) && this.desktops[desktopIndex].removeClient(clientIndex, lineIndex, screenIndex))
      return client;
  },
  render(activityId) {
    for (const [i, desktop] of this.desktops.entries())
      desktop.render(i, activityId);
  }
});
