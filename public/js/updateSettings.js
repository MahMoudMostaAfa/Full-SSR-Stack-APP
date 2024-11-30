import { showAlert } from './alert';

export async function updateSettings(data, type) {
  const url =
    type === 'password'
      ? 'http://localhost:3000/api/v1/users/updatePassword'
      : 'http://localhost:3000/api/v1/users/updateMe';
  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert(
        'success',
        `${type == 'password' ? 'password' : 'data'} updated successfully!`,
      );
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}
