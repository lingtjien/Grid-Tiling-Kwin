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

  property var gap: Item {
    property int value: KWin.readConfig('gapValue', 16)
    property bool show: KWin.readConfig('gapShow', true)
  }

  property var divider: Item {
    property double bound: KWin.readConfig('dividerBound', 0.4)
    property double step: KWin.readConfig('dividerStep', 0.05)
  }

  property bool tile: KWin.readConfig('tile', true)

  property bool border: KWin.readConfig('border', false)

  property bool floatAbove: KWin.readConfig('floatAbove', true)

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
      'ignoredNames', 'ksmserver, krunner, latte-dock, Plasma, plasma, plasma-desktop, plasmashell, plugin-container, wine, yakuake'
    ))
    property var captions: splitTrim(KWin.readConfig(
      'ignoredCaptions', 'Trace Bitmap (Shift+Alt+B), Document Properties (Shift+Ctrl+D)'
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
}
