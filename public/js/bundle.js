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

  // public/js/updateSettings.js
  async function updateSettings(data, type) {
    const url = type === "password" ? "http://localhost:3000/api/v1/users/updatePassword" : "http://localhost:3000/api/v1/users/updateMe";
    try {
      const res = await axios({
        method: "PATCH",
        url,
        data
      });
      if (res.data.status === "success") {
        showAlert(
          "success",
          `${type == "password" ? "password" : "data"} updated successfully!`
        );
      }
    } catch (err) {
      showAlert("error", err.response.data.message);
    }
  }

  // public/js/index.js
  var mapBox = document.getElementById("map");
  var loginForm = document.querySelector(".form--login");
  var updateUserDataForm = document.querySelector(".form-user-data");
  var updateUserPasswordForm = document.querySelector(".form-user-settings");
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
  if (updateUserDataForm) {
    updateUserDataForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      updateSettings({ name, email }, "data");
    });
  }
  if (updateUserPasswordForm) {
    updateUserPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById("password-current").value;
      const newPassword = document.getElementById("password").value;
      const confirmNewPassword = document.getElementById("password-confirm").value;
      document.querySelector(".form-user-settings .btn").innerHTML = "loading....";
      await updateSettings(
        { currentPassword, newPassword, confirmNewPassword },
        "password"
      );
      document.getElementById("password-current").value = "";
      document.getElementById("password").value = "";
      document.getElementById("password-confirm").value = "";
      document.querySelector(".form-user-settings .btn").innerHTML = "save password";
    });
  }
})();
//# sourceMappingURL=bundle.js.map
