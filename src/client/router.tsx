import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router'
import { HomeScreen } from './components/HomeScreen'
import { ViewEntriesScreen } from './components/ViewEntriesScreen'
import { SingleEntryScreen } from './components/SingleEntryScreen'
import { DebugScreen } from './components/DebugScreen'
import { VoiceRecorder } from './components/VoiceRecorder'
import { TranscriptProcessor } from './components/TranscriptProcessor'
import { HistoryView } from './components/HistoryView'
import { ManualEntryScreen } from './components/ManualEntryScreen'
import { useAuth } from './hooks/useAuth'

// Root layout component
function RootLayout() {
  const { logout } = useAuth();

  return (
    <div className="container mx-auto p-4">
      {/* Header with logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Health Tracker</h1>
        <button
          onClick={logout}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
      
      {/* Route content */}
      <main className="max-w-4xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

// Root route with the app layout
const rootRoute = createRootRoute({
  component: RootLayout,
})

// Home route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeScreen,
})

// Add Entry route (voice recorder)
const addEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/add-entry',
  component: VoiceRecorder,
})

// View Entries route (placeholder)
const viewEntriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/view-entries',
  component: ViewEntriesScreen,
})

// Single Entry route
const singleEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/view-entry/$id',
  component: SingleEntryScreen,
})

// Debug route
const debugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug',
  component: DebugScreen,
})

// Debug sub-routes
const debugTranscriptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug/transcript',
  component: TranscriptProcessor,
})

const debugHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug/history',
  component: HistoryView,
})

const debugManualEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug/manual-entry',
  component: ManualEntryScreen,
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  addEntryRoute,
  viewEntriesRoute,
  singleEntryRoute,
  debugRoute,
  debugTranscriptRoute,
  debugHistoryRoute,
  debugManualEntryRoute,
])

// Create the router
export const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
} 