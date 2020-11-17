import QtQuick 2.0
import 'activity.js' as Activity

Item {
  property var activities: Object()

  function addClient(client) {
    if (!activities.hasOwnProperty(workspace.currentActivity))
      activities[workspace.currentActivity] = Activity.create();
    return activities[workspace.currentActivity].addClient(client);
  }

  function removeClient(clientIndex, lineIndex, screenIndex, desktopIndex, activityId) {
    if (activities[activityId].removeClient(clientIndex, lineIndex, screenIndex, desktopIndex)) {
      if (!activities[activityId].nclients())
        delete activities[activityId];
      return true;
    }
  }

  //function moveClient(client, activityId) {
    //if (client.activityId === activityId || !activities.hasOwnProperty(client.activityId))
      //return -1;
    //if (!activities.hasOwnProperty(activityId))
      //activities[activityId] = Activity.create();
    //if (removeClient(client.clientIndex, client.lineIndex, client.desktopIndex, client.activityId) !== 0)
      //return -1;
    //return activities[activityId].addClient(client);
  //}

  function render() {
    for (const [activityId, activity] of Object.entries(activities))
      activity.render(activityId);
  }
}


