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
  addClient(client, maxRows, maxCols) {
    let line = this.smallest();
    if (line && line.minSpace() + client.minSpace <= 1 / this.lines.length && line.clients.length < maxRows && (this.lines.length >= maxCols || this.lines.length > line.clients.length)) {
      return line.addClient(client);
    } else if (client.minSpace <= 1 / (this.lines.length + 1) && this.lines.length < maxCols) {
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
  //   swapLine(amount, lineIndex) {
  //     if (lineIndex < 0 || lineIndex >= this.lines.length)
  //       return -1;
  //     var line = this.lines[lineIndex];
  //     var i = lineIndex + amount; // target to swap client with
  //     if (i < 0 || i >= this.lines.length)
  //       return -1;
  //     this.lines[lineIndex] = this.lines[i];
  //     this.lines[i] = line;
  //     return 0;
  //   },
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
  //   moveClient(amount, maxRows, maxLines, clientIndex, lineIndex) {
  //     if (lineIndex < 0 || lineIndex >= this.lines.length)
  //       return -1;
  //     var line = this.lines[lineIndex];
  //     if (clientIndex < 0 || clientIndex >= line.clients.length)
  //       return -1;
  //     var client = line.clients[clientIndex];
  //
  //     var i = lineIndex + amount; // target to move client to
  //     while (i >= 0 && i < this.lines.length && (this.lines[i].minSpace() + client.minSpace > 1 / this.lines.length || this.lines[i].clients.length >= maxRows))
  //       i += amount;
  //
  //     if (i < 0 || i >= this.lines.length) {
  //       var c = Line.create();
  //       c.addClient(client);
  //       if (i < 0) {
  //         if (this.addLine(c, maxLines, 0) === -1)
  //           return -1;
  //         return this.removeClient(clientIndex, lineIndex + 1);
  //       } else {
  //         if (this.addLine(c, maxLines) === -1)
  //           return -1;
  //         return this.removeClient(clientIndex, lineIndex);
  //       }
  //     } else {
  //       this.lines[i].addClient(client);
  //       return this.removeClient(clientIndex, lineIndex);
  //     }
  //   },
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
