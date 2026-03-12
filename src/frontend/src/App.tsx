import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import AboutPage from "./pages/AboutPage";
import AdminPage from "./pages/AdminPage";
import AnalysisPage from "./pages/AnalysisPage";
import ConsultancyPage from "./pages/ConsultancyPage";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import MentoringPage from "./pages/MentoringPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // No caching by default for immediate updates
      gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: 2,
    },
  },
});

function Layout() {
  const { identity } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sobre-mi",
  component: AboutPage,
});

const analysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analisis",
  component: AnalysisPage,
});

const consultancyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/consultorias",
  component: ConsultancyPage,
});

const mentoringRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mentorias",
  component: MentoringPage,
});

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contacto",
  component: ContactPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  analysisRoute,
  consultancyRoute,
  mentoringRoute,
  contactRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
