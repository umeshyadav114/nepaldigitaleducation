document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('nde_token');
  const logoutButton = document.querySelector('#admin-logout');
  const uploadForm = document.querySelector('#video-upload-form');
  const studentForm = document.querySelector('#create-student-form');
  const videoList = document.querySelector('#uploaded-video-list');
  const adminName = document.querySelector('#admin-name');
  const alertBox = document.querySelector('#admin-dashboard-alert');

  function showAlert(message, type = 'success') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = type === 'success' ? 'alert-success' : 'alert-error';
    alertBox.style.display = 'block';
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 5000);
  }

  function redirectToLogin() {
    window.location.href = '/pages/admin/login.html';
  }

  async function fetchMe() {
    if (!token) return redirectToLogin();
    const res = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return redirectToLogin();
    const data = await res.json();
    if (data.role !== 'admin') return redirectToLogin();
    if (adminName) adminName.textContent = data.name || 'Admin';
  }

  async function loadVideos() {
    const res = await fetch('/api/videos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return showAlert('Unable to load videos.', 'error');
    const videos = await res.json();
    if (!videoList) return;
    videoList.innerHTML = '';
    if (!videos.length) {
      videoList.innerHTML = '<p class="paragraph">No uploaded lessons yet. Upload a video to make it available for students.</p>';
      return;
    }
    videos.forEach((video) => {
      const item = document.createElement('div');
      item.className = 'video-card';
      item.innerHTML = `
        <div class="video-card-content">
          <h3>${video.title}</h3>
          <p>${video.description}</p>
          <p class="small-text">Uploaded: ${new Date(video.uploadedAt).toLocaleString()}</p>
          <a class="sec-btn" href="/videos/${video.filename}" target="_blank">Preview file</a>
        </div>
      `;
      videoList.appendChild(item);
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('nde_token');
      localStorage.removeItem('nde_role');
      localStorage.removeItem('nde_name');
      redirectToLogin();
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const title = uploadForm.querySelector('[name="title"]').value.trim();
      const description = uploadForm.querySelector('[name="description"]').value.trim();
      const fileInput = uploadForm.querySelector('[name="video"]');
      if (!title || !description || !fileInput.files.length) {
        showAlert('Please provide title, description, and video file.', 'error');
        return;
      }
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('video', fileInput.files[0]);
      const res = await fetch('/api/admin/upload-video', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) {
        const error = await res.json();
        showAlert(error.message || 'Upload failed.', 'error');
        return;
      }
      const data = await res.json();
      showAlert(data.message || 'Video uploaded successfully.');
      uploadForm.reset();
      loadVideos();
    });
  }

  if (studentForm) {
    studentForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = studentForm.querySelector('[name="name"]').value.trim();
      const email = studentForm.querySelector('[name="email"]').value.trim();
      const password = studentForm.querySelector('[name="password"]').value.trim();
      if (!name || !email || !password) {
        showAlert('Please complete student account fields.', 'error');
        return;
      }
      const res = await fetch('/api/admin/create-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password })
      });
      if (!res.ok) {
        const error = await res.json();
        showAlert(error.message || 'Unable to create student.','error');
        return;
      }
      const data = await res.json();
      showAlert(data.message || 'Student created successfully.');
      studentForm.reset();
    });
  }

  fetchMe().then(loadVideos);
});
