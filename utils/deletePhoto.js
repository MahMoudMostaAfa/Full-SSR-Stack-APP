const fs = require('fs');
module.exports = async function deletePhotoFromFolder(photo) {
  const path = `${__dirname}/../public/img/users/${photo}`;
  fs.unlink(path, (err) => {
    if (err) {
      console.log(err);
    }
  });
};
