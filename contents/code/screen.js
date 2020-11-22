.import 'line.js' as Line;
/* global Line:false */

const create = () => ({ // eslint-disable-line no-unused-vars
  lines: [],
  dividers: [],
  nclients() {
    return this.lines.reduce((n, l) => n + l.clients.length, 0);
  },
  nminimized() {
    return this.lines.reduce((i, l) => i + (l.nminimized() === l.clients.length), 0);
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
  addClient(client, screenIndex) {
    const max = config.grids[screenIndex];
    let line = this.smallest();
    if (line && line.minSpace() + client.minSpace <= 1 / this.lines.length && line.clients.length < max[0] && (this.lines.length >= max[1] || this.lines.length > line.clients.length)) {
      return line.addClient(client);
    } else if (client.minSpace <= 1 / (this.lines.length + 1) && this.lines.length < max[0]) {
      line = this.addLine();
      if (line)
        return line.addClient(client);
    }
  },
  removeClient(clientIndex, lineIndex) {
    if (this.lines[lineIndex].removeClient(clientIndex)) {
      if (!this.lines[lineIndex].clients.length)
        this.removeLine(lineIndex);
      return true;
    }
  },
  //   swapClient(amount, clientIndex, lineIndex) {
  //     if (lineIndex < 0 || lineIndex >= this.lines.length)
  //       return -1;
  //     var line = this.lines[lineIndex];
  //     if (clientIndex < 0 || clientIndex >= line.clients.length)
  //       return -1;
  //     var client = line.clients[clientIndex];
  //
  //     var i = lineIndex + amount; // target to swap client with
  //     if (i < 0 || i >= this.lines.length)
  //       return -1;
  //     while (this.lines[i].clients.length !== line.clients.length) {
  //       i += amount;
  //       if (i < 0 || i >= this.lines.length)
  //         return this.swapLine(amount, lineIndex);
  //     }
  //     line.clients[clientIndex] = this.lines[i].clients[clientIndex];
  //     this.lines[i].clients[clientIndex] = client;
  //     return 0;
  //   },
  swapLine(lineIndex, amount) {
    const i = lineIndex + amount;
    if (i < 0 || i >= this.lines.length)
      return;
    const line = this.lines[lineIndex];
    this.lines[lineIndex] = this.lines[i];
    this.lines[i] = line;
    return line;
  },
  moveClient(screenIndex, clientIndex, lineIndex, amount) {
    const max = config.grids[screenIndex];
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
  changeDivider(change, lineIndex) {
    // divider between lineIndex and next
    if (lineIndex < this.lines.length - 1)
      this.dividers[lineIndex] = Math.min(Math.max(-config.divider.bound, this.dividers[lineIndex] + change), config.divider.bound);

    // divider between previous and lineIndex
    if (lineIndex > 0)
      this.dividers[lineIndex - 1] = Math.min(Math.max(-config.divider.bound, this.dividers[lineIndex - 1] - change), config.divider.bound);
  },
  render(screenIndex, desktopIndex, activityId) {
    const area = workspace.clientArea(0, screenIndex, desktopIndex + 1);
    const nminimized = this.nminimized();
    const gap = config.gap.show ? config.gap.value : 0;
    const width = (area.width - config.margin.l - config.margin.r - ((this.lines.length - nminimized + 1) * gap)) / (this.lines.length - nminimized); // width per line

    let x = area.x + config.margin.l + gap;
    let current = 0; let previous = 0;
    for (let [i, line] of this.lines.entries()) {
      if (line.nminimized() === line.clients.length)
        continue;

      const divider = i === this.lines.length - 1 || (i < this.lines.length - 1 && this.lines[i + 1].nminimized() === this.lines[i + 1].clients.length) ? 0 : this.dividers[i];

      current = width * divider;
      const w = -previous + width + current;

      line.render(x, w, area.y, area.height, gap, i, screenIndex, desktopIndex, activityId);

      x += w + gap;
      previous = current;
    }
  }
});
