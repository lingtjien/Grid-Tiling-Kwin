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
  //   moveClient(targetIndex, clientIndex, lineIndex, screenIndex, desktopIndex) {
  //     if (desktopIndex < 0 || desktopIndex >= this.desktops.length || targetIndex < 0 || targetIndex === desktopIndex)
  //       return -1;
  //
  //     var client = this.desktops[desktopIndex].screens[screenIndex].columns[lineIndex].clients[clientIndex];
  //     while (targetIndex >= this.desktops.length) {
  //       if (this.addDesktop() === -1)
  //         return -1;
  //     }
  //
  //     if (this.desktops[targetIndex].addClient(client) === -1)
  //       return -1;
  //     return this.desktops[desktopIndex].removeClient(clientIndex, lineIndex, screenIndex);
  //   },
  render(activityId) {
    for (const [i, desktop] of this.desktops.entries())
      desktop.render(i, activityId);
  }
});
