import React, { Suspense, lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { AdminLayout } from "../components/layout/AdminLayout";
import { ChapterHeadLayout } from "../components/layout/ChapterHeadLayout";
import RouteError from "./RouteError";
import { RequireRole } from "../auth/RequireRole";

function withSuspense(node: React.ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="py-20">
          <div className="h-6 w-48 rounded bg-black/5" />
          <div className="mt-4 h-4 w-80 rounded bg-black/5" />
        </div>
      }
    >
      {node}
    </Suspense>
  );
}

const Home = lazy(() => import("../pages/Home"));
const About = lazy(() => import("../pages/About"));
const Programs = lazy(() => import("../pages/Programs"));
const ProgramDetail = lazy(() => import("../pages/ProgramDetail"));
const MembershipChapter = lazy(() => import("../pages/MembershipChapter"));
const VolunteerOpportunities = lazy(() => import("../pages/VolunteerOpportunities"));
const Contact = lazy(() => import("../pages/Contact"));

const SignIn = lazy(() => import("../pages/SignIn"));
const Register = lazy(() => import("../pages/Register"));
const MyAccount = lazy(() => import("../pages/MyAccount"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const AdminStaff = lazy(() => import("../pages/AdminStaff"));
const AdminVolunteers = lazy(() => import("../pages/AdminVolunteers"));
const AdminAnnouncements = lazy(() => import("../pages/AdminAnnouncements"));
const ChapterHeadDashboard = lazy(() => import("../pages/ChapterHeadDashboard"));
const ChapterHeadVolunteers = lazy(() => import("../pages/ChapterHeadVolunteers"));
const ChapterHeadReports = lazy(() => import("../pages/ChapterHeadReports"));

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: withSuspense(<Home />) },
      { path: "/about", element: withSuspense(<About />) },
      { path: "/programs", element: withSuspense(<Programs />) },
      { path: "/programs/:id", element: withSuspense(<ProgramDetail />) },
      { path: "/membership-and-chapter", element: withSuspense(<MembershipChapter />) },
      { path: "/volunteer-opportunities", element: withSuspense(<VolunteerOpportunities />) },
      { path: "/contact", element: withSuspense(<Contact />) },

      { path: "/staff", element: withSuspense(<SignIn />) },
      { path: "/staff/signin", element: <Navigate to="/staff" replace /> },
      { path: "/sign-in", element: <Navigate to="/staff" replace /> },
      { path: "/register", element: withSuspense(<Register />) },
      { path: "/my-account", element: withSuspense(<MyAccount />) },
      {
        path: "/notifications",
        element: withSuspense(
          <NotificationsPage
            surface="public"
            title="Your notifications"
            subtitle="Track volunteer applications, announcements, and account updates."
          />
        ),
      },
    ],
  },
  {
    path: "/admin",
    element: withSuspense(
      <RequireRole role="admin">
        <AdminLayout />
      </RequireRole>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: withSuspense(<AdminDashboard />) },
      {
        path: "programs",
        element: withSuspense(
          <AdminDashboard
            forcedTab="programs"
            showOverview={false}
            showTabs={false}
            title="Programs"
            subtitle="Manage published program content and media."
          />
        ),
      },
      {
        path: "chapters",
        element: withSuspense(
          <AdminDashboard
            forcedTab="chapters"
            showOverview={false}
            showTabs={false}
            title="Chapters"
            subtitle="Manage chapter profiles, locations, and contact details."
          />
        ),
      },
      {
        path: "opportunities",
        element: withSuspense(
          <AdminDashboard
            forcedTab="opportunities"
            showOverview={false}
            showTabs={false}
            title="Volunteer Opportunities"
            subtitle="Create and manage volunteer opportunities across all chapters."
          />
        ),
      },
      { path: "volunteers", element: withSuspense(<AdminVolunteers />) },
      { path: "staff", element: withSuspense(<AdminStaff />) },
      {
        path: "notifications",
        element: withSuspense(
          <NotificationsPage
            surface="staff"
            title="Staff notifications"
            subtitle="Review approval requests, workflow updates, and announcements."
          />
        ),
      },
      { path: "announcements", element: withSuspense(<AdminAnnouncements />) },
      {
        path: "settings",
        element: withSuspense(
          <AdminDashboard
            forcedTab="settings"
            showOverview={false}
            showTabs={false}
            title="Settings"
            subtitle="Update core site stats and public contact details."
          />
        ),
      },
    ],
  },
  {
    path: "/chapter-head",
    element: withSuspense(
      <RequireRole role="chapter_head">
        <ChapterHeadLayout />
      </RequireRole>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: withSuspense(<ChapterHeadDashboard />) },
      {
        path: "opportunities",
        element: withSuspense(
          <ChapterHeadDashboard
            showOverview={false}
            title="My Opportunities"
            subtitle="Create and manage volunteer opportunities for your assigned chapter."
          />
        ),
      },
      { path: "volunteers", element: withSuspense(<ChapterHeadVolunteers />) },
      { path: "reports", element: withSuspense(<ChapterHeadReports />) },
      {
        path: "notifications",
        element: withSuspense(
          <NotificationsPage
            surface="staff"
            title="Chapter notifications"
            subtitle="Track approvals, volunteer activity, and chapter announcements."
          />
        ),
      },
    ],
  },
]);
