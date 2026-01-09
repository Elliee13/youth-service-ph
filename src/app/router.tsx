import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { SiteLayout } from "../components/layout/SiteLayout";
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
const Programs = lazy(() => import("../pages/Programs"));
const ProgramDetail = lazy(() => import("../pages/ProgramDetail"));
const MembershipChapter = lazy(() => import("../pages/MembershipChapter"));
const VolunteerOpportunities = lazy(() => import("../pages/VolunteerOpportunities"));
const Contact = lazy(() => import("../pages/Contact"));

const SignIn = lazy(() => import("../pages/SignIn"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const ChapterHeadDashboard = lazy(() => import("../pages/ChapterHeadDashboard"));

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: withSuspense(<Home />) },
      { path: "/programs", element: withSuspense(<Programs />) },
      { path: "/programs/:id", element: withSuspense(<ProgramDetail />) },
      { path: "/membership-and-chapter", element: withSuspense(<MembershipChapter />) },
      { path: "/volunteer-opportunities", element: withSuspense(<VolunteerOpportunities />) },
      { path: "/contact", element: withSuspense(<Contact />) },

      { path: "/sign-in", element: withSuspense(<SignIn />) },

      {
        path: "/admin",
        element: withSuspense(
          <RequireRole role="admin">
            <AdminDashboard />
          </RequireRole>
        ),
      },
      {
        path: "/chapter-head",
        element: withSuspense(
          <RequireRole role="chapter_head">
            <ChapterHeadDashboard />
          </RequireRole>
        ),
      },
    ],
  },
]);
