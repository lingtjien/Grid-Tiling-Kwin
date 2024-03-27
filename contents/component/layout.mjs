import { Activity } from 'activity.mjs';

export function Layout() {
  let activities = {}; // key = activity id

  function add(window) {
    const id = window.activities[0];
    if (!activities.hasOwnProperty(id)) activities[id] = Activity();
    if (activities[id].add(window)) {
      window.activityId = id;
      return window;
    }
  }

  function remove(window) {
    const id = window.activityId;
    if (activities[id].remove(window)) {
      if (!activities[id].count()) delete activities[id];
      return window;
    }
  }

  function moved(window) {
    const target = window.activities[0];
    if (!activities.hasOwnProperty(target)) activities[target] = Activity();
    const w = Object.assign({}, window);
    if (activities[target].add(window)) {
      remove(w);
      window.activityId = target;
      return window;
    }
  }

  function render() {
    for (const activity of Object.values(activities)) activity.render();
  }

  return { activities, add, remove, moved, render };
}
