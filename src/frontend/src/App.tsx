import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import React from "react";
import { Layout } from "./components/Layout";
import { RoleProvider } from "./contexts/RoleContext";
import { AdminPanel } from "./pages/AdminPanel";
import { Analysis } from "./pages/Analysis";
import ApiDocs from "./pages/ApiDocs";
import { COA } from "./pages/COA";
import { Calculator } from "./pages/Calculator";
import { Dashboard } from "./pages/Dashboard";
import { EligibilityCheck } from "./pages/EligibilityCheck";
import { MyTasks } from "./pages/MyTasks";
import { Notifications } from "./pages/Notifications";
import { QAReview } from "./pages/QAReview";
import { Reports } from "./pages/Reports";
import { SICReview } from "./pages/SICReview";
import { SampleIntake } from "./pages/SampleIntake";
import { SampleRegistration } from "./pages/SampleRegistration";
import { TestMasters } from "./pages/TestMasters";
import { TestSpecification } from "./pages/TestSpecification";

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <RoleProvider>
      <Layout />
    </RoleProvider>
  ),
});

// Page routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});
const sampleIntakeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sample-intake",
  component: SampleIntake,
});
const eligibilityCheckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/eligibility-check",
  component: () => <EligibilityCheck />,
});
const eligibilityCheckSampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/eligibility-check/$sampleId",
  component: () => {
    const { sampleId } = eligibilityCheckSampleRoute.useParams();
    return <EligibilityCheck sampleId={sampleId} />;
  },
});
const registrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/registration",
  component: () => <SampleRegistration />,
});
const registrationSampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/registration/$sampleId",
  component: () => {
    const { sampleId } = registrationSampleRoute.useParams();
    return <SampleRegistration sampleId={sampleId} />;
  },
});
const testSpecRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/test-specification",
  component: () => <TestSpecification />,
});
const testSpecSampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/test-specification/$sampleId",
  component: () => {
    const { sampleId } = testSpecSampleRoute.useParams();
    return <TestSpecification sampleId={sampleId} />;
  },
});
const analysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analysis",
  component: () => <Analysis />,
});
const analysisSampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analysis/$sampleId",
  component: () => {
    const { sampleId } = analysisSampleRoute.useParams();
    return <Analysis sampleId={sampleId} />;
  },
});
const sicReviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sic-review",
  component: () => <SICReview />,
});
const sicReviewSampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sic-review/$sampleId",
  component: () => {
    const { sampleId } = sicReviewSampleRoute.useParams();
    return <SICReview sampleId={sampleId} />;
  },
});
const qaReviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/qa-review",
  component: () => <QAReview />,
});
const qaReviewSampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/qa-review/$sampleId",
  component: () => {
    const { sampleId } = qaReviewSampleRoute.useParams();
    return <QAReview sampleId={sampleId} />;
  },
});
const coaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/coa",
  component: () => <COA />,
});
const coaSampleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/coa/$sampleId",
  component: () => {
    const { sampleId } = coaSampleRoute.useParams();
    return <COA sampleId={sampleId} />;
  },
});
const myTasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-tasks",
  component: MyTasks,
});
const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: Notifications,
});
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: Reports,
});
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPanel,
});
const testMastersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/test-masters",
  component: TestMasters,
});
const calculatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calculator",
  component: Calculator,
});
const apiDocsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/api-docs",
  component: ApiDocs,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  sampleIntakeRoute,
  eligibilityCheckRoute,
  eligibilityCheckSampleRoute,
  registrationRoute,
  registrationSampleRoute,
  testSpecRoute,
  testSpecSampleRoute,
  analysisRoute,
  analysisSampleRoute,
  sicReviewRoute,
  sicReviewSampleRoute,
  qaReviewRoute,
  qaReviewSampleRoute,
  coaRoute,
  coaSampleRoute,
  myTasksRoute,
  notificationsRoute,
  reportsRoute,
  adminRoute,
  testMastersRoute,
  calculatorRoute,
  apiDocsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
