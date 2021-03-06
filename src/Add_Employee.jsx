 import React from "react";
 import stylee from './Add_Employee.module.css';
 const Add_Employee = () => {
        
        return(
<div className=" vh-100 d-flex justify-content-center  align-items-center ">
<div className="container p-5 w-52">
  <h1 className="text-success">Add Employee</h1>
            <form className='p-4 shadow bg-white rounded'>
                <div className="row">
                  <div className="col-6">
                    <label for="inputEmail4">Name</label>
                    <input type="text" className="form-control" id="inputEmail4" placeholder="Enter Name"/>
                  </div>
                  <div className="col-6">
                  <label for="inputEmail4">Position Number</label>
                  <input type="text" className="form-control" id="inputEmail4" placeholder="Position Number"/>
                </div>
                </div>
<br/>    
                <div className="row">
                    <div className=" col-6">
                        <label for="inputAddress">Salary</label>
                        <input type="text" className="form-control" id="inputAddress" placeholder="Salary"/>
                    </div>
                <div className="form-group col-md-6">
                    <label for="inputAddress2">KPI</label>
                    <input type="text" className="form-control" id="inputAddress2" placeholder="KPI"/>
                </div>
                </div>
                <br/>
                <div className="row">
                  <div className="form-group col-md-6">
                    <label for="inputCity">Holiodays</label>
                    <input type="text" className="form-control" id="inputCity"placeholder="Holidays"/>
                  </div>
                  <div className="form-group col-md-6">
                    <label for="inputCity">Bank Account</label>
                    <input type="text" className="form-control" id="inputCity"placeholder="Bank Account"/>
                  </div>
                  </div>
                  <br/>
                  <div className="row">
                    <div className="form-group col-md-6">
                        <label for="inputState">City</label>
                        <select id="inputState" className="form-control">
                          <option selected disabled>Select City</option>
                          <option>Albaida</option>
                          <option>Benghazi</option>
                          <option>Tripoli</option>
                        </select>
                      </div>
                      <div className="form-group col-md-6">
                        <label for="inputZip">Mobile Number</label>
                        <input type="text" className="form-control" id="inputZip"placeholder="Mobile Number"/>
                      </div>
                  </div>
                  <div className="d-flex justify-content-end">
                  <button type="button" className=" btn btn-blmd mt-3 ripple-effect btn-success btn-m btn-block  ">Add Employee</button>
                  </div>
              </form>
            </div>
</div>
)
 }
 export default Add_Employee;