import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import Load from "../components/reuse/Load";
import ProtectedRoute from "./protectRoutes";
import AuthRouter from "./Authrouter";
import ScrollToTop from "../components/reuse/ScrollToTop";

// eslint-disable-next-line no-unused-vars
const withSuspense = (Component) => (
  <Suspense fallback={<Load />}>
    <Component />
  </Suspense>
);

const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const AdminDashboard = lazy(() => import("../pages/Dashboard/AdminDashboard"));
const AllEvents = lazy(() => import("../pages/Events/AllEvents"));
const AllAdminEvents = lazy(() => import("../pages/AdminEvents/AllAdminEvents"));
const CreateEvent = lazy(() => import("../pages/Events/CreateEvent/CreateEvent"));
const Login = lazy(() => import("../pages/Login/Login"));
const Register = lazy(() => import("../pages/Login/Register"));
const AccountDetails = lazy(() => import("../pages/Profile/AccountDetails"));
const Personal = lazy(() => import("../pages/Profile/Personal"));
const Regular = lazy(() => import("../pages/Regular/Regular"));
const EventDetails = lazy(() => import("../pages/Events/EventDetails"));
const AddTicket = lazy(() => import("../pages/Events/AddTicket"));
const AllUsers = lazy(() => import("../pages/Users/AllUsers"));
const UsersDetails = lazy(() => import("../pages/Users/UsersDetails"));
const PublicEventPage = lazy(() => import("../pages/Public/PublicEventPage"));
const EventListingPage = lazy(() => import("../pages/Public/EventListingPage/EventListingPage"));
const PaymentVerification = lazy(() => import("../pages/Public/PaymentVerification"));
const SalesSummary = lazy(() => import("../pages/Sales/SalesSummary"));
const ManageEventTickets = lazy(() => import("../pages/Events/ManageEventTickets"));
const UpdateTicket = lazy(() => import("../pages/Events/UpdateTicket"));
const PromoCode = lazy(() => import("../pages/Events/PromoCode"));
const PayoutSummary = lazy(() => import("../pages/Sales/PayoutSummary"));
const SingleUser = lazy(() => import("../pages/Users/SingleUser"));
const PlatformFee = lazy(() => import("../pages/Platform/PlatformFee"));
const Broadcast = lazy(() => import("../pages/Platform/Broadcast"));
const AllPayouts = lazy(() => import("../pages/Sales/AllPayouts"));
const UserBroadcast = lazy(() => import("../pages/Platform/UserBroadcast"));
const PayoutDetails = lazy(() => import("../pages/Sales/PayoutDetails"));
const SingleEvents = lazy(() => import("../pages/AdminEvents/SingleEvents"));
const Account = lazy(() => import("../pages/Dashboard/Account"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"))
const QR = lazy(() => import("../pages/QR/QR"));
const CheckIn = lazy(() => import("../pages/Public/CheckInPage/CheckIn"))

const routesConfig = [
  // Public routes (no authentication required)
  {
    path: "/events/:customUrl",
    element: (
      <>
        <ScrollToTop />
        {withSuspense(PublicEventPage)}
      </>
    ),
  },
  {
    path: "/events/check-in/:eventId",
    element: (
      <>
        <ScrollToTop />
        {withSuspense(CheckIn)}
      </>
    ),
  },
  {
    path: "/events/listing",
    element: (
      <>
        <ScrollToTop />
        {withSuspense(EventListingPage)}
      </>
    ),
  },
  {
    path: "/payment/verify",
    element: (
      <>
        <ScrollToTop />
        {withSuspense(PaymentVerification)}
      </>
    ),
  },
  {
    path: "/events/*",
    element: (
      <>
        <ScrollToTop />
        {withSuspense(NotFound)}
      </>
    ),
  },
  {
    path: "/register",
    element: <AuthRouter>{withSuspense(Register)}</AuthRouter>,
  },
  {
    path: "/login",
    element: <AuthRouter>{withSuspense(Login)}</AuthRouter>,
  },

  // Protected routes (require authentication)
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
        <ScrollToTop />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        // element: withSuspense(Dashboard),
        element: (
          <Suspense fallback={<Load />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: "/admin",
        // element: withSuspense(AdminDashboard),
        element: (
          <Suspense fallback={<Load />}>
            <AdminDashboard />
          </Suspense>
        ),
      },
      {
        path: "/events/all",
        // element: withSuspense(AllEvents),
        element: (
          <Suspense fallback={<Load />}>
            <AllEvents />
          </Suspense>
        ),
      },
      {
        path: "/admin/events/all",
        // element: withSuspense(AllAdminEvents),
        element: (
          <Suspense fallback={<Load />}>
            <AllAdminEvents />
          </Suspense>
        ),
      },
      {
        path: "/events/create",
        // element: withSuspense(CreateEvent),
        element: (
          <Suspense fallback={<Load />}>
            <CreateEvent />
          </Suspense>
        ),
      },
      {
        path: "/profile/account-information",
        // element: withSuspense(Account),
        element: (
          <Suspense fallback={<Load />}>
            <AccountDetails />
          </Suspense>
        ),
      },
      {
        path: "/profile/personal-information",
        // element: withSuspense(Personal),
        element: (
          <Suspense fallback={<Load />}>
            <Personal />
          </Suspense>
        ),
      },
      {
        path: "/events/details/:eventId",
        // element: withSuspense(EventDetails),
        element: (
          <Suspense fallback={<Load />}>
            <EventDetails />
          </Suspense>
        ),
      },
      {
        path: "/events/:eventId/create-ticket",
        // element: withSuspense(AddTicket),
        element: (
          <Suspense fallback={<Load />}>
            <AddTicket />
          </Suspense>
        ),
      },
      {
        path: "/regular",
        // element: withSuspense(Regular),
        element: (
          <Suspense fallback={<Load />}>
            <Regular />
          </Suspense>
        ),
      },
      {
        path: "/admin/users",
        // element: withSuspense(AllUsers),
        element: (
          <Suspense fallback={<Load />}>
            <AllUsers />
          </Suspense>
        ),
      },
      {
        path: "/admin/users/:id",
        // element: withSuspense(SingleUser),
        element: (
          <Suspense fallback={<Load />}>
            <SingleUser />
          </Suspense>
        ),
      },
      {
        path: "/users/:id",
        // element: withSuspense(UsersDetails),
        element: (
          <Suspense fallback={<Load />}>
            <UsersDetails />
          </Suspense>
        ),
      },
      {
        path: "/events/sales/:eventId",
        // element: withSuspense(SalesSummary),
        element: (
          <Suspense fallback={<Load />}>
            <SalesSummary />
          </Suspense>
        ),
      },
      {
        path: "/events/ticket/:eventId",
        // element: withSuspense(ManageEventTickets),
        element: (
          <Suspense fallback={<Load />}>
            <ManageEventTickets />
          </Suspense>
        ),
      },
      {
        path: "/ticket/:ticketId",
        // element: withSuspense(UpdateTicket),
        element: (
          <Suspense fallback={<Load />}>
            <UpdateTicket />
          </Suspense>
        ),
      },
      {
        path: "/events/promo-code/:eventId",
        // element: withSuspense(PromoCode),
        element: (
          <Suspense fallback={<Load />}>
            <PromoCode />
          </Suspense>
        ),
      },
      {
        // element: withSuspense(PayoutSummary),
        path: "/events/payout/:eventId",
        element: (
          <Suspense fallback={<Load />}>
            <PayoutSummary />
          </Suspense>
        ),
      },
      {
        path: "/admin/tools/fees",
        // element: withSuspense(PlatformFee),
        element: (
          <Suspense fallback={<Load />}>
            <PlatformFee />
          </Suspense>
        ),
      },
      {
        path: "/admin/tools/broadcast",
        // element: withSuspense(Broadcast),
        element: (
          <Suspense fallback={<Load />}>
            <Broadcast />
          </Suspense>
        ),
      },
      {
        path: "/users/broadcasts",
        // element: withSuspense(Broadcast),
        element: (
          <Suspense fallback={<Load />}>
            <UserBroadcast />
          </Suspense>
        ),
      },
      {
        path: "/admin/tools/payouts" ,
        // element: withSuspense(Broadcast),
        element: (
          <Suspense fallback={<Load />}>
            <AllPayouts />
          </Suspense>
        ),
      },
      {
        path: "/admin/payouts/:payoutId" ,
        // element: withSuspense(Broadcast),
        element: (
          <Suspense fallback={<Load />}>
            <PayoutDetails />
          </Suspense>
        ),
      },
      {
        path: "/payouts/:payoutId",
        element: (
          <Suspense fallback={<Load />}>
            <PayoutDetails />
          </Suspense>
        )
      },
      {
        path: "/admin/events/:eventId",
        element: (
          <Suspense fallback={<Load />}>
            <SingleEvents />
          </Suspense>
        )
      },
      {
        path: "/admin/accounts",
        element: (
          <Suspense fallback={<Load />}>
            <Account />
          </Suspense>
        )
      },
      {
        path: "/events/qr-code",
        element: (
          <Suspense fallback={<Load />}>
            <QR />
          </Suspense>
        )
      },
    ],
  },
];

export const mainRouter = createBrowserRouter(routesConfig);
