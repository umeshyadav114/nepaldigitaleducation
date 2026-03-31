document.addEventListener('DOMContentLoaded', () => {
  const renderVideoGrid = (container, videos) => {
    container.innerHTML = '';
    if (!videos.length) {
      container.innerHTML = '<p class="paragraph">No lessons have been uploaded yet. Check back soon for new video lessons.</p>';
      return;
    }

    videos.forEach((video) => {
      const card = document.createElement('article');
      card.className = 'section-card';
      card.innerHTML = `
        <div class="course-video-card">
          <video class="course-video" controls preload="metadata">
            <source src="${video.url}" type="video/mp4" />
            Your browser does not support HTML video.
          </video>
        </div>
        <div class="section-container">
          <h3 class="article-header">${video.title}</h3>
          <p class="paragraph">${video.description}</p>
          <p class="small-text">Uploaded: ${new Date(video.uploadedAt).toLocaleDateString()} ${new Date(video.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      `;
      container.appendChild(card);
    });
  };

  const loadPublicVideos = async () => {
    const endpoint = '/api/public/videos';
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Unable to load videos.');
      const videos = await response.json();
      const homeGrid = document.querySelector('#home-video-grid');
      const courseGrid = document.querySelector('#course-video-grid');
      if (homeGrid) renderVideoGrid(homeGrid, videos);
      if (courseGrid) renderVideoGrid(courseGrid, videos);
    } catch (error) {
      const homeGrid = document.querySelector('#home-video-grid');
      const courseGrid = document.querySelector('#course-video-grid');
      const errorHtml = '<p class="paragraph">Unable to load live lessons at the moment. Please refresh or try again later.</p>';
      if (homeGrid) homeGrid.innerHTML = errorHtml;
      if (courseGrid) courseGrid.innerHTML = errorHtml;
      console.error('Course videos load failed:', error);
    }
  };

  loadPublicVideos();
});
