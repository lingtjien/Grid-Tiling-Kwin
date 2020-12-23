.import 'line.js' as Line;
/* global Line:false */

const create = () => ({ // eslint-disable-line no-unused-vars
  lines: [],
  dividers: [],
  nclients() {
    return this.lines.reduce((n, l) => n + l.clients.length, 0);
  },
  nminimizedClients() {
    return this.lines.reduce((n, l) => n + l.nminimized(), 0);
  },
  nminimized() { // not total number of minimized clients in screen
    return this.lines.reduce((n, l) => n + l.minimized(), 0);
  },
  addLine(index) {
    if (this.lines.some(l => l.minSpace() > 1 / (this.lines.length + 1))) // check if adding a new line won't decrease the size of the clients inside any of the existing lines below their minSpace
      return;

    const l = Line.create();
    if (index === undefined) {
      this.lines.push(l);
      if (this.lines.length > 1)
        this.dividers.push(0);
    } else {
      this.lines.splice(index, 0, l);
      if (this.lines.length > 1)
        this.dividers.splice(index, 0, 0);
    }
    return l;
  },
  removeLine(index) {
    this.lines.splice(index, 1);
    if (index === 0) {
      if (this.dividers.length > 0)
        this.dividers.shift();
    } else {
      this.dividers.splice(index - 1, 1);
    }
  },
  smallest() {
    return this.lines.reduce((c, l) => c ? (l.minSpace() < c.minSpace() ? l : c) : l, undefined);
  },
  addClient(client, screenIndex, desktopIndex) {
    const max = config.grid[screenIndex][desktopIndex];
    let line = this.smallest();
    if (line && line.minSpace() + client.minSpace <= 1 / this.lines.length && line.clients.length < max[0] && (this.lines.length >= max[1] || this.lines.length > line.clients.length)) {
      if (line.addClient(client)) {
        client.lineIndex = line.length - 1;
        return client;
      }
    } else if (client.minSpace <= 1 / (this.lines.length + 1) && this.lines.length < max[1]) {
      line = this.addLine();
      if (line && line.addClient(client)) {
        client.lineIndex = line.length - 1;
        return client;
      }
    }
  },
  removeClient(clientIndex, lineIndex) {
    if (this.lines[lineIndex].removeClient(clientIndex)) {
      if (!this.lines[lineIndex].clients.length)
        this.removeLine(lineIndex);
      return true;
    }
  },
  swapLine(amount, lineIndex) {
    const i = lineIndex + amount;
    if (i >= 0 && i < this.lines.length) {
      const line = this.lines[lineIndex];
      this.lines[lineIndex] = this.lines[i];
      this.lines[i] = line;
      return line;
    }
  },
  moveClient(amount, clientIndex, lineIndex, screenIndex, desktopIndex) {
    const max = config.grid[screenIndex][desktopIndex];
    const line = this.lines[lineIndex];
    const client = line.clients[clientIndex];

    let i = lineIndex + amount;
    while (i >= 0 && i < this.lines.length && (this.lines[i].minSpace() + client.minSpace > 1 / this.lines.length || this.lines[i].clients.length >= max[0]))
      i += amount;

    if (i >= 0 && i < this.lines.length) {
      this.lines[i].addClient(client);
      this.removeClient(clientIndex, lineIndex);
      return client;
    } else if (this.lines.length < max[1]) {
      const front = amount < 0;
      const l = this.addLine(front ? 0 : undefined);
      if (l) {
        l.addClient(client);
        this.removeClient(clientIndex, lineIndex + front);
        return client;
      }
    }
  },
  changeDividerAfter(amount, lineIndex) {
    if (lineIndex < this.lines.length - 1)
      this.dividers[lineIndex] = Math.min(Math.max(-config.divider.bound, this.dividers[lineIndex] + amount), config.divider.bound);
  },
  changeDividerBefore(amount, lineIndex) {
    if (lineIndex > 0)
      this.dividers[lineIndex - 1] = Math.min(Math.max(-config.divider.bound, this.dividers[lineIndex - 1] - amount), config.divider.bound);
  },
  changeDivider(amount, lineIndex) {
    this.changeDividerAfter(amount, lineIndex);
    this.changeDividerBefore(amount, lineIndex);
  },
  render(screenIndex, desktopIndex, activityId) {
    const area = workspace.clientArea(0, screenIndex, desktopIndex + 1);
    const width = config.width(area.width, this.lines.length - this.nminimized());

    let x = config.x(area.x);
    let current = 0; let previous = 0;
    for (let [i, line] of this.lines.entries()) {
      if (line.minimized())
        continue;

      const divider = i === this.lines.length - 1 || (i < this.lines.length - 1 && this.lines[i + 1].minimized()) ? 0 : this.dividers[i];

      current = width * divider;
      const w = -previous + width + current;

      line.render(x, w, area.y, area.height, i, screenIndex, desktopIndex, activityId);

      x += w + config.gap;
      previous = current;
    }
  }
});
