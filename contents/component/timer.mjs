export function setTimeout(callback, timeout) {
    const timer = new QTimer();
    timer.interval = timeout;
    timer.singleShot = true;
    timer.timeout.connect(callback);
    timer.start();
}