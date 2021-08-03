import React from "react";
import stylee from './Add_Employee.module.css';
import image from './img/laptop-user-1-1179329.png';
const Add_Admin = () => {
       return(
<div className="container-fluid ">
  <div className= "text-end">
<img src={image} width="200" className="rounded float-right"/>
  </div>

<div className={` ${stylee.center}  container p-5 `}>
           <form className='p-4 shadow'>
               <div className="row">
                 <div className="col-5">
                   <label for="inputEmail4">Name</label>
                   <input type="text" className="form-control" id="inputEmail4" placeholder="Enter Name"/>
                 </div>
                 <div className="col-5">
                 <label for="inputEmail4">Password</label>
                      <input type="password" className="form-control" id="inputEmail4" placeholder="Password"/>
               </div>
               </div>
<br/>    
               <div className="row">
                   <div className=" col-5">
                   <label for="inputZip">Mobile Number</label>
                        <input type="text" class="form-control" id="inputZip"placeholder="Mobile Number"/>
                   </div>
               <div className="form-group col-md-5">
               <label for="inputAddress2">Email</label>
                        <input type="email" className="form-control" id="inputAddress2" placeholder="dsdf@fdfd.com"/>
               </div>
               </div>
               <br/>
                 <div className="d-flex justify-content-end mt-2 p-2">
                 <button type="button" className="btn btn-blmd mt-3 ripple-effect btn-success btn-m btn-block  ">Add Admin</button>
                 </div>
             </form>
           </div>
</div>
)
}
export default Add_Admin;