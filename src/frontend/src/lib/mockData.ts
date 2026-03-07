// ============================================================
// LIMS Mock Data — All workflow stages, users, notifications
// ============================================================

export type WorkflowStage =
  | "Intake"
  | "EligibilityCheck"
  | "Registration"
  | "TestSpec"
  | "Analysis"
  | "SICReview"
  | "QAReview"
  | "COA"
  | "OnHold"
  | "Rejected"
  | "PendingApproval";

export type ApprovalDecision = "pending" | "approved" | "rejected" | "hold";

export interface SICApprovalRecord {
  userId: string;
  userName: string;
  decision: ApprovalDecision;
  comment: string;
  decidedAt?: string;
}

export type UserRoleType = "admin" | "qa" | "sectionInCharge" | "analyst";

export interface DummyUser {
  id: string;
  name: string;
  role: UserRoleType;
  designation: string;
  email: string;
  isActive: boolean;
  section?: string;
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pinCode: string;
}

export interface TestParameter {
  id: string;
  name: string;
  unit: string;
  minValue?: number;
  maxValue?: number;
  operator?: string;
  acceptanceCriteria: string;
}

export interface TestSample {
  id: string;
  testName: string;
  testType: string;
  parameters: TestParameter[];
  noOfDays: number;
  status: "active" | "inactive";
}

export interface SampleIntakeRecord {
  sampleId: string;
  customerName: string;
  contactPerson: string;
  emailAddress: string;
  sampleName: string;
  sampleType: string;
  physicalForm: string;
  dateOfReceipt: string;
  numberOfUnits: number;
  specialHandling: string;
  requestedTests?: string[];
  assignToSectionInCharge: string | string[];
  approvalDecisions?: SICApprovalRecord[];
  status: WorkflowStage;
  createdAt: string;
  createdBy: string;
}

export interface SampleDetail {
  id: string;
  sampleName: string;
  batchNumber: string;
  arNo: string;
  batchSize: string;
  sampleQuantity: string;
  originalMfgName: string;
  dateOfMfg: string;
  specification: string;
  testType: string;
  testParameters: string[];
  expiryDate: string;
  natureOfPacking: string;
  retestDate: string;
}

export interface RFARecord {
  id: string;
  sampleId: string;
  registrationNumber: string;
  clientName: string;
  address: string;
  pinCode: string;
  referenceQuotation: string;
  customerRefNumber: string;
  entryDate: string;
  person: string;
  designation: string;
  phone: string;
  emailId: string;
  billingAddressRequired: boolean;
  clientOrganizationName: string;
  clientBillingAddress: string;
  contactTelNo: string;
  billingContactPerson: string;
  market: string;
  reportRequiredForm: string;
  supplierName: string;
  mfgDrugLicNo: string;
  workorder: string;
  comments: string;
  stpNo: string;
  temperatureConditions: string;
  sendersFullname: string;
  einOfReceiver: string;
  dateOfReceipt: string;
  others: string;
  testingPurpose: string;
  testNames: string[];
  samplingPoint: string;
  sampledBy: string;
  testMethod: string;
  sectionUsers: string[];
  sampleDescription: string;
  rawFinishedOthers: string;
  assigneeType: string;
  sampleDetails: SampleDetail[];
}

export interface TestSpecRow {
  id: string;
  parameter: string;
  acceptanceCriteria: string;
  methodSop: string;
  referenceStandard: string;
  qaNotes: string;
  assignedAnalyst: string;
  targetSla: string;
}

export interface AnalysisResultRow {
  id: string;
  parameter: string;
  acceptanceCriteria: string;
  observedValue: string;
  unit: string;
  verdict: "PASS" | "FAIL" | "OOS" | "";
  testDateStart: string;
  testDateEnd: string;
  remarks: string;
}

export interface ReviewRow {
  id: string;
  parameter: string;
  observedValue: string;
  verdict: string;
  approved: boolean;
  flagReason: string;
  rejectionReason: string;
}

