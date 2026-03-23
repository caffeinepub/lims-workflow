import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
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

  type SampleID = Text;
  type ClientID = Nat;
  type TestMasterID = Nat;
  type TestSpecID = Nat;

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

  type VerifyEligibilityDecision = { userId : Principal; decision : Bool };
  type VerifyEligibilityDecisions = [VerifyEligibilityDecision];
  type EligibilityVoteValuation = {
    isEligible : Bool;
    comments : Text;
    votes : VerifyEligibilityDecisions;
  };

  type TestParameter = {
    name : Text;
    unit : Text;
    minValue : Nat;
    maxValue : Nat;
    acceptanceCriteria : Text;
  };

  type TestMaster = {
    testName : Text;
    testType : Text;
    daysRequired : Nat;
    status : {
      #active;
      #inactive;
    };
    parameters : [TestParameter];
  };

  type Client = {
    name : Text;
    contactPerson : Text;
    email : Text;
    phone : Text;
    address : Text;
    city : Text;
    pinCode : Text;
  };

  type TestSpecification = {
    parameter : Text;
    acceptanceCriteria : Text;
    method : Text;
    referenceStandard : Text;
    assignedAnalyst : Text;
    targetSLA : Nat;
  };

  type AnalysisResult = {
    parameter : Text;
    observedValue : Text;
    unit : Text;
    verdict : {
      #pass;
      #fail;
      #oos;
    };
    remark : Text;
  };

  type SicReview = {
    reviewerName : Text;
    decision : Bool;
    comments : Text;
    flaggedRows : [Nat];
  };

  type QaReview = {
    qaHeadName : Text;
    decision : Bool;
    comments : Text;
  };

  type Sample = {
    sampleId : Text;
    clientName : Text;
    sampleName : Text;
    sampleStatus : SampleStatus;
    testName : Text;
    registrationId : Nat;
    rfa : {
      registration : Nat;
      billing : Nat;
      sampleDetails : Nat;
    };
    testSpecs : [TestSpecification];
    analysisResults : [AnalysisResult];
    sicReview : ?SicReview;
    qaReview : ?QaReview;
    dateReceived : Int;
  };

  public type ImmutableField = {
    #userId;
    #sampleId;
    #registrationNumber;
    #issueDate;
    #createdAt;
    #rfaReference;
    #originalAnalystRef;
    #originalSectionInChargeRef;
    #pricingPolicy;
  };

  type COAKey = { sampleId : SampleID };
  type COAValue = {
    coaNumber : Nat;
    registrationNumber : Nat;
    issuedDateTime : Nat;
    sampleIntakeEmployee : Text;
    verificationEmployee : Text;
    sicEmployee : Text;
    qaEmployee : Text;
  };

  type TestMasterKey = {
    testName : Text;
    testType : Text;
    status : {
      #active;
      #inactive;
    };
  };

  let users = Map.empty<Principal, User>();
  var nextClientId = 0;

  var testMasters = Map.empty<TestMasterID, TestMaster>();

  var clients = Map.empty<ClientID, Client>();
  let tasks = Map.empty<Text, Task>();
  let notifications = Map.empty<Text, List.List<Notification>>();

  let samples = Map.empty<SampleID, Sample>();
  let eligibilityVotes = Map.empty<SampleID, EligibilityVoteValuation>();
  let coas = Map.empty<Text, COAValue>();

  public query ({ caller }) func workflowCheckDataType(name : Text, value : Int) : async User {
    {
      principal = caller;
      name = "test";
      role = #admin;
      isActive = true;
    };
  };

  public query ({ caller }) func getTasks() : async [(Text, Task)] {
    tasks.toArray();
  };

  public query ({ caller }) func getCompletedTasks() : async [(Text, Task)] {
    tasks.toArray();
  };

  public query ({ caller }) func getSortedTasksByDeadline() : async [(Text, Task)] {
    tasks.toArray().sort();
  };

  public shared ({ caller }) func getAllTasks() : async [Task] {
    let iter = tasks.values();
    iter.toArray();
  };

  public shared ({ caller }) func findTasks(taskId : Text) : async Task {
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task does not exist!") };
      case (?task) { task };
    };
  };

  public shared ({ caller }) func completeTask(taskId : Text) : async () {
    if (not tasks.containsKey(taskId)) {
      Runtime.trap("Task does not exist");
    };
    tasks.remove(taskId);
  };

  public query ({ caller }) func getTask(taskId : Text) : async Task {
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task does not exist!") };
      case (?task) { task };
    };
  };

  public shared ({ caller }) func submitEligibilityVote(sampleId : SampleID, isEligible : Bool, comments : Text, votes : VerifyEligibilityDecisions) : async EligibilityVoteValuation {
    let newVote = {
      isEligible;
      comments;
      votes;
    };
    eligibilityVotes.add(sampleId, newVote);
    newVote;
  };

  public query ({ caller }) func getEligibilityVote(sampleId : SampleID) : async {
    isEligible : Bool;
    comments : Text;
    votes : VerifyEligibilityDecisions;
  } {
    switch (eligibilityVotes.get(sampleId)) {
      case (null) { Runtime.trap("Vote does not exist!") };
      case (?vote) { vote };
    };
  };

  public shared ({ caller }) func findEligibilityVote(sampleId : SampleID) : async EligibilityVoteValuation {
    switch (eligibilityVotes.get(sampleId)) {
      case (null) { Runtime.trap("Vote does not exist!") };
      case (?vote) { vote };
    };
  };

  public shared ({ caller }) func loadTestMaster(testMasterId : TestMasterID) : async TestMaster {
    switch (testMasters.get(testMasterId)) {
      case (null) { Runtime.trap("Test master does not exist!") };
      case (?testMaster) { testMaster };
    };
  };

  public shared ({ caller }) func loadClientById(clientId : ClientID) : async Client {
    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client does not exist!") };
      case (?client) { client };
    };
  };

  public query ({ caller }) func getSample(sampleId : SampleID) : async Sample {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist!") };
      case (?sample) { sample };
    };
  };

  public query ({ caller }) func listSamples() : async [Sample] {
    samples.values().toArray();
  };

  public query ({ caller }) func getTestSpecIds() : async [TestSpecID] {
    let iter = testMasters.keys();
    iter.toArray();
  };

  public shared ({ caller }) func findCoa(sampleId : SampleID) : async COAValue {
    switch (coas.get(sampleId)) {
      case (null) { Runtime.trap("COA does not exist!") };
      case (?coaValue) { coaValue };
    };
  };

  public shared ({ caller }) func removeTask(taskId : Text) : async () {
    if (not tasks.containsKey(taskId)) {
      Runtime.trap("Task does not exist");
    };
    tasks.remove(taskId);
  };

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

  public shared ({ caller }) func addClient(client : Client) : async Nat {
    let id = nextClientId;
    nextClientId += 1;
    clients.add(id, client);
    id;
  };

  public shared ({ caller }) func updateClient(clientId : ClientID, client : Client) : async () {
    if (not clients.containsKey(clientId)) {
      Runtime.trap("Client does not exist");
    };
    clients.add(clientId, client);
  };

  public shared ({ caller }) func deleteClient(clientId : ClientID) : async () {
    if (not clients.containsKey(clientId)) {
      Runtime.trap("Client does not exist");
    };
    clients.remove(clientId);
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
      case (?oldList) { oldList.add(notification) };
    };
  };

  public shared ({ caller }) func getNotifications(userId : Text) : async [Notification] {
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
            if (notification.notificationId == notificationId) { { notification with isRead = true } } else { notification };
          }
        );
        notifications.add(userId, updatedList);
      };
    };
  };

  public shared ({ caller }) func addTestMaster(testMaster : TestMaster) : async Nat {
    let testMasterId = nextClientId;
    nextClientId += 1;
    testMasters.add(testMasterId, testMaster);
    testMasterId;
  };

  public shared ({ caller }) func createSample(sample : Sample) : async SampleID {
    samples.add(sample.sampleId, sample);
    sample.sampleId;
  };

  public shared ({ caller }) func updateSample(sampleId : SampleID, stage : Text) : async () {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) {
        let newStatus : SampleStatus = switch (stage) {
          case ("Eligible") { #eligible };
          case ("Analysis") { #analysis };
          case ("SICReview") { #review };
          case ("QAReview") { #review };
          case ("COA") { #completed };
          case (_) { #pending };
        };
        samples.add(sampleId, { sample with sampleStatus = newStatus });
      };
    };
  };

  public query ({ caller }) func getClientSamples(clientId : Principal) : async [Text] {
    [""];
  };

  // ─── Test Specification APIs ───────────────────────────────────────────────

  public shared ({ caller }) func saveTestSpec(sampleId : SampleID, testSpecs : [TestSpecification]) : async () {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) {
        samples.add(sampleId, { sample with testSpecs = testSpecs; sampleStatus = #analysis });
      };
    };
  };

  public query ({ caller }) func getTestSpec(sampleId : SampleID) : async [TestSpecification] {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) { sample.testSpecs };
    };
  };

  public shared ({ caller }) func assignAnalyst(sampleId : SampleID, analystName : Text) : async () {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) {
        let updatedSpecs = sample.testSpecs.map(func(spec : TestSpecification) : TestSpecification { { spec with assignedAnalyst = analystName } });
        samples.add(sampleId, { sample with testSpecs = updatedSpecs });
      };
    };
  };

  // ─── Analysis Result APIs ──────────────────────────────────────────────────

  public shared ({ caller }) func saveAnalysisResult(sampleId : SampleID, results : [AnalysisResult]) : async () {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) {
        samples.add(sampleId, { sample with analysisResults = results });
      };
    };
  };

  public query ({ caller }) func getAnalysisResult(sampleId : SampleID) : async [AnalysisResult] {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) { sample.analysisResults };
    };
  };

  public shared ({ caller }) func submitAnalysis(sampleId : SampleID) : async () {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) {
        samples.add(sampleId, { sample with sampleStatus = #review });
      };
    };
  };

  // ─── SIC Review APIs ───────────────────────────────────────────────────────

  public shared ({ caller }) func saveSICReview(sampleId : SampleID, review : SicReview) : async () {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) {
        samples.add(sampleId, { sample with sicReview = ?review });
      };
    };
  };

  public query ({ caller }) func getSICReview(sampleId : SampleID) : async ?SicReview {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) { sample.sicReview };
    };
  };

  public shared ({ caller }) func approveSICReview(sampleId : SampleID) : async () {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) {
        let updatedReview : ?SicReview = switch (sample.sicReview) {
          case (null) { ?{ reviewerName = ""; decision = true; comments = ""; flaggedRows = [] } };
          case (?r) { ?{ r with decision = true } };
        };
        samples.add(sampleId, { sample with sicReview = updatedReview });
      };
    };
  };

  public shared ({ caller }) func rejectSICReview(sampleId : SampleID) : async () {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) {
        let updatedReview : ?SicReview = switch (sample.sicReview) {
          case (null) { ?{ reviewerName = ""; decision = false; comments = ""; flaggedRows = [] } };
          case (?r) { ?{ r with decision = false } };
        };
        samples.add(sampleId, { sample with sicReview = updatedReview; sampleStatus = #analysis });
      };
    };
  };

  // ─── QA Review APIs ────────────────────────────────────────────────────────

  public shared ({ caller }) func saveQAReview(sampleId : SampleID, review : QaReview) : async () {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) {
        samples.add(sampleId, { sample with qaReview = ?review });
      };
    };
  };

  public query ({ caller }) func getQAReview(sampleId : SampleID) : async ?QaReview {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) { sample.qaReview };
    };
  };

  public shared ({ caller }) func approveQAReview(sampleId : SampleID) : async () {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) {
        let updatedReview : ?QaReview = switch (sample.qaReview) {
          case (null) { ?{ qaHeadName = ""; decision = true; comments = "" } };
          case (?r) { ?{ r with decision = true } };
        };
        samples.add(sampleId, { sample with qaReview = updatedReview; sampleStatus = #completed });
      };
    };
  };

  public shared ({ caller }) func rejectQAReview(sampleId : SampleID) : async () {
    switch (samples.get(sampleId)) {
      case (null) { Runtime.trap("Sample does not exist") };
      case (?sample) {
        let updatedReview : ?QaReview = switch (sample.qaReview) {
          case (null) { ?{ qaHeadName = ""; decision = false; comments = "" } };
          case (?r) { ?{ r with decision = false } };
        };
        samples.add(sampleId, { sample with qaReview = updatedReview; sampleStatus = #review });
      };
    };
  };

  // ─── COA Issuance ──────────────────────────────────────────────────────────

  public shared ({ caller }) func issueCOA(sampleId : SampleID, coa : COAValue) : async () {
    coas.add(sampleId, coa);
    switch (samples.get(sampleId)) {
      case (null) { () };
      case (?sample) {
        samples.add(sampleId, { sample with sampleStatus = #completed });
      };
    };
  };

  public query ({ caller }) func getCOABySampleId(sampleId : SampleID) : async ?COAValue {
    coas.get(sampleId);
  };

};
