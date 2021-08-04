import React from "react";
import './App.css';
import stylee from './Add_Employee.module.css';
import image from './img/laptop-user-1-1179329.png';
const Add_Admin = () => {

  const [name, setName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
 
  const submitForm = () => {
    console.log("name ", name);
    console.log("Password ", password);
    console.log("Phone ", phone);
    console.log("email ", email);
  }

       return(
<div className="container ">
<div className={` ${stylee.center}  container p-5 `}>
  <h1 className="text-success"> Add Admin</h1>
           <form className='p-4 shadow bg-white rounded'>
               <div className="row">
                 <div className="col-6">
                   <label for="inputEmail4">Name</label>
                   <input type="text"
                      className="form-control"
                      id="inputEmail4"
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Name"/>
                 </div>
                 <div className="col-6">
                 <label for="inputEmail4">Password</label>
                      <input type="password"
                       className="form-control"
                        id="inputEmail4" 
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"/>
               </div>
               </div>
<br/>    
               <div className="row">
                   <div className=" col-6">
                   <label for="inputZip">Mobile Number</label>
                        <input type="text" 
                        class="form-control"
                         id="inputZip"
                         onChange={(e) => setPhone(e.target.value)}
                         placeholder="Mobile Number"/>
                   </div>
               <div className="form-group col-md-6">
               <label for="inputAddress2">Email</label>
                        <input type="email"
                         className="form-control" 
                         id="inputAddress2"
                         onChange={(e) => setEmail(e.target.value)}
                         placeholder="dsdf@fdfd.com"/>
               </div>
               </div>
                 <div className={`d-flex justify-content-end ${stylee.bb}`}>
                 <button type="button" className="btn btn-blmd ripple-effect btn-success btn-m btn-block" >Add Admin</button>
                 </div>
             </form>
           </div>
</div>
)
}
export default Add_Admin;