export interface COARecord {
  id: string;
  sampleId: string;
  coaNumber: string;
  registrationNumber: string;
  clientName: string;
  sampleName: string;
  issueDate: string;
  analystName: string;
  sicReviewerName: string;
  qaApproverName: string;
  analystSignDate: string;
  sicSignDate: string;
  qaSignDate: string;
  parameters: {
    parameter: string;
    acceptanceCriteria: string;
    observedValue: string;
    unit: string;
    verdict: string;
  }[];
  overallResult: string;
  complianceStatement: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface TaskRecord {
  id: string;
  sampleId: string;
  taskType: string;
  assignedRole: UserRoleType;
  assignedUserId: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  description: string;
}

// ============================================================
// DUMMY USERS
// ============================================================
export const DUMMY_USERS: DummyUser[] = [
  {
    id: "user-001",
    name: "Dr. Sarah Chen",
    role: "qa",
    designation: "QA / Lab Director",
    email: "sarah.chen@pharmalab.com",
    isActive: true,
    section: "Quality Assurance",
  },
  {
    id: "user-002",
    name: "Rajesh Malhotra",
    role: "sectionInCharge",
    designation: "Section Head / Analyst",
    email: "rajesh.malhotra@pharmalab.com",
    isActive: true,
    section: "Chemistry",
  },
  {
    id: "user-003",
    name: "Elena Rodriguez",
    role: "analyst",
    designation: "Analyst II, HPLC",
    email: "elena.rodriguez@pharmalab.com",
    isActive: true,
    section: "Chemistry",
  },
  {
    id: "user-004",
    name: "Marcus Chen",
    role: "analyst",
    designation: "Analyst",
    email: "marcus.chen@pharmalab.com",
    isActive: true,
    section: "Microbiology",
  },
  {
    id: "user-005",
    name: "James Okonkwo",
    role: "sectionInCharge",
    designation: "Section In-Charge",
    email: "james.okonkwo@pharmalab.com",
    isActive: true,
    section: "Microbiology",
  },
  {
    id: "user-006",
    name: "Priya Sharma",
    role: "analyst",
    designation: "Analyst",
    email: "priya.sharma@pharmalab.com",
    isActive: true,
    section: "Chemistry",
  },
  {
    id: "user-007",
    name: "Admin User",
    role: "admin",
    designation: "System Administrator",
    email: "admin@pharmalab.com",
    isActive: true,
  },
];

// ============================================================
// CLIENTS
// ============================================================
export const CLIENTS: Client[] = [
  {
    id: "cli-001",
    name: "BioPharm Solutions Ltd",
    contactPerson: "Dr. Anita Patel",
    email: "anita@biopharm.com",
    phone: "+91-9876543210",
    address: "45 Industrial Estate, Andheri East",
    city: "Mumbai",
    pinCode: "400069",
  },
  {
    id: "cli-002",
    name: "GeneriCure Pharmaceuticals",
    contactPerson: "Mr. Suresh Kumar",
    email: "suresh@genericure.com",
    phone: "+91-9812345678",
    address: "12 Pharma Park, Sector 18",
    city: "Gurugram",
    pinCode: "122015",
  },
  {
    id: "cli-003",
    name: "NovaMed Research Inc",
    contactPerson: "Ms. Kavitha Reddy",
    email: "kavitha@novamed.com",
    phone: "+91-9988776655",
    address: "78 Science City Road",
    city: "Hyderabad",
    pinCode: "500081",
  },
  {
    id: "cli-004",
    name: "AlphaVet Biologics",
    contactPerson: "Dr. Ravi Shankar",
    email: "ravi@alphavet.com",
    phone: "+91-9765432109",
    address: "23 Biotech Cluster, Whitefield",
    city: "Bangalore",
    pinCode: "560066",
  },
  {
    id: "cli-005",
    name: "PharmaCore Industries",
    contactPerson: "Ms. Deepa Nair",
    email: "deepa@pharmacore.com",
    phone: "+91-9654321098",
    address: "56 API Zone, GIDC",
    city: "Ahmedabad",
    pinCode: "382330",
  },
];

// ============================================================
// TEST SAMPLES MASTER
// ============================================================
export const TEST_SAMPLES: TestSample[] = [
  {
    id: "ts-001",
    testName: "HPLC Assay",
    testType: "Chemical",
    noOfDays: 5,
    status: "active",
    parameters: [
      {
        id: "p-001",
        name: "Assay (% w/w)",
        unit: "%",
        minValue: 98.0,
        maxValue: 102.0,
        operator: "between",
        acceptanceCriteria: "98.0% - 102.0%",
      },
      {
        id: "p-002",
        name: "Related Substances",
        unit: "%",
        maxValue: 0.5,
        operator: "NMT",
        acceptanceCriteria: "NMT 0.5%",
      },
      {
        id: "p-003",
        name: "Water Content",
        unit: "%",
        maxValue: 1.0,
        operator: "NMT",
        acceptanceCriteria: "NMT 1.0%",
      },
    ],
  },
  {
    id: "ts-002",
    testName: "Microbial Limit Test",
    testType: "Microbiological",
    noOfDays: 7,
    status: "active",
    parameters: [
      {
        id: "p-004",
        name: "Total Aerobic Count",
        unit: "CFU/g",
        maxValue: 1000,
        operator: "NMT",
        acceptanceCriteria: "NMT 1000 CFU/g",
      },
      {
        id: "p-005",
        name: "Total Yeast & Mold",
        unit: "CFU/g",
        maxValue: 100,
        operator: "NMT",
        acceptanceCriteria: "NMT 100 CFU/g",
      },
      {
        id: "p-006",
        name: "E. coli",
        unit: "",
        acceptanceCriteria: "Absent in 1g",
      },
      {
        id: "p-007",
        name: "Salmonella",
        unit: "",
        acceptanceCriteria: "Absent in 10g",
      },
    ],
  },
  {
    id: "ts-003",
    testName: "Dissolution Test",
    testType: "Physical",
    noOfDays: 3,
    status: "active",
    parameters: [
      {
        id: "p-008",
        name: "Dissolution (Q)",
        unit: "%",
        minValue: 80,
        operator: "NLT",
        acceptanceCriteria: "NLT 80% in 45 min",
      },
      {
        id: "p-009",
        name: "Uniformity of Dosage",
        unit: "%",
        minValue: 85,
        maxValue: 115,
        operator: "between",
        acceptanceCriteria: "85% - 115%",
      },
    ],
  },
  {
    id: "ts-004",
    testName: "Heavy Metals Analysis",
    testType: "Chemical",
    noOfDays: 4,
    status: "active",
    parameters: [
      {
        id: "p-010",
        name: "Lead (Pb)",
        unit: "ppm",
        maxValue: 5,
        operator: "NMT",
        acceptanceCriteria: "NMT 5 ppm",
      },
      {
        id: "p-011",
        name: "Arsenic (As)",
        unit: "ppm",
        maxValue: 2,
        operator: "NMT",
        acceptanceCriteria: "NMT 2 ppm",
      },
      {
        id: "p-012",
        name: "Mercury (Hg)",
        unit: "ppm",
        maxValue: 1,
        operator: "NMT",
        acceptanceCriteria: "NMT 1 ppm",
      },
    ],
  },
  {
    id: "ts-005",
    testName: "Sterility Test",
    testType: "Microbiological",
    noOfDays: 14,
    status: "active",
    parameters: [
      {
        id: "p-013",
        name: "Sterility (Aerobic)",
        unit: "",
        acceptanceCriteria: "No growth",
      },
      {
        id: "p-014",
        name: "Sterility (Anaerobic)",
        unit: "",
        acceptanceCriteria: "No growth",
      },
      {
        id: "p-015",
        name: "Fungal Sterility",
        unit: "",
        acceptanceCriteria: "No growth",
      },
    ],
  },
  {
    id: "ts-006",
    testName: "Particle Size Analysis",
    testType: "Physical",
    noOfDays: 2,
    status: "active",
    parameters: [
      {
        id: "p-016",
        name: "D50 (Median)",
        unit: "µm",
        maxValue: 50,
        operator: "NMT",
        acceptanceCriteria: "NMT 50 µm",
      },
      {
        id: "p-017",
        name: "D90",
        unit: "µm",
        maxValue: 150,
        operator: "NMT",
        acceptanceCriteria: "NMT 150 µm",
      },
    ],
  },
];

// ============================================================
// SAMPLE INTAKES (15 samples across all stages)
// ============================================================
export const SAMPLE_INTAKES: SampleIntakeRecord[] = [
  {
    sampleId: "SI-2026-001",
    customerName: "BioPharm Solutions Ltd",
    contactPerson: "Dr. Anita Patel",
    emailAddress: "anita@biopharm.com",
    sampleName: "Amoxicillin Trihydrate",
    sampleType: "API",
    physicalForm: "Powder",
    dateOfReceipt: "2026-02-01",
    numberOfUnits: 5,
    specialHandling: "Store at 2-8°C",
    requestedTests: ["HPLC Assay", "Microbial Limit Test"],
    assignToSectionInCharge: "user-002",
    status: "COA",
    createdAt: "2026-02-01T09:00:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-002",
    customerName: "GeneriCure Pharmaceuticals",
    contactPerson: "Mr. Suresh Kumar",
    emailAddress: "suresh@genericure.com",
    sampleName: "Paracetamol Tablets 500mg",
    sampleType: "Finished Product",
    physicalForm: "Tablet",
    dateOfReceipt: "2026-02-03",
    numberOfUnits: 10,
    specialHandling: "None",
    requestedTests: ["HPLC Assay", "Dissolution Test"],
    assignToSectionInCharge: "user-002",
    status: "QAReview",
    createdAt: "2026-02-03T10:30:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-003",
    customerName: "NovaMed Research Inc",
    contactPerson: "Ms. Kavitha Reddy",
    emailAddress: "kavitha@novamed.com",
    sampleName: "Ibuprofen Suspension",
    sampleType: "Finished Product",
    physicalForm: "Liquid",
    dateOfReceipt: "2026-02-05",
    numberOfUnits: 3,
    specialHandling: "Protect from light",
    requestedTests: [
      "HPLC Assay",
      "Microbial Limit Test",
      "Heavy Metals Analysis",
    ],
    assignToSectionInCharge: "user-005",
    status: "SICReview",
    createdAt: "2026-02-05T08:15:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-004",
    customerName: "AlphaVet Biologics",
    contactPerson: "Dr. Ravi Shankar",
    emailAddress: "ravi@alphavet.com",
    sampleName: "Veterinary Vaccine Batch A",
    sampleType: "Biological",
    physicalForm: "Lyophilized",
    dateOfReceipt: "2026-02-07",
    numberOfUnits: 2,
    specialHandling: "Store at -20°C",
    requestedTests: ["Sterility Test", "Microbial Limit Test"],
    assignToSectionInCharge: "user-005",
    status: "Analysis",
    createdAt: "2026-02-07T11:00:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-005",
    customerName: "PharmaCore Industries",
    contactPerson: "Ms. Deepa Nair",
    emailAddress: "deepa@pharmacore.com",
    sampleName: "Metformin HCl 850mg",
    sampleType: "Finished Product",
    physicalForm: "Tablet",
    dateOfReceipt: "2026-02-10",
    numberOfUnits: 8,
    specialHandling: "None",
    requestedTests: ["HPLC Assay", "Dissolution Test", "Heavy Metals Analysis"],
    assignToSectionInCharge: "user-002",
    status: "TestSpec",
    createdAt: "2026-02-10T09:45:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-006",
    customerName: "BioPharm Solutions Ltd",
    contactPerson: "Dr. Anita Patel",
    emailAddress: "anita@biopharm.com",
    sampleName: "Ciprofloxacin Injection",
    sampleType: "Parenteral",
    physicalForm: "Solution",
    dateOfReceipt: "2026-02-12",
    numberOfUnits: 6,
    specialHandling: "Sterile handling required",
    requestedTests: ["Sterility Test", "HPLC Assay"],
    assignToSectionInCharge: ["user-002", "user-005"],
    approvalDecisions: [
      {
        userId: "user-002",
        userName: "Rajesh Malhotra",
        decision: "approved",
        comment: "All checks passed",
        decidedAt: "2026-02-26T15:00:00Z",
      },
      {
        userId: "user-005",
        userName: "James Okonkwo",
        decision: "pending",
        comment: "",
      },
    ],
    status: "EligibilityCheck",
    createdAt: "2026-02-26T14:00:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-007",
    customerName: "GeneriCure Pharmaceuticals",
    contactPerson: "Mr. Suresh Kumar",
    emailAddress: "suresh@genericure.com",
    sampleName: "Atorvastatin 20mg Tablets",
    sampleType: "Finished Product",
    physicalForm: "Tablet",
    dateOfReceipt: "2026-02-14",
    numberOfUnits: 12,
    specialHandling: "None",
    requestedTests: ["HPLC Assay", "Dissolution Test"],
    assignToSectionInCharge: "user-002",
    status: "EligibilityCheck",
    createdAt: "2026-02-14T10:00:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-008",
    customerName: "NovaMed Research Inc",
    contactPerson: "Ms. Kavitha Reddy",
    emailAddress: "kavitha@novamed.com",
    sampleName: "Insulin Glargine 100U/mL",
    sampleType: "Biological",
    physicalForm: "Solution",
    dateOfReceipt: "2026-02-16",
    numberOfUnits: 4,
    specialHandling: "Store at 2-8°C, do not freeze",
    requestedTests: ["Sterility Test", "HPLC Assay", "Particle Size Analysis"],
    assignToSectionInCharge: "user-005",
    status: "Intake",
    createdAt: "2026-02-16T09:30:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-009",
    customerName: "AlphaVet Biologics",
    contactPerson: "Dr. Ravi Shankar",
    emailAddress: "ravi@alphavet.com",
    sampleName: "Doxycycline Hyclate Capsules",
    sampleType: "Finished Product",
    physicalForm: "Capsule",
    dateOfReceipt: "2026-02-18",
    numberOfUnits: 7,
    specialHandling: "None",
    requestedTests: ["HPLC Assay", "Microbial Limit Test"],
    assignToSectionInCharge: "user-002",
    status: "OnHold",
    createdAt: "2026-02-18T11:30:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-010",
    customerName: "PharmaCore Industries",
    contactPerson: "Ms. Deepa Nair",
    emailAddress: "deepa@pharmacore.com",
    sampleName: "Omeprazole 20mg Capsules",
    sampleType: "Finished Product",
    physicalForm: "Capsule",
    dateOfReceipt: "2026-02-20",
    numberOfUnits: 9,
    specialHandling: "None",
    requestedTests: ["HPLC Assay", "Dissolution Test"],
    assignToSectionInCharge: "user-002",
    status: "COA",
    createdAt: "2026-02-20T08:00:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-011",
    customerName: "BioPharm Solutions Ltd",
    contactPerson: "Dr. Anita Patel",
    emailAddress: "anita@biopharm.com",
    sampleName: "Azithromycin 250mg Tablets",
    sampleType: "Finished Product",
    physicalForm: "Tablet",
    dateOfReceipt: "2026-02-22",
    numberOfUnits: 6,
    specialHandling: "None",
    requestedTests: ["HPLC Assay", "Microbial Limit Test"],
    assignToSectionInCharge: "user-002",
    status: "Analysis",
    createdAt: "2026-02-22T10:00:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-012",
    customerName: "GeneriCure Pharmaceuticals",
    contactPerson: "Mr. Suresh Kumar",
    emailAddress: "suresh@genericure.com",
    sampleName: "Losartan Potassium 50mg",
    sampleType: "Finished Product",
    physicalForm: "Tablet",
    dateOfReceipt: "2026-02-24",
    numberOfUnits: 10,
    specialHandling: "None",
    requestedTests: ["HPLC Assay", "Heavy Metals Analysis"],
    assignToSectionInCharge: "user-002",
    status: "TestSpec",
    createdAt: "2026-02-24T09:00:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-013",
    customerName: "NovaMed Research Inc",
    contactPerson: "Ms. Kavitha Reddy",
    emailAddress: "kavitha@novamed.com",
    sampleName: "Ceftriaxone Sodium Injection",
    sampleType: "Parenteral",
    physicalForm: "Powder for Injection",
    dateOfReceipt: "2026-02-25",
    numberOfUnits: 5,
    specialHandling: "Sterile handling",
    requestedTests: ["Sterility Test", "HPLC Assay"],
    assignToSectionInCharge: "user-005",
    status: "Registration",
    createdAt: "2026-02-25T11:00:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-014",
    customerName: "AlphaVet Biologics",
    contactPerson: "Dr. Ravi Shankar",
    emailAddress: "ravi@alphavet.com",
    sampleName: "Vitamin B12 Injection",
    sampleType: "Parenteral",
    physicalForm: "Solution",
    dateOfReceipt: "2026-02-26",
    numberOfUnits: 3,
    specialHandling: "Protect from light",
    requestedTests: ["HPLC Assay", "Sterility Test"],
    assignToSectionInCharge: ["user-002", "user-005"],
    approvalDecisions: [
      {
        userId: "user-002",
        userName: "Rajesh Malhotra",
        decision: "pending",
        comment: "",
      },
      {
        userId: "user-005",
        userName: "James Okonkwo",
        decision: "pending",
        comment: "",
      },
    ],
    status: "EligibilityCheck",
    createdAt: "2026-02-14T10:00:00Z",
    createdBy: "user-007",
  },
  {
    sampleId: "SI-2026-015",
    customerName: "PharmaCore Industries",
    contactPerson: "Ms. Deepa Nair",
    emailAddress: "deepa@pharmacore.com",
    sampleName: "Calcium Carbonate Powder",
    sampleType: "Excipient",
    physicalForm: "Powder",
    dateOfReceipt: "2026-02-28",
    numberOfUnits: 15,
    specialHandling: "None",
    requestedTests: ["Particle Size Analysis", "Heavy Metals Analysis"],
    assignToSectionInCharge: "user-002",
    status: "Intake",
    createdAt: "2026-02-28T09:00:00Z",
    createdBy: "user-007",
  },
];

// ============================================================
// NOTIFICATIONS (15 per user)
// ============================================================
const generateNotifications = (
  userId: string,
  _userName: string,
): NotificationRecord[] => {
  const msgs = [
    {
      msg: "New sample SI-2026-001 assigned to your section",
      link: "/sample-intake",
    },
    {
      msg: "Sample SI-2026-003 requires eligibility check",
      link: "/eligibility-check/SI-2026-003",
    },
    {
      msg: "Analysis results submitted for SI-2026-004",
      link: "/analysis/SI-2026-004",
    },
    {
      msg: "QA review pending for SI-2026-002",
      link: "/qa-review/SI-2026-002",
    },
    {
      msg: "COA generated for SI-2026-001 \u2014 ready for download",
      link: "/coa/SI-2026-001",
    },
    {
      msg: "SLA deadline approaching for SI-2026-005 (2 days remaining)",
      link: "/my-tasks",
    },
    {
      msg: "Sample SI-2026-009 placed on hold \u2014 review required",
      link: "/eligibility-check/SI-2026-009",
    },
    {
      msg: "Test specification saved for SI-2026-005",
      link: "/test-specification/SI-2026-005",
    },
    {
      msg: "Section In-Charge review completed for SI-2026-003",
      link: "/sic-review/SI-2026-003",
    },
    { msg: "New client BioPharm Solutions Ltd registered", link: "/admin" },
    { msg: "Audit trail updated \u2014 3 new entries", link: "/reports" },
    {
      msg: "Sample SI-2026-011 analysis in progress",
      link: "/analysis/SI-2026-011",
    },
    {
      msg: "Registration completed for SI-2026-006",
      link: "/registration/SI-2026-006",
    },
    {
      msg: "Pending approvals: 4 samples awaiting QA review",
      link: "/reports",
    },
    {
      msg: "System maintenance scheduled for March 5, 2026 at 02:00 AM",
      link: "/dashboard",
    },
  ];
  return msgs.map((m, i) => ({
    id: `notif-${userId}-${i + 1}`,
    userId,
    message: m.msg,
    timestamp: new Date(Date.now() - i * 3600000 * 4).toISOString(),
    isRead: i > 7,
    link: m.link,
  }));
};

export const ALL_NOTIFICATIONS: NotificationRecord[] = [
  ...generateNotifications("user-001", "Dr. Sarah Chen"),
  ...generateNotifications("user-002", "Rajesh Malhotra"),
  ...generateNotifications("user-003", "Elena Rodriguez"),
  ...generateNotifications("user-004", "Marcus Chen"),
  ...generateNotifications("user-005", "James Okonkwo"),
  ...generateNotifications("user-006", "Priya Sharma"),
  ...generateNotifications("user-007", "Admin User"),
];

// ============================================================
// TASKS
// ============================================================
export const MOCK_TASKS: TaskRecord[] = [
  {
    id: "task-001",
    sampleId: "SI-2026-007",
    taskType: "eligibilityCheck",
    assignedRole: "sectionInCharge",
    assignedUserId: "user-002",
    deadline: new Date(Date.now() + 86400000).toISOString(),
    priority: "high",
    description: "Perform eligibility check for Atorvastatin 20mg Tablets",
  },
  {
    id: "task-002",
    sampleId: "SI-2026-014",
    taskType: "eligibilityCheck",
    assignedRole: "sectionInCharge",
    assignedUserId: "user-005",
    deadline: new Date(Date.now() + 172800000).toISOString(),
    priority: "medium",
    description: "Perform eligibility check for Vitamin B12 Injection",
  },
  {
    id: "task-003",
    sampleId: "SI-2026-005",
    taskType: "testSpec",
    assignedRole: "sectionInCharge",
    assignedUserId: "user-002",
    deadline: new Date(Date.now() + 259200000).toISOString(),
    priority: "medium",
    description:
      "Assign analysts and set test specifications for Metformin HCl",
  },
  {
    id: "task-004",
    sampleId: "SI-2026-012",
    taskType: "testSpec",
    assignedRole: "sectionInCharge",
    assignedUserId: "user-002",
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    priority: "high",
    description: "Set test specifications for Losartan Potassium 50mg",
  },
  {
    id: "task-005",
    sampleId: "SI-2026-004",
    taskType: "analysis",
    assignedRole: "analyst",
    assignedUserId: "user-004",
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    priority: "high",
    description: "Complete analysis for Veterinary Vaccine Batch A",
  },
  {
    id: "task-006",
    sampleId: "SI-2026-011",
    taskType: "analysis",
    assignedRole: "analyst",
    assignedUserId: "user-003",
    deadline: new Date(Date.now() + 86400000).toISOString(),
    priority: "high",
    description: "Complete HPLC analysis for Azithromycin 250mg Tablets",
  },
  {
    id: "task-007",
    sampleId: "SI-2026-003",
    taskType: "review",
    assignedRole: "sectionInCharge",
    assignedUserId: "user-005",
    deadline: new Date(Date.now() + 43200000).toISOString(),
    priority: "high",
    description: "Section In-Charge review for Ibuprofen Suspension",
  },
  {
    id: "task-008",
    sampleId: "SI-2026-002",
    taskType: "qaReview",
    assignedRole: "qa",
    assignedUserId: "user-001",
    deadline: new Date(Date.now() + 86400000).toISOString(),
    priority: "high",
    description: "QA review and approval for Paracetamol Tablets 500mg",
  },
  {
    id: "task-009",
    sampleId: "SI-2026-006",
    taskType: "registration",
    assignedRole: "analyst",
    assignedUserId: "user-003",
    deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
    priority: "low",
    description: "Complete registration for Ciprofloxacin Injection",
  },
  {
    id: "task-010",
    sampleId: "SI-2026-013",
    taskType: "registration",
    assignedRole: "analyst",
    assignedUserId: "user-006",
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    priority: "medium",
    description: "Complete registration for Ceftriaxone Sodium Injection",
  },
];

// ============================================================
// COA RECORDS
// ============================================================
export const COA_RECORDS: COARecord[] = [
  {
    id: "coa-001",
    sampleId: "SI-2026-001",
    coaNumber: "COA-2026-001",
    registrationNumber: "REG-2026-001",
    clientName: "BioPharm Solutions Ltd",
    sampleName: "Amoxicillin Trihydrate",
    issueDate: "2026-02-15",
    analystName: "Elena Rodriguez",
    sicReviewerName: "Rajesh Malhotra",
    qaApproverName: "Dr. Sarah Chen",
    analystSignDate: "2026-02-12",
    sicSignDate: "2026-02-13",
    qaSignDate: "2026-02-15",
    parameters: [
      {
        parameter: "Assay (% w/w)",
        acceptanceCriteria: "98.0% - 102.0%",
        observedValue: "99.8",
        unit: "%",
        verdict: "PASS",
      },
      {
        parameter: "Related Substances",
        acceptanceCriteria: "NMT 0.5%",
        observedValue: "0.12",
        unit: "%",
        verdict: "PASS",
      },
      {
        parameter: "Water Content",
        acceptanceCriteria: "NMT 1.0%",
        observedValue: "0.45",
        unit: "%",
        verdict: "PASS",
      },
      {
        parameter: "Total Aerobic Count",
        acceptanceCriteria: "NMT 1000 CFU/g",
        observedValue: "< 10",
        unit: "CFU/g",
        verdict: "PASS",
      },
    ],
    overallResult: "PASS",
    complianceStatement:
      "This product complies with the specifications as per USP/BP/IP standards.",
  },
  {
    id: "coa-002",
    sampleId: "SI-2026-010",
    coaNumber: "COA-2026-002",
    registrationNumber: "REG-2026-010",
    clientName: "PharmaCore Industries",
    sampleName: "Omeprazole 20mg Capsules",
    issueDate: "2026-02-28",
    analystName: "Priya Sharma",
    sicReviewerName: "Rajesh Malhotra",
    qaApproverName: "Dr. Sarah Chen",
    analystSignDate: "2026-02-25",
    sicSignDate: "2026-02-26",
    qaSignDate: "2026-02-28",
    parameters: [
      {
        parameter: "Assay (% w/w)",
        acceptanceCriteria: "98.0% - 102.0%",
        observedValue: "100.2",
        unit: "%",
        verdict: "PASS",
      },
      {
        parameter: "Dissolution (Q)",
        acceptanceCriteria: "NLT 80% in 45 min",
        observedValue: "92.5",
        unit: "%",
        verdict: "PASS",
      },
      {
        parameter: "Uniformity of Dosage",
        acceptanceCriteria: "85% - 115%",
        observedValue: "101.3",
        unit: "%",
        verdict: "PASS",
      },
    ],
    overallResult: "PASS",
    complianceStatement:
      "This product complies with the specifications as per USP/BP/IP standards.",
  },
];

// ============================================================
// AUDIT LOG
// ============================================================
export const AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "al-001",
    timestamp: "2026-02-01T09:05:00Z",
    userId: "user-007",
    userName: "Admin User",
    action: "CREATE",
    entity: "SampleIntake",
    entityId: "SI-2026-001",
    details: "Sample intake created for Amoxicillin Trihydrate",
  },
  {
    id: "al-002",
    timestamp: "2026-02-01T10:30:00Z",
    userId: "user-002",
    userName: "Rajesh Malhotra",
    action: "STATUS_CHANGE",
    entity: "SampleIntake",
    entityId: "SI-2026-001",
    details: "Status changed from Intake to EligibilityCheck",
  },
  {
    id: "al-003",
    timestamp: "2026-02-01T11:00:00Z",
    userId: "user-002",
    userName: "Rajesh Malhotra",
    action: "ELIGIBLE",
    entity: "SampleIntake",
    entityId: "SI-2026-001",
    details: "Sample declared eligible after checklist verification",
  },
  {
    id: "al-004",
    timestamp: "2026-02-02T09:00:00Z",
    userId: "user-003",
    userName: "Elena Rodriguez",
    action: "CREATE",
    entity: "RFA",
    entityId: "REG-2026-001",
    details: "Registration REG-2026-001 created for SI-2026-001",
  },
  {
    id: "al-005",
    timestamp: "2026-02-03T10:00:00Z",
    userId: "user-002",
    userName: "Rajesh Malhotra",
    action: "CREATE",
    entity: "TestSpecification",
    entityId: "SI-2026-001",
    details: "Test specifications assigned for 4 parameters",
  },
  {
    id: "al-006",
    timestamp: "2026-02-05T14:00:00Z",
    userId: "user-003",
    userName: "Elena Rodriguez",
    action: "SUBMIT",
    entity: "AnalysisResult",
    entityId: "SI-2026-001",
    details: "Analysis results submitted — Overall: PASS",
  },
  {
    id: "al-007",
    timestamp: "2026-02-06T09:30:00Z",
    userId: "user-002",
    userName: "Rajesh Malhotra",
    action: "APPROVE",
    entity: "ReviewRecord",
    entityId: "SI-2026-001",
    details: "Section In-Charge review approved",
  },
  {
    id: "al-008",
    timestamp: "2026-02-07T11:00:00Z",
    userId: "user-001",
    userName: "Dr. Sarah Chen",
    action: "APPROVE",
    entity: "QAReview",
    entityId: "SI-2026-001",
    details: "QA review approved — COA generation triggered",
  },
  {
    id: "al-009",
    timestamp: "2026-02-07T11:05:00Z",
    userId: "user-001",
    userName: "Dr. Sarah Chen",
    action: "CREATE",
    entity: "COA",
    entityId: "COA-2026-001",
    details: "COA generated for SI-2026-001",
  },
  {
    id: "al-010",
    timestamp: "2026-02-03T10:35:00Z",
    userId: "user-007",
    userName: "Admin User",
    action: "CREATE",
    entity: "SampleIntake",
    entityId: "SI-2026-002",
    details: "Sample intake created for Paracetamol Tablets 500mg",
  },
  {
    id: "al-011",
    timestamp: "2026-02-10T09:50:00Z",
    userId: "user-007",
    userName: "Admin User",
    action: "CREATE",
    entity: "SampleIntake",
    entityId: "SI-2026-005",
    details: "Sample intake created for Metformin HCl 850mg",
  },
  {
    id: "al-012",
    timestamp: "2026-02-18T11:35:00Z",
    userId: "user-002",
    userName: "Rajesh Malhotra",
    action: "HOLD",
    entity: "SampleIntake",
    entityId: "SI-2026-009",
    details: "Sample placed on hold — insufficient documentation",
  },
  {
    id: "al-013",
    timestamp: "2026-02-20T08:05:00Z",
    userId: "user-007",
    userName: "Admin User",
    action: "CREATE",
    entity: "SampleIntake",
    entityId: "SI-2026-010",
    details: "Sample intake created for Omeprazole 20mg Capsules",
  },
  {
    id: "al-014",
    timestamp: "2026-02-28T09:05:00Z",
    userId: "user-001",
    userName: "Dr. Sarah Chen",
    action: "CREATE",
    entity: "COA",
    entityId: "COA-2026-002",
    details: "COA generated for SI-2026-010",
  },
  {
    id: "al-015",
    timestamp: "2026-03-01T10:00:00Z",
    userId: "user-007",
    userName: "Admin User",
    action: "CREATE",
    entity: "User",
    entityId: "user-006",
    details: "New user Priya Sharma created with role Analyst",
  },
];

