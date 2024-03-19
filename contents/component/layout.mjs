import { Activity } from 'activity.mjs';

export function Layout() {
  let activities = {};

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
      return true;
    }
  }

  function moveWindow(window, activityId) {
    // if (client.activityId !== activityId && addClient(client, activityId)) {
    //   removeClient(client.clientIndex, client.lineIndex, client.screenIndex, client.desktopIndex, client.activityId);
    //   return client;
    // }
  }

  function render() {
    for (const [activityId, activity] of Object.entries(activities)) activity.render(activityId);
  }

  return { activities, add, remove, render };
}
