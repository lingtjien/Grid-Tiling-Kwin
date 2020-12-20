import QtQuick 2.0

Item {
  function set(time, callback) {
    return timer.createObject(null, {callback: callback, interval: time})
  }

  function clear(t) {
    t.stop();
    t.destroy();
  }

  Component {
    id: timer
    Timer {
      property var callback
      running: true
      repeat: false
      onTriggered: {
        callback();
        destroy();
      }
    }
  }
}
