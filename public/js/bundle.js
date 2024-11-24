(() => {
  // public/js/alert.js
  var hideAlert = () => {
    const el = document.querySelector(".alert");
    if (el) el.parentElement.removeChild(el);
  };
  var showAlert = (type, message) => {
    hideAlert();
    const markup = `<div class="alert alert--${type}">${message}</div>`;
    document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
    window.setTimeout(hideAlert, 5e3);
  };

  // public/js/login.js
  async function login(email, password) {
    try {
      const res = await axios({
        method: "POST",
        url: "http://localhost:3000/api/v1/users/login",
        data: {
          email,
          password
        }
      });
      if (res.data.status = "success") {
        showAlert("success", "Logged in successfully!");
        window.location.assign("/");
      }
    } catch (err) {
      showAlert("error", err.response.data.message);
    }
  }
  async function logout() {
    try {
      const res = await axios({
        method: "GET",
        url: "http://localhost:3000/api/v1/users/logout"
      });
      if (res.data.status === "success") location.reload(true);
    } catch (err) {
      console.log(err.response);
      showAlert("error", "Error logging out! Try again.");
    }
  }

  // public/js/mapbox.js
  var displayMap = (locations) => {
    var map = L.map("map", { zoomControl: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    const points = [];
    locations.forEach((loc) => {
      points.push([loc.coordinates[1], loc.coordinates[0]]);
      L.marker([loc.coordinates[1], loc.coordinates[0]]).addTo(map).bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
        autoClose: false
      }).openPopup();
    });
    const bounds = L.latLngBounds(points).pad(0.5);
    map.fitBounds(bounds);
    map.scrollWheelZoom.disable();
    map.touchZoom.disable();
  };

  // public/js/index.js
  var mapBox = document.getElementById("map");
  var loginForm = document.querySelector(".form");
  var logoutBtn = document.querySelector(".nav__el--logout");
  if (mapBox) {
    const locations = JSON.parse(
      document.getElementById("map").dataset.locations
    );
    console.log("dislaping");
    displayMap(locations);
  }
  if (loginForm) {
    document.querySelector(".form").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      login(email, password);
    });
  }
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
})();
//# sourceMappingURL=bundle.js.map
