import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Random "mo:core/Random";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Principal "mo:core/Principal";

actor {
  module SortByDeadline {
    public func compare(a : (Text, Task), b : (Text, Task)) : Order.Order {
      Int.compare(a.1.deadline, b.1.deadline);
    };
  };

  type UserRole = {
    #admin;
    #qa;
    #sectionInCharge;
    #analyst;
  };

  type User = {
    principal : Principal;
    name : Text;
    role : UserRole;
    isActive : Bool;
  };

  type SampleStatus = {
    #pending;
    #eligible;
    #hold : Text;
    #analysis;
    #review;
    #completed;
  };

  type TaskType = {
    #sampleIntake;
    #eligibilityCheck;
    #analysis;
    #review;
    #coa;
  };

  type Task = {
    taskId : Text;
    sampleId : Text;
    taskType : TaskType;
    assignedRole : UserRole;
    deadline : Int;
  };

  type Notification = {
    notificationId : Text;
    message : Text;
    timestamp : Int;
    isRead : Bool;
  };

  let users = Map.empty<Principal, User>();
  let tasks = Map.empty<Text, Task>();
  let notifications = Map.empty<Text, List.List<Notification>>();

  public shared ({ caller }) func createUser(name : Text, role : UserRole) : async () {
    let user : User = {
      principal = caller;
      name;
      role;
      isActive = true;
    };
    users.add(caller, user);
  };

  public query ({ caller }) func getUser() : async ?User {
    users.get(caller);
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    let iter = tasks.values();
    iter.toArray();
  };

  public shared ({ caller }) func completeTask(taskId : Text) : async () {
    if (not tasks.containsKey(taskId)) {
      Runtime.trap("Task does not exist");
    };
    tasks.remove(taskId);
  };

  public shared ({ caller }) func sendNotification(userId : Text, message : Text) : async () {
    let notification : Notification = {
      notificationId = userId.concat(Time.now().toText());
      message;
      timestamp = Time.now();
      isRead = false;
    };

    switch (notifications.get(userId)) {
      case (null) {
        let newList = List.empty<Notification>();
        newList.add(notification);
        notifications.add(userId, newList);
      };
      case (?oldList) {
        oldList.add(notification);
      };
    };
  };

  public query ({ caller }) func getNotifications(userId : Text) : async [Notification] {
    switch (notifications.get(userId)) {
      case (null) { [] };
      case (?notificationList) { notificationList.toArray() };
    };
  };

  public shared ({ caller }) func markNotificationAsRead(userId : Text, notificationId : Text) : async () {
    switch (notifications.get(userId)) {
      case (null) { () };
      case (?notificationList) {
        let updatedList = notificationList.map<Notification, Notification>(
          func(notification) {
            if (notification.notificationId == notificationId) {
              { notification with isRead = true };
            } else {
              notification;
            };
          }
        );
        notifications.add(userId, updatedList);
      };
    };
  };

  public query ({ caller }) func getSortedTasksByDeadline() : async [(Text, Task)] {
    tasks.toArray().sort();
  };
};
