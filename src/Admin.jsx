import React from "react";
import image from './img/download.png';
const Admin = () => {
  return (
    <div className="container-fluid" >
      <div className=" text-end">
        <img src={image} className="rounded " width="60" />
      </div>

      <table class="table table-hover">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Password</th>
            <th scope="col">Email</th>
            <th scope="col">Mobile Number</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">1</th>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <th scope="row">2</th>
            <td>Jacob</td>
            <td>Thornton</td>
            <td>@mdo</td>
            <td>@fat</td>
          </tr>
          <tr>
            <th scope="row">3</th>
            <td colspan="2">Larry the Bird</td>
            <td>@mdo</td>
            <td>@twitter</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
export default Admin;