import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
import { HomeScreen } from "./components/HomeScreen";
import { ViewEntriesScreen } from "./components/ViewEntriesScreen";
import { SingleEntryScreen } from "./components/SingleEntryScreen";
import { DebugScreen } from "./components/DebugScreen";
import { VoiceRecorder } from "./components/VoiceRecorder";
import { TranscriptProcessor } from "./components/TranscriptProcessor";
import { HistoryView } from "./components/HistoryView";
import { ManualEntryScreen } from "./components/ManualEntryScreen";
import { EditExistingEntryScreen } from "./components/EditExistingEntryScreen";
import { EditValidationScreen } from "./components/EditValidationScreen";
import { AgentScreen } from "./components/AgentScreen";
import { ExpensesScreen } from "./components/ExpensesScreen";
import { useAuth } from "./hooks/useAuth";
import DesignSystem from "./components/DesignSystem";

// Root layout component
function RootLayout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Route content */}
      <Outlet />
    </div>
  );
}

// Root route with the app layout
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Home route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeScreen,
});

// Add Entry route (voice recorder)
const addEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/add-entry",
  component: VoiceRecorder,
});

// View Entries route (placeholder)
const viewEntriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/view-entries",
  component: ViewEntriesScreen,
});

// Single Entry route
const singleEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/view-entry/$id",
  component: SingleEntryScreen,
});

// Edit Existing Entry route (for editing saved entries)
const editExistingEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/edit-entry/$id",
  component: EditExistingEntryScreen,
});

// Debug route
const debugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/debug",
  component: DebugScreen,
});

// Debug sub-routes
const debugTranscriptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/debug/transcript",
  component: TranscriptProcessor,
});

const debugHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/debug/history",
  component: HistoryView,
});

const debugManualEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/debug/manual-entry",
  component: ManualEntryScreen,
});

const debugDesignSystemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/debug/design-system",
  component: DesignSystem,
});

const debugEditValidationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/debug/edit-validation",
  component: EditValidationScreen,
});

// Add Text Entry route
const addTextEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/add-text-entry",
  component: ManualEntryScreen,
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search.date === 'string' ? search.date : undefined,
  }),
});

// Agent route
const agentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/agent",
  component: AgentScreen,
});

// Expenses route
const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses",
  component: ExpensesScreen,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  addEntryRoute,
  addTextEntryRoute,
  agentRoute,
  expensesRoute,
  viewEntriesRoute,
  singleEntryRoute,
  editExistingEntryRoute,
  debugRoute,
  debugTranscriptRoute,
  debugHistoryRoute,
  debugManualEntryRoute,
  debugDesignSystemRoute,
  debugEditValidationRoute,
]);

// Create the router
export const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
