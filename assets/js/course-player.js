document.addEventListener('DOMContentLoaded', () => {
  const mainVideoPlayer = document.getElementById('main-video-player');
  const mainVideoSource = document.getElementById('main-video-source');
  const currentVideoTitle = document.getElementById('current-video-title');
  const currentVideoDescription = document.getElementById('current-video-description');
  const chaptersList = document.getElementById('chapters-list');
  const lessonNotes = document.getElementById('lesson-notes');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  let currentVideos = [];

  function loadCourseVideos() {
    fetch('/api/public/videos')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load videos');
        return response.json();
      })
      .then(videos => {
        currentVideos = videos;
        renderChapters(videos);
        if (videos.length > 0) {
          selectVideo(videos[0]);
        }
      })
      .catch(error => {
        console.error('Error loading videos:', error);
        chaptersList.innerHTML = '<p class="paragraph">Unable to load course videos. Please try again later.</p>';
      });
  }

  function renderChapters(videos) {
    chaptersList.innerHTML = '';
    if (!videos.length) {
      chaptersList.innerHTML = '<p class="paragraph">No lessons available yet. Check back soon!</p>';
      return;
    }

    videos.forEach((video, index) => {
      const chapterItem = document.createElement('div');
      chapterItem.className = 'chapter-item';
      chapterItem.innerHTML = `
        <div class="chapter-content">
          <div class="chapter-number">${index + 1}</div>
          <div class="chapter-info">
            <h4>${video.title}</h4>
            <p>${video.description.substring(0, 100)}${video.description.length > 100 ? '...' : ''}</p>
            <small>Uploaded: ${new Date(video.uploadedAt).toLocaleDateString()}</small>
          </div>
        </div>
      `;
      chapterItem.addEventListener('click', () => selectVideo(video));
      chaptersList.appendChild(chapterItem);
    });
  }

  function selectVideo(video) {
    // Update video source
    mainVideoSource.src = video.url;
    mainVideoPlayer.load();

    // Update info
    currentVideoTitle.textContent = video.title;
    currentVideoDescription.textContent = video.description;

    // Update notes
    updateNotes(video);

    // Highlight selected chapter
    document.querySelectorAll('.chapter-item').forEach(item => {
      item.classList.remove('active');
    });
    event.currentTarget?.classList.add('active');

    // Switch to notes tab when video is selected
    switchTab('notes');
  }

  function updateNotes(video) {
    lessonNotes.innerHTML = `
      <div class="note-content">
        <h4>Lesson Notes</h4>
        <p>${video.description}</p>
        <div class="note-meta">
          <span>Duration: <strong>To be calculated</strong></span>
          <span>Uploaded: <strong>${new Date(video.uploadedAt).toLocaleString()}</strong></span>
        </div>
        <div class="note-actions">
          <button class="pri-btn" onclick="downloadNotes('${video.id}')">Download Notes</button>
        </div>
      </div>
    `;
  }

  function switchTab(tabName) {
    // Update tab buttons
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      }
    });

    // Update tab panes
    tabPanes.forEach(pane => {
      pane.classList.remove('active');
      if (pane.id === `${tabName}-tab`) {
        pane.classList.add('active');
      }
    });
  }

  // Tab switching event listeners
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      switchTab(tabName);
    });
  });

  // Initialize
  loadCourseVideos();
});

// Placeholder functions for future features
function downloadNotes(videoId) {
  alert('Notes download feature coming soon!');
}

function takeQuiz(videoId) {
  alert('Quiz feature coming soon!');
}

function postComment(videoId) {
  const commentInput = document.querySelector('.comment-input');
  const commentText = commentInput.value.trim();

  if (!commentText) {
    alert('Please enter a comment before posting.');
    return;
  }

  // For now, just add the comment locally (in a real app, this would be sent to server)
  const commentsList = document.getElementById(`comments-list-${videoId}`);
  const commentItem = document.createElement('div');
  commentItem.className = 'comment-item';
  commentItem.innerHTML = `
    <div class="comment-meta">
      <span class="comment-author">Student</span>
      <span class="comment-date">${new Date().toLocaleString()}</span>
    </div>
    <div class="comment-text">${commentText}</div>
  `;

  // Remove the "no comments" message if it exists
  const noCommentsMsg = commentsList.querySelector('.paragraph');
  if (noCommentsMsg) {
    noCommentsMsg.remove();
  }

  commentsList.appendChild(commentItem);
  commentInput.value = '';

  alert('Comment posted successfully!');
}