// ============================================================
// RFA RECORDS (for samples in Registration+ stages)
// ============================================================
export const RFA_RECORDS: RFARecord[] = [
  {
    id: "rfa-001",
    sampleId: "SI-2026-001",
    registrationNumber: "REG-2026-001",
    clientName: "BioPharm Solutions Ltd",
    address: "45 Industrial Estate, Andheri East",
    pinCode: "400069",
    referenceQuotation: "QT-2026-001",
    customerRefNumber: "BP-REF-001",
    entryDate: "2026-02-02",
    person: "Dr. Anita Patel",
    designation: "QA Manager",
    phone: "+91-9876543210",
    emailId: "anita@biopharm.com",
    billingAddressRequired: true,
    clientOrganizationName: "BioPharm Solutions Ltd",
    clientBillingAddress: "45 Industrial Estate, Andheri East, Mumbai",
    contactTelNo: "+91-22-12345678",
    billingContactPerson: "Mr. Finance Head",
    market: "Domestic",
    reportRequiredForm: "Electronic + Hard Copy",
    supplierName: "BioPharm API Division",
    mfgDrugLicNo: "MH-DL-2024-001",
    workorder: "WO-2026-001",
    comments: "Priority sample — expedite testing",
    stpNo: "STP-AMX-001",
    temperatureConditions: "2-8°C",
    sendersFullname: "Dr. Anita Patel",
    einOfReceiver: "EIN-2026-001",
    dateOfReceipt: "2026-02-01",
    others: "",
    testingPurpose: "Release Testing",
    testNames: ["HPLC Assay", "Microbial Limit Test"],
    samplingPoint: "Warehouse",
    sampledBy: "QC Team",
    testMethod: "USP/BP",
    sectionUsers: ["user-003", "user-006"],
    sampleDescription: "White crystalline powder",
    rawFinishedOthers: "Raw Material",
    assigneeType: "Internal",
    sampleDetails: [
      {
        id: "sd-001",
        sampleName: "Amoxicillin Trihydrate",
        batchNumber: "AMX-2026-001",
        arNo: "AR-001",
        batchSize: "500 kg",
        sampleQuantity: "200g",
        originalMfgName: "BioPharm API Division",
        dateOfMfg: "2026-01-15",
        specification: "USP 43",
        testType: "Chemical",
        testParameters: ["Assay", "Related Substances", "Water Content"],
        expiryDate: "2028-01-14",
        natureOfPacking: "HDPE Container",
        retestDate: "2027-01-14",
      },
    ],
  },
];

