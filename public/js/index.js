import { login } from './login';
import { displayMap } from './mapbox';
// map
const mapBox = document.getElementById('map');
if (mapBox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations,
  );
  console.log('dislaping');
  displayMap(locations);
}

// login
const loginForm = document.querySelector('.form');
if (loginForm) {
  document.querySelector('.form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
