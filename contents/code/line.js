const create = () => ({ // eslint-disable-line no-unused-vars
  clients: [],
  dividers: [],
  nminimized() {
    return this.clients.reduce((n, c) => n + c.minimized, 0);
  },
  minimized() {
    return this.nminimized() === this.clients.length;
  },
  minSpace() {
    return this.clients.reduce((sum, c) => sum + c.minSpace, 0);
  },
  addClient(client) { // the size is the total size of a virtual desktop this column can occupy
    this.clients.push(client);
    client.clientIndex = this.clients.length - 1;
    if (this.clients.length !== 0)
      this.dividers.push(0); // do not add a new divider when the first client is added to the column
    return client;
  },
  removeClient(clientIndex) {
    this.clients.splice(clientIndex, 1);
    if (clientIndex === 0) {
      if (this.dividers.length > 0)
        this.dividers.shift();
    } else {
      this.dividers.splice(clientIndex - 1, 1);
    }
    return true;
  },
  swapClient(amount, clientIndex) {
    const i = clientIndex + amount;
    if (i >= 0 && i < this.clients.length) {
      const client = this.clients[clientIndex];
      this.clients[clientIndex] = this.clients[i];
      this.clients[i] = client;
      return client;
    }
  },
  changeDividerAfter(amount, clientIndex) {
    if (clientIndex < this.clients.length - 1)
      this.dividers[clientIndex] = Math.min(Math.max(-config.divider.bound, this.dividers[clientIndex] + amount), config.divider.bound);
  },
  changeDividerBefore(amount, clientIndex) {
    if (clientIndex > 0)
      this.dividers[clientIndex - 1] = Math.min(Math.max(-config.divider.bound, this.dividers[clientIndex - 1] - amount), config.divider.bound);
  },
  changeDivider(amount, clientIndex) {
    this.changeDividerAfter(amount, clientIndex);
    this.changeDividerBefore(amount, clientIndex);
  },
  render(x, w, areaY, areaHeight, lineIndex, screenIndex, desktopIndex, activityId) {
    const height = config.height(areaHeight, this.clients.length - this.nminimized());

    let y = config.y(areaY);
    let current = 0; let previous = 0;
    for (let [i, client] of this.clients.entries()) {
      if (client.minimized)
        continue;

      const divider = i === this.clients.length - 1 || (i < this.clients.length - 1 && this.clients[i + 1].minimized) ? 0 : this.dividers[i];

      current = height * divider;
      const h = height + current - previous;
      const geometry = Qt.rect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));

      // these properties are used internally only so they must be set first as they are used to check
      client.geometryRender = geometry;
      client.clientIndex = i;
      client.lineIndex = lineIndex;
      client.screenIndex = screenIndex;
      client.desktopIndex = desktopIndex;
      client.activityId = activityId;

      // these properties are from kwin and will thus trigger additional signals, these properties must be set last to prevent the signals that are hooked into this script from triggering before the internal properties have been set
      client.noBorder = config.borderActive && client.active ? false : !config.border;
      client.desktop = desktopIndex + 1; // KWin desktop index starting at 1
      workspace.sendClientToScreen(client, screenIndex);
      client.geometry = geometry;

      y += h + config.gap;
      previous = current;
    }
    return 0;
  }
});
