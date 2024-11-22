/* eslint-disable */
// console.log('Hello from login.js');

import { showAlert } from './alert';
export async function login(email, password) {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if ((res.data.status = 'success')) {
      showAlert('success', 'Logged in successfully!');
      window.location.assign('/');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}
