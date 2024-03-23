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
    if (activities[window.activityId].remove(window)) {
      if (!activities[window.activityId].count()) delete activities[window.activityId];
      return window;
    }
  }

  function move(window, id) {
    // id = target
    const current = window.activities[0].id;
    if (current !== id) {
      if (!activities.hasOwnProperty(id)) activities[id] = Activity();
      if (activities[id].add(window) && activities[current].remove(window)) return window;
    }
  }

  function render() {
    for (const activity of Object.values(activities)) activity.render();
  }

  return { activities, add, remove, move, render };
}
