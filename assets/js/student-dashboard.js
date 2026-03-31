document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('nde_token');
  const logoutButton = document.querySelector('#student-logout');
  const videoGrid = document.querySelector('#student-video-grid');
  const studentName = document.querySelector('#student-name');
  const alertBox = document.querySelector('#student-dashboard-alert');

  function showAlert(message, type = 'error') {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = type === 'success' ? 'alert-success' : 'alert-error';
    alertBox.style.display = 'block';
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 5000);
  }

  function redirectLogin() {
    window.location.href = '/pages/auth/sign_in.html';
  }

  async function validateStudent() {
    if (!token) return redirectLogin();
    const response = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return redirectLogin();
    const user = await response.json();
    if (user.role !== 'student') return redirectLogin();
    if (studentName) studentName.textContent = user.name || 'Student';
  }

  async function loadVideos() {
    const response = await fetch('/api/videos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      showAlert('Unable to load lesson videos.', 'error');
      return;
    }
    const videos = await response.json();
    if (!videoGrid) return;
    videoGrid.innerHTML = '';
    if (!videos.length) {
      videoGrid.innerHTML = '<p class="paragraph">No lessons are available yet. Please ask the admin to upload lessons.</p>';
      return;
    }
    videos.forEach((video) => {
      const card = document.createElement('article');
      card.className = 'section-card';
      card.innerHTML = `
        <div class="course-video-card">
          <video class="course-video" controls preload="metadata">
            <source src="/videos/${video.filename}" type="video/mp4" />
            Your browser does not support HTML video.
          </video>
        </div>
        <div class="section-container">
          <h3 class="article-header">${video.title}</h3>
          <p class="paragraph">${video.description}</p>
          <p class="small-text">Uploaded: ${new Date(video.uploadedAt).toLocaleString()}</p>
        </div>
      `;
      videoGrid.appendChild(card);
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('nde_token');
      localStorage.removeItem('nde_role');
      localStorage.removeItem('nde_name');
      redirectLogin();
    });
  }

  validateStudent().then(loadVideos);
});
