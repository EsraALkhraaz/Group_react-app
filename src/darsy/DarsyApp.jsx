import React from 'react';
import { HashRouter, Route, Switch, Redirect, useLocation } from 'react-router-dom';
import { AppProvider } from './state/AppContext';
import Welcome from './screens/Welcome';
import Home from './screens/Home';
import Search from './screens/Search';
import Results from './screens/Results';
import TeacherProfile from './screens/TeacherProfile';
import Booking from './screens/Booking';
import BookingDetails from './screens/BookingDetails';
import MyBookings from './screens/MyBookings';
import Notifications from './screens/Notifications';
import Profile from './screens/Profile';
import TeacherDashboard from './screens/TeacherDashboard';
import TeacherProfileEdit from './screens/TeacherProfileEdit';
import './styles/theme.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    const body = document.querySelector('.dz-body');
    if (body) body.scrollTop = 0;
  }, [pathname]);
  return null;
}

export default function DarsyApp() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="dz-app">
          <ScrollToTop />
          <Switch>
            <Route exact path="/" component={Welcome} />
            <Route path="/home" component={Home} />
            <Route path="/search" component={Search} />
            <Route path="/results" component={Results} />
            <Route path="/teacher/edit" component={TeacherProfileEdit} />
            <Route path="/teacher/:id" component={TeacherProfile} />
            <Route path="/book/:id" component={Booking} />
            <Route path="/booking/:id" component={BookingDetails} />
            <Route path="/bookings" component={MyBookings} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/profile" component={Profile} />
            <Route path="/teacher" exact component={TeacherDashboard} />
            <Route path="/more" render={() => <Redirect to="/profile" />} />
            <Redirect to="/" />
          </Switch>
        </div>
      </HashRouter>
    </AppProvider>
  );
}
