import QtQuick 2.0

Item {
  property var grid: readGrid(10, '2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2')

  property var smallestSpace: grid.reduce((min, data) => data.reduce((m, [row, col]) => Math.min(m, 1 / (row * col)), min), 1)

  property int gapValue: KWin.readConfig('gapValue', 16)
  property bool gapShow: KWin.readConfig('gapShow', true) // for bool types readConfig requires the default value to match the one defined in the xml (bug in KWin)
  property int gap: gapShow ? gapValue : 0

  property var divider: Item {
    property double bound: KWin.readConfig('dividerBound', 0.4)
    property double step: KWin.readConfig('dividerStep', 0.05)
  }

  property bool tile: KWin.readConfig('tile', true)

  property bool border: KWin.readConfig('border', false)
  property bool borderActive: KWin.readConfig('borderActive', false)

  property int delay: KWin.readConfig('delay', 10)

  property var margin: Item {
    property int t: KWin.readConfig('marginT', 0)
    property int b: KWin.readConfig('marginB', 0)
    property int l: KWin.readConfig('marginL', 0)
    property int r: KWin.readConfig('marginR', 0)
  }

  property var minSpace: readMinSpace([
    [1, 'inkscape|krita|gimp|designer|creator|kdenlive'],
    [2, 'code|kdevelop|chromium|kate|spotify'],
    [3, ''], [4, ''], [5, ''], [6, ''], [7, ''], [8, ''], [9, ''], [10, '']
  ])

  property var ignored: regex(KWin.readConfig('ignored', 'ksmserver-logout-greeter'))

  function regex(data) { // empty regex will always match, so only return a regex when there is an input, otherwise everything will be ignored by an empty regex test
    if (data)
      return RegExp(data);
  }

  function splitTrimNumber(data) {
    return data.split(',').map(i => Number(i.trim())).filter(i => i);
  }

  function readGrid(screens, defaults) {
    let data = [];
    for (let i = 0; i < screens; i++) {
      const rows = splitTrimNumber(KWin.readConfig(`rowsScreen${i}`, defaults));
      const columns = splitTrimNumber(KWin.readConfig(`columnsScreen${i}`, defaults));
      let d = [];
      for (let j = 0; j < rows.length && j < columns.length; j++) {
        d.push([rows[j], columns[j]]);
      }
      data.push(d);
    }
    return data;
  }

  function readMinSpace(defaults) {
    let data = [];
    for (let [i, d] of defaults) {
      const name = KWin.readConfig(`minSpaceName${i}`, d);
      i = KWin.readConfig(`minSpace${i}`, i);
      if (i && name)
        data.push([1 / i, regex(name)]);
    }
    return data;
  }

  function x(start) {
    return start + margin.l + gap;
  }

  function y(start) {
    return start + margin.t + gap;
  }

  function width(total, n) {
    return (total - margin.l - margin.r - ((n + 1) * gap)) / n;
  }

  function height(total, n) {
    return (total - margin.t - margin.b - ((n + 1) * gap)) / n;
  }
}
