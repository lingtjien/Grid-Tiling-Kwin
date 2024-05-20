import { shared } from 'shared.mjs';

export const config = {};

function regex(data) {
  // empty regex will always match, so only return a regex when there is an input, otherwise everything will be matched by an empty regex test
  if (data) return RegExp(data);
}

function splitTrim(data) {
  return data
    .split(',')
    .map((i) => Number(i.trim()))
    .filter((i) => i);
}

function parseScreenGrid(rows, columns) {
  const grid = {};
  for (let i = 0; i < shared.workspace.screens.length; ++i) {
    grid[shared.workspace.screens[i].name] = [
      rows[i < rows.length ? i : 0],
      columns[i < columns.length ? i : 0],
    ];
  }
  return grid;
}

function parseDesktopGrid(read) {
  const grid = {};
  for (let i = 1; i <= 8; ++i) {
    const name = regex(read(`desktopName${i}`, ''));
    if (name) {
      for (const desktop of shared.workspace.desktops) {
        if (name.test(desktop.name)) {
          const g = parseScreenGrid(
            splitTrim(read(`desktopRows${i}`, '2')),
            splitTrim(read(`desktopColumns${i}`, '2'))
          );
          if (Object.keys(g).length) {
            grid[desktop.id] = g;
            break;
          }
        }
      }
    }
  }
  return grid;
}

function smallest(grid) {
  return Object.values(grid).reduce((s, [r, c]) => Math.min(s, 1 / (r * c)), 1);
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
  config.grid = {
    screen: parseScreenGrid(splitTrim(read('screenRows', '2')), splitTrim(read('screenColumns', '2'))), // Record<outputName, [row, column]>
    desktop: parseDesktopGrid(read), // Record<desktopId, Record<outputName, [row, column]>>
  };
  config.smallestSpace = Object.values(config.grid.desktop).reduce(
    (s, d) => Math.min(s, smallest(d)),
    smallest(config.grid.screen)
  );

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
    [1, 'systemsettings|inkscape|krita|gimp|kdenlive|Godot|vlc'],
    [2, 'code|chrome'],
    [3, ''],
    [4, ''],
    [5, ''],
    [6, ''],
    [7, ''],
    [8, ''],
    [9, ''],
    [10, ''],
  ]);

  config.blacklist = regex(read('blacklist', 'plasmashell'));
  config.whitelist = regex(read('whitelist', ''));
}

export function grid(desktopId, outputName) {
  const d = config.grid.desktop[desktopId];
  return d ? d[outputName] : config.grid.screen[outputName];
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
