import QtQuick 2.0
import 'activity.js' as Activity

Item {
  property var activities: Object()

  function addClient(client, activityId) {
    activityId = activityId ? activityId : workspace.currentActivity;
    if (!activities.hasOwnProperty(activityId))
      activities[activityId] = Activity.create();
    return activities[activityId].addClient(client);
  }

  function removeClient(clientIndex, lineIndex, screenIndex, desktopIndex, activityId) {
    if (activities[activityId].removeClient(clientIndex, lineIndex, screenIndex, desktopIndex)) {
      if (!activities[activityId].nclients())
        delete activities[activityId];
      return true;
    }
  }

  function moveClient(client, activityId) {
    if (client.activityId !== activityId && addClient(client, activityId)) {
      removeClient(client.clientIndex, client.lineIndex, client.screenIndex, client.desktopIndex, client.activityId);
      return client;
    }
  }

  function render() {
    for (const [activityId, activity] of Object.entries(activities))
      activity.render(activityId);
  }
}