// ============================================================
// TEST SPECIFICATIONS
// ============================================================
export const TEST_SPECS: Record<string, TestSpecRow[]> = {
  "SI-2026-001": [
    {
      id: "ts-r-001",
      parameter: "Assay (% w/w)",
      acceptanceCriteria: "98.0% - 102.0%",
      methodSop: "SOP-HPLC-001",
      referenceStandard: "USP RS Amoxicillin",
      qaNotes: "Use freshly prepared mobile phase",
      assignedAnalyst: "user-003",
      targetSla: "2026-02-05",
    },
    {
      id: "ts-r-002",
      parameter: "Related Substances",
      acceptanceCriteria: "NMT 0.5%",
      methodSop: "SOP-HPLC-002",
      referenceStandard: "USP RS Amoxicillin Impurities",
      qaNotes: "",
      assignedAnalyst: "user-003",
      targetSla: "2026-02-05",
    },
    {
      id: "ts-r-003",
      parameter: "Water Content",
      acceptanceCriteria: "NMT 1.0%",
      methodSop: "SOP-KF-001",
      referenceStandard: "Water Standard",
      qaNotes: "",
      assignedAnalyst: "user-006",
      targetSla: "2026-02-04",
    },
    {
      id: "ts-r-004",
      parameter: "Total Aerobic Count",
      acceptanceCriteria: "NMT 1000 CFU/g",
      methodSop: "SOP-MLT-001",
      referenceStandard: "N/A",
      qaNotes: "Incubate at 30-35°C for 5 days",
      assignedAnalyst: "user-004",
      targetSla: "2026-02-07",
    },
  ],
  "SI-2026-002": [
    {
      id: "ts-r-005",
      parameter: "Assay (% w/w)",
      acceptanceCriteria: "98.0% - 102.0%",
      methodSop: "SOP-HPLC-003",
      referenceStandard: "USP RS Paracetamol",
      qaNotes: "",
      assignedAnalyst: "user-003",
      targetSla: "2026-02-10",
    },
    {
      id: "ts-r-006",
      parameter: "Dissolution (Q)",
      acceptanceCriteria: "NLT 80% in 45 min",
      methodSop: "SOP-DISS-001",
      referenceStandard: "N/A",
      qaNotes: "Use Apparatus II at 50 rpm",
      assignedAnalyst: "user-006",
      targetSla: "2026-02-10",
    },
  ],
  "SI-2026-004": [
    {
      id: "ts-r-007",
      parameter: "Sterility",
      acceptanceCriteria: "No growth",
      methodSop: "SOP-STR-001",
      referenceStandard: "Ph. Eur. 2.6.1",
      qaNotes: "Conduct under LAF hood",
      assignedAnalyst: "user-006",
      targetSla: "2026-02-18",
    },
    {
      id: "ts-r-008",
      parameter: "Microbial Limit Test",
      acceptanceCriteria: "NMT 100 CFU/mL",
      methodSop: "SOP-MLT-002",
      referenceStandard: "N/A",
      qaNotes: "Incubate at 30-35°C for 5 days",
      assignedAnalyst: "user-004",
      targetSla: "2026-02-20",
    },
    {
      id: "ts-r-009",
      parameter: "pH",
      acceptanceCriteria: "6.5 – 7.5",
      methodSop: "SOP-PH-001",
      referenceStandard: "N/A",
      qaNotes: "",
      assignedAnalyst: "user-003",
      targetSla: "2026-02-15",
    },
    {
      id: "ts-r-010",
      parameter: "Moisture Content",
      acceptanceCriteria: "NMT 3.0%",
      methodSop: "SOP-KF-002",
      referenceStandard: "Water Standard",
      qaNotes: "Use lyophilized sample as-is",
      assignedAnalyst: "user-006",
      targetSla: "2026-02-16",
    },
  ],
  "SI-2026-011": [
    {
      id: "ts-r-011",
      parameter: "Assay (% w/w)",
      acceptanceCriteria: "93.0% - 107.0%",
      methodSop: "SOP-HPLC-005",
      referenceStandard: "USP RS Azithromycin",
      qaNotes: "",
      assignedAnalyst: "user-003",
      targetSla: "2026-03-01",
    },
    {
      id: "ts-r-012",
      parameter: "Related Substances",
      acceptanceCriteria: "NMT 1.0%",
      methodSop: "SOP-HPLC-006",
      referenceStandard: "USP RS Azithromycin Impurities",
      qaNotes: "Check all specified impurities",
      assignedAnalyst: "user-003",
      targetSla: "2026-03-02",
    },
    {
      id: "ts-r-013",
      parameter: "Microbial Limit Test",
      acceptanceCriteria: "NMT 1000 CFU/g (Total Aerobic)",
      methodSop: "SOP-MLT-001",
      referenceStandard: "N/A",
      qaNotes: "",
      assignedAnalyst: "user-004",
      targetSla: "2026-03-04",
    },
    {
      id: "ts-r-014",
      parameter: "Dissolution (Q)",
      acceptanceCriteria: "NLT 75% in 30 min",
      methodSop: "SOP-DISS-002",
      referenceStandard: "N/A",
      qaNotes: "Apparatus II, 75 rpm, pH 6.8 buffer",
      assignedAnalyst: "user-006",
      targetSla: "2026-03-03",
    },
  ],
};

