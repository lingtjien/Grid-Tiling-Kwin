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
  addClient(client) {
    const start = client.screen;
    let i = start;
    do {
      while (i >= this.screens.length) {
        if (!this.addScreen())
          return;
      }
      const c = this.screens[i].addClient(client, config.grids[i][0], config.grids[i][1]);
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
  //   moveClient(targetIndex, clientIndex, lineIndex, screenIndex) {
  //     if (screenIndex < 0 || screenIndex >= this.screens.length || targetIndex < 0 || targetIndex === screenIndex)
  //       return -1;
  //
  //     var client = this.screens[screenIndex].columns[lineIndex].clients[clientIndex];
  //     while (targetIndex >= this.screens.length) {
  //       if (this.addScreen(Screen.create()) === -1)
  //         return -1;
  //     }
  //
  //     if (this.screens[targetIndex].addClient(client) === -1)
  //       return -1;
  //     return this.screens[screenIndex].removeClient(clientIndex, lineIndex);
  //   },
  render(desktopIndex, activityId) {
    for (const [i, screen] of this.screens.entries())
      screen.render(i, desktopIndex, activityId);
  }
});
