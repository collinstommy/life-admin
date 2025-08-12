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
import { useAuth } from "./hooks/useAuth";
import DesignSystem from "./components/DesignSystem";

// Root layout component
function RootLayout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Minimal header with logout - only shows on home screen */}
      <div className="absolute right-4 top-4 z-50">
        <button
          onClick={logout}
          className="rounded-md bg-gray-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-gray-600"
        >
          Sign Out
        </button>
      </div>

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

// Add Text Entry route
const addTextEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/add-text-entry",
  component: ManualEntryScreen,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  addEntryRoute,
  addTextEntryRoute, // Add this line
  viewEntriesRoute,
  singleEntryRoute,
  editExistingEntryRoute,
  debugRoute,
  debugTranscriptRoute,
  debugHistoryRoute,
  debugManualEntryRoute,
  debugDesignSystemRoute,
]);

// Create the router
export const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
