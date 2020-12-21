.import 'screen.js' as Screen;
/* global Screen:false */

const create = () => ({ // eslint-disable-line no-unused-vars
  screens: [],
  nclients() {
    return this.screens.reduce((n, s) => n + s.nclients(), 0);
  },
  addScreen() {
    if (this.screens.length < workspace.numScreens) {
      const s = Screen.create();
      this.screens.push(s);
      return s;
    }
  },
  addClient(client, desktopIndex) {
    const start = client.screen;
    let i = start;
    do {
      while (i >= this.screens.length) {
        if (!this.addScreen())
          return;
      }
      const c = this.screens[i].addClient(client, i, desktopIndex);
      if (c)
        return c;
      if (++i >= workspace.numScreens)
        i = 0;
    } while (i !== start);
  },
  removeClient(clientIndex, lineIndex, screenIndex) {
    // do not remove the screen to prevent moving of clients when screens are closed
    return this.screens[screenIndex].removeClient(clientIndex, lineIndex);
  },
  moveClient(i, clientIndex, lineIndex, screenIndex, desktopIndex) {
    // screenIndex = old, i = target screenIndex
    if (i < 0 || i === screenIndex)
      return;
    const client = this.screens[screenIndex].lines[lineIndex].clients[clientIndex];
    while (i >= this.screens.length) {
      if (!this.addScreen())
        return;
    }
    if (this.screens[i].addClient(client, screenIndex, desktopIndex) && this.screens[screenIndex].removeClient(clientIndex, lineIndex))
      return client;
  },
  render(desktopIndex, activityId) {
    for (const [i, screen] of this.screens.entries())
      screen.render(i, desktopIndex, activityId);
  }
});
