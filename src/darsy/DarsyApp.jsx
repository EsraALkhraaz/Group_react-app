import React from 'react';
import { HashRouter, Route, Switch, Redirect, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppContext';
import Entrance from './screens/Entrance';
import Home from './screens/Home';
import ParentHome from './screens/ParentHome';
import TeacherHome from './screens/TeacherHome';
import Children from './screens/Children';
import Search from './screens/Search';
import Results from './screens/Results';
import TeacherProfile from './screens/TeacherProfile';
import Booking from './screens/Booking';
import BookingDetails from './screens/BookingDetails';
import MyBookings from './screens/MyBookings';
import Notifications from './screens/Notifications';
import Account from './screens/Account';
import TeacherRequests from './screens/TeacherRequests';
import TeacherSchedule from './screens/TeacherSchedule';
import TeacherProfileEdit from './screens/TeacherProfileEdit';
import TeacherAvailability from './screens/TeacherAvailability';
import Login from './screens/auth/Login';
import Signup from './screens/auth/Signup';
import VerifyPhone from './screens/auth/VerifyPhone';
import ForgotPassword from './screens/auth/ForgotPassword';
import ResetPassword from './screens/auth/ResetPassword';
import PersonalDetails from './screens/settings/PersonalDetails';
import Payments from './screens/settings/Payments';
import Security from './screens/settings/Security';
import AdminHome from './screens/admin/AdminHome';
import AdminPayments from './screens/admin/AdminPayments';
import AdminPayouts from './screens/admin/AdminPayouts';
import AdminSettings from './screens/admin/AdminSettings';
import AdminTeachers from './screens/admin/AdminTeachers';
import AdminReference from './screens/admin/AdminReference';
import './styles/theme.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    const body = document.querySelector('.dz-body');
    if (body) body.scrollTop = 0;
  }, [pathname]);
  return null;
}

// Entering an interface by its URL puts the app in that role, so a deep link
// lands in the right shell instead of the one the last visit left behind.
function RoleGate({ role, children }) {
  const { role: current, setRole, session } = useApp();
  React.useEffect(() => {
    if (current !== role) setRole(role);
  }, [current, role, setRole]);

  // Each interface is behind its own sign-in.
  if (!session || session.role !== role) return <Redirect to={`/auth/${role}/login`} />;
  return children;
}

// Screens the learner interfaces share; each is mounted under its own base.
const LEARNER_SCREENS = [
  { path: '/search', component: Search },
  { path: '/results', component: Results },
  { path: '/teacher/:id', component: TeacherProfile },
  { path: '/book/:id', component: Booking },
  { path: '/booking/:id', component: BookingDetails },
  { path: '/bookings', component: MyBookings },
  { path: '/notifications', component: Notifications },
  { path: '/account/profile', component: PersonalDetails },
  { path: '/account/payments', component: Payments },
  { path: '/account/security', component: Security },
  { path: '/account', component: Account, exact: true },
];

function LearnerRoutes({ base, role, home }) {
  return (
    <RoleGate role={role}>
      <Switch>
        <Route exact path={`${base}/home`} component={home} />
        {role === 'parent' && <Route exact path={`${base}/children`} component={Children} />}
        {LEARNER_SCREENS.map(({ path, component, exact }) => (
          <Route key={path} exact={exact} path={`${base}${path}`} component={component} />
        ))}
        <Redirect to={`${base}/home`} />
      </Switch>
    </RoleGate>
  );
}

function TeacherRoutes() {
  return (
    <RoleGate role="teacher">
      <Switch>
        <Route exact path="/teacher/home" component={TeacherHome} />
        <Route exact path="/teacher/requests" component={TeacherRequests} />
        <Route exact path="/teacher/schedule" component={TeacherSchedule} />
        <Route exact path="/teacher/account" component={Account} />
        <Route exact path="/teacher/account/profile" component={PersonalDetails} />
        <Route exact path="/teacher/account/payments" component={Payments} />
        <Route exact path="/teacher/account/security" component={Security} />
        <Route exact path="/teacher/edit" component={TeacherProfileEdit} />
        <Route exact path="/teacher/availability" component={TeacherAvailability} />
        <Route exact path="/teacher/notifications" component={Notifications} />
        <Route exact path="/teacher/preview" render={() => <TeacherProfile teacherId="t1" />} />
        <Redirect to="/teacher/home" />
      </Switch>
    </RoleGate>
  );
}

// The back office: the money the platform holds, and the rates it holds it at.
function AdminRoutes() {
  return (
    <RoleGate role="admin">
      <Switch>
        <Route exact path="/admin/home" component={AdminHome} />
        <Route exact path="/admin/payments" component={AdminPayments} />
        <Route exact path="/admin/payouts" component={AdminPayouts} />
        <Route exact path="/admin/teachers" component={AdminTeachers} />
        <Route exact path="/admin/reference" component={AdminReference} />
        <Route exact path="/admin/settings" component={AdminSettings} />
        <Redirect to="/admin/home" />
      </Switch>
    </RoleGate>
  );
}

export default function DarsyApp() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="dz-app">
          <ScrollToTop />
          <Switch>
            <Route exact path="/" component={Entrance} />
            <Route exact path="/auth/:role/login" component={Login} />
            <Route exact path="/auth/:role/signup" component={Signup} />
            <Route exact path="/auth/:role/verify" component={VerifyPhone} />
            <Route exact path="/auth/:role/forgot" component={ForgotPassword} />
            <Route exact path="/auth/:role/reset" component={ResetPassword} />
            <Route path="/student" render={() => <LearnerRoutes base="/student" role="student" home={Home} />} />
            <Route path="/parent" render={() => <LearnerRoutes base="/parent" role="parent" home={ParentHome} />} />
            <Route path="/teacher" component={TeacherRoutes} />
            <Route path="/admin" component={AdminRoutes} />
            <Redirect to="/" />
          </Switch>
        </div>
      </HashRouter>
    </AppProvider>
  );
}
