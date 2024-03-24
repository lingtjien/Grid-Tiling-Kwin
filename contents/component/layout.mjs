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
    const id = window.activities[0];
    if (activities[id].remove(window)) {
      if (!activities[id].count()) delete activities[id];
      return window;
    }
  }

  function moved(window) {
    const current = window.activityId;
    const target = window.activities[0];

    if (!activities.hasOwnProperty(target)) activities[target] = Activity();
    if (activities[target].add(window) && activities[current].remove(window)) {
      window.activityId = target;
      return window;
    }
  }

  function render() {
    for (const [id, activity] of Object.entries(activities)) activity.render({ activityId: id });
  }

  return { activities, add, remove, moved, render };
}
