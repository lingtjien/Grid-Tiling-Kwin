export const config = {};

function regex(data) {
  // empty regex will always match, so only return a regex when there is an input, otherwise everything will be matched by an empty regex test
  if (data) return RegExp(data);
}

function splitTrimNumber(data) {
  return data
    .split(',')
    .map((i) => Number(i.trim()))
    .filter((i) => i);
}

function minSpace(read, defaults) {
  const data = [];
  for (let [i, d] of defaults) {
    const name = read(`minSpaceName${i}`, d);
    i = read(`minSpace${i}`, i);
    if (i && name) data.push([1 / i, regex(name)]);
  }
  return data;
}

export function setGap() {
  config.gap = config.gapShow ? config.gapValue : 0;
}

export function load(read) {
  // config.grid = grid(read, 10, '2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2');
  // config.smallestSpace = config.grid.reduce(
  //   (min, data) => data.reduce((m, [row, col]) => Math.min(m, 1 / (row * col)), min),
  //   1
  // );

  config.smallestSpace = 1 / (2 * 2); // TODO

  config.gapShow = read('gapShow', true);
  config.gapValue = read('gapValue', 16);
  setGap();

  config.divider = {
    bound: read('dividerBound', 0.4),
    step: read('dividerStep', 0.05),
  };

  config.tile = read('tile', true);

  config.border = read('border', false);
  config.borderActive = read('borderActive', false);

  config.delay = read('delay', 10);

  config.margin = {
    t: read('marginT', 0),
    b: read('marginB', 0),
    l: read('marginL', 0),
    r: read('marginR', 0),
  };

  config.minSpace = minSpace(read, [
    [1, 'inkscape|krita|gimp|designer|creator|kdenlive'],
    [2, 'kdevelop|code'],
    [3, ''],
    [4, ''],
    [5, ''],
    [6, ''],
    [7, ''],
    [8, ''],
    [9, ''],
    [10, ''],
  ]);

  config.blacklist = regex(read('blacklist', 'ksmserver-logout-greeter'));
  config.whitelist = regex(read('whitelist', ''));
}

export function grid(desktopId, screenName) {
  return [2, 2]; // TODO
}

export function clampDivider(value) {
  return Math.min(Math.max(-config.divider.bound, value), config.divider.bound);
}

export const calc = {
  x: (start) => start + config.margin.l + config.gap,
  y: (start) => start + config.margin.t + config.gap,
  width: (total, n) => (total - config.margin.l - config.margin.r - (n + 1) * config.gap) / n,
  height: (total, n) => (total - config.margin.t - config.margin.b - (n + 1) * config.gap) / n,
};
