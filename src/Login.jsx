import React from 'react';
import stylee from './login.module.css';

const Login = () => {
  return (
    <div className={` ${stylee.login} vh-100  d-flex align-items-center`}>

      <div className="container p-1 d-flex justify-content-center  " >
        <div className='w-50 shadow text-white  '>
          <form className="clearfix p-5">
            <label className="blmd-label" > Username:</label>
            <input type="text" name="username" autocomplete="off" id="username" className="form-control input-sm" placeholder="Enter Username" />
            <br />
            <label className="blmd-label">Password:</label>
            <input type="password" name="password" autocomplete="off" id="password" className="form-control" placeholder="Enter Password" />
            <button type="button" className="btn btn-blmd mt-3 ripple-effect btn-success btn-lg btn-block">Login</button>

          </form>
        </div>

        <br />
      </div>
    </div>
  )
}
export default Login;