// ============================================================
// ANALYSIS RESULTS
// ============================================================
export const ANALYSIS_RESULTS: Record<string, AnalysisResultRow[]> = {
  "SI-2026-001": [
    {
      id: "ar-001",
      parameter: "Assay (% w/w)",
      acceptanceCriteria: "98.0% - 102.0%",
      observedValue: "99.8",
      unit: "%",
      verdict: "PASS",
      testDateStart: "2026-02-03",
      testDateEnd: "2026-02-05",
      remarks: "Within specification",
    },
    {
      id: "ar-002",
      parameter: "Related Substances",
      acceptanceCriteria: "NMT 0.5%",
      observedValue: "0.12",
      unit: "%",
      verdict: "PASS",
      testDateStart: "2026-02-03",
      testDateEnd: "2026-02-05",
      remarks: "Well within limit",
    },
    {
      id: "ar-003",
      parameter: "Water Content",
      acceptanceCriteria: "NMT 1.0%",
      observedValue: "0.45",
      unit: "%",
      verdict: "PASS",
      testDateStart: "2026-02-03",
      testDateEnd: "2026-02-04",
      remarks: "",
    },
    {
      id: "ar-004",
      parameter: "Total Aerobic Count",
      acceptanceCriteria: "NMT 1000 CFU/g",
      observedValue: "< 10",
      unit: "CFU/g",
      verdict: "PASS",
      testDateStart: "2026-02-03",
      testDateEnd: "2026-02-07",
      remarks: "No growth observed",
    },
  ],
  "SI-2026-003": [
    {
      id: "ar-005",
      parameter: "Assay (% w/w)",
      acceptanceCriteria: "98.0% - 102.0%",
      observedValue: "101.2",
      unit: "%",
      verdict: "PASS",
      testDateStart: "2026-02-10",
      testDateEnd: "2026-02-12",
      remarks: "",
    },
    {
      id: "ar-006",
      parameter: "Total Aerobic Count",
      acceptanceCriteria: "NMT 1000 CFU/g",
      observedValue: "250",
      unit: "CFU/g",
      verdict: "PASS",
      testDateStart: "2026-02-10",
      testDateEnd: "2026-02-15",
      remarks: "Within limit",
    },
    {
      id: "ar-007",
      parameter: "Lead (Pb)",
      acceptanceCriteria: "NMT 5 ppm",
      observedValue: "1.2",
      unit: "ppm",
      verdict: "PASS",
      testDateStart: "2026-02-10",
      testDateEnd: "2026-02-12",
      remarks: "",
    },
  ],
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
export function getStatusLabel(status: WorkflowStage): string {
  const labels: Record<WorkflowStage, string> = {
    Intake: "Intake",
    EligibilityCheck: "Eligibility Check",
    Registration: "Registration",
    TestSpec: "Test Specification",
    Analysis: "Analysis",
    SICReview: "SIC Review",
    QAReview: "QA Review",
    COA: "COA Issued",
    OnHold: "On Hold",
    Rejected: "Rejected",
    PendingApproval: "Pending Approval",
  };
  return labels[status] || status;
}

export function getStatusBadgeClass(status: WorkflowStage): string {
  const classes: Record<WorkflowStage, string> = {
    Intake: "badge-intake",
    EligibilityCheck: "badge-eligibility",
    Registration: "badge-registration",
    TestSpec: "badge-testspec",
    Analysis: "badge-analysis",
    SICReview: "badge-sicreview",
    QAReview: "badge-qareview",
    COA: "badge-coa",
    OnHold: "badge-hold",
    Rejected: "badge-rejected",
    PendingApproval: "badge-pending-approval",
  };
  return classes[status] || "badge-pending";
}

export function getUserById(id: string): DummyUser | undefined {
  return DUMMY_USERS.find((u) => u.id === id);
}

export function getClientById(id: string): Client | undefined {
  return CLIENTS.find((c) => c.id === id);
}

export function getSampleById(id: string): SampleIntakeRecord | undefined {
  return SAMPLE_INTAKES.find((s) => s.sampleId === id);
}

export function getWorkflowStageOrder(stage: WorkflowStage): number {
  const order: Record<WorkflowStage, number> = {
    Intake: 0,
    EligibilityCheck: 1,
    Registration: 2,
    TestSpec: 3,
    Analysis: 4,
    SICReview: 5,
    QAReview: 6,
    COA: 7,
    OnHold: -1,
    Rejected: -2,
    PendingApproval: 1,
  };
  return order[stage] ?? 0;
}
