import QtQuick 2.0

Item {
  property var grids: combine(splitTrim(KWin.readConfig(
    'rows', '2, 2, 2, 2, 2, 2, 2, 2, 2, 2'
  )), splitTrim(KWin.readConfig(
    'columns', '2, 2, 2, 2, 2, 2, 2, 2, 2, 2'
  )))

  property var smallestSpace: grids.reduce((current, [row, col]) => {
    const space = 1 / (row * col);
    return space < current ? space : current;
  }, 1)

  property int gapValue: KWin.readConfig('gapValue', 16)
  property bool gapShow: KWin.readConfig('gapShow', true)
  property int gap: gapShow ? gapValue : 0

  property var divider: Item {
    property double bound: KWin.readConfig('dividerBound', 0.4)
    property double step: KWin.readConfig('dividerStep', 0.05)
  }

  property bool tile: KWin.readConfig('tile', true)

  property bool border: KWin.readConfig('border', false)

  property var margin: Item {
    property int t: KWin.readConfig('marginT', 0)
    property int b: KWin.readConfig('marginB', 0)
    property int l: KWin.readConfig('marginL', 0)
    property int r: KWin.readConfig('marginR', 0)
  }

  property var minSpaces: combine(splitTrim(KWin.readConfig(
    'minSpaceNames', 'texstudio, inkscape, krita, gimp, designer, creator, kdenlive, kdevelop, chromium, kate, spotify'
  )), splitTrim(KWin.readConfig(
    'minSpaceValues', '1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2'
  )).map(i => 1 / Number(i)))

  property var ignored: Item {
    property var names: splitTrim(KWin.readConfig(
      'ignoredNames', 'kwin_wayland, ksmserver, krunner, latte-dock, Plasma, plasma, plasma-desktop, plasmashell, plugin-container, wine, yakuake'
    ))
    property var captions: splitTrim(KWin.readConfig(
      'ignoredCaptions', ''
    ))
  }

  function splitTrim(data) {
    return data.split(',').map(i => i.trim()).filter(i => i);
  }

  function combine(lhs, rhs) {
    let data = [];
    for (let i = 0; i < lhs.length && i < rhs.length; i++) {
      data.push([lhs[i], rhs[i]]);
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
