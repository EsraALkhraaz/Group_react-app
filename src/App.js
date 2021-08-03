import './App.css';
import React from 'react';
import Login from './Login.jsx';
import Add_Employee from './Add_Employee.jsx';
import Add_Admin from './Add_Admin';
import 'bootstrap/dist/css/bootstrap.css';
import { BrowserRouter, Route, Link, Switch } from "react-router-dom";
import Admin from './Admin';

function App() {
  return (
    <div>
      {/* <Login /> */}
      {/* <Add_Employee/> */}
      <Add_Admin/>
      {/* <Admin/> */}
    </div>
  //   <Router>
  // <div >
  //     <Login />
  //     <Switch>
  //       <Route path="/" exact component={Add_Employee}></Route>
  //     </Switch>
  //   </div>
  //   </Router>
  


  )
}

export default App;
