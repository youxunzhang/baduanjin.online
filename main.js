// 今日打卡功能
const punchBtn = document.getElementById('punchBtn');
const punchInfo = document.getElementById('punchInfo');
const today = new Date().toLocaleDateString();
let punchDays = JSON.parse(localStorage.getItem('punchDays') || '[]');

function updatePunchInfo() {
  punchInfo.textContent = `已累计打卡 ${punchDays.length} 天` + (punchDays.includes(today) ? '，今天已打卡！' : '');
  if (punchDays.includes(today)) punchBtn.disabled = true;
}

if (punchBtn) {
  punchBtn.addEventListener('click', () => {
    if (!punchDays.includes(today)) {
      punchDays.push(today);
      localStorage.setItem('punchDays', JSON.stringify(punchDays));
      updatePunchInfo();
    }
  });
  updatePunchInfo();
}

// 用户留言功能
const feedbackForm = document.getElementById('feedbackForm');
const feedbackList = document.getElementById('feedbackList');
let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');

function renderFeedbacks() {
  feedbackList.innerHTML = '';
  feedbacks.forEach(fb => {
    const li = document.createElement('li');
    li.textContent = `${fb.username}：${fb.message}`;
    feedbackList.appendChild(li);
  });
}

if (feedbackForm) {
  feedbackForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim() || '匿名';
    const message = document.getElementById('message').value.trim();
    if (message) {
      feedbacks.unshift({ username, message });
      localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
      renderFeedbacks();
      feedbackForm.reset();
    }
  });
  renderFeedbacks();
} 