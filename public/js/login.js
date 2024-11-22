/* eslint-disable */
// console.log('Hello from login.js');
import { showAlert } from 'alert.js';
async function login(email, password) {
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
      alert('Logged in successfully');
      showAlert();
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.log(err.response.data);
    console.log(err.response.data.message);
  }
}

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
