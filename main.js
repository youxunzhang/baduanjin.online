// 八段锦练习进度跟踪功能
const practiceBtn = document.getElementById('practiceBtn');
const streakCount = document.getElementById('streakCount');
const practiceStatus = document.getElementById('practiceStatus');
const today = new Date().toLocaleDateString('zh-CN');
let practiceDays = JSON.parse(localStorage.getItem('practiceDays') || '[]');

function updatePracticeInfo() {
  if (streakCount) {
    streakCount.textContent = practiceDays.length;
  }
  
  if (practiceStatus) {
    if (practiceDays.includes(today)) {
      practiceStatus.textContent = '今天已完成八段锦练习！';
      practiceStatus.style.color = '#38a169';
    } else {
      practiceStatus.textContent = '今天还没有练习八段锦';
      practiceStatus.style.color = '#e53e3e';
    }
  }
  
  if (practiceBtn) {
    if (practiceDays.includes(today)) {
      practiceBtn.disabled = true;
      practiceBtn.textContent = '今日已练习';
      practiceBtn.style.backgroundColor = '#38a169';
    } else {
      practiceBtn.disabled = false;
      practiceBtn.textContent = '今日已练习';
      practiceBtn.style.backgroundColor = '#667eea';
    }
  }
}

if (practiceBtn) {
  practiceBtn.addEventListener('click', () => {
    if (!practiceDays.includes(today)) {
      practiceDays.push(today);
      localStorage.setItem('practiceDays', JSON.stringify(practiceDays));
      updatePracticeInfo();
      
      // 显示成功消息
      const successMessage = document.createElement('div');
      successMessage.textContent = '恭喜！今日八段锦练习已完成';
      successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #38a169;
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.5s ease;
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    }
  });
}

// 社区留言功能
const communityForm = document.getElementById('communityForm');
const communityFeed = document.getElementById('communityFeed');
let communityPosts = JSON.parse(localStorage.getItem('communityPosts') || '[]');

function renderCommunityPosts() {
  if (communityFeed) {
    communityFeed.innerHTML = '';
    communityPosts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.className = 'community-post';
      postElement.innerHTML = `
        <div class="post-author">${post.username}</div>
        <div class="post-content">${post.message}</div>
        <div class="post-time">${post.time}</div>
      `;
      communityFeed.appendChild(postElement);
    });
  }
}

if (communityForm) {
  communityForm.addEventListener('submit', e => {
    e.preventDefault();
    const userName = document.getElementById('userName');
    const userMessage = document.getElementById('userMessage');
    
    if (userName && userMessage) {
      const username = userName.value.trim() || '匿名用户';
      const message = userMessage.value.trim();
      
      if (message) {
        const newPost = {
          username,
          message,
          time: new Date().toLocaleString('zh-CN')
        };
        
        communityPosts.unshift(newPost);
        localStorage.setItem('communityPosts', JSON.stringify(communityPosts));
        renderCommunityPosts();
        communityForm.reset();
        
        // 显示成功消息
        const successMessage = document.createElement('div');
        successMessage.textContent = '留言发布成功！';
        successMessage.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #38a169;
          color: white;
          padding: 1rem 2rem;
          border-radius: 5px;
          z-index: 1000;
          animation: slideIn 0.5s ease;
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          successMessage.remove();
        }, 3000);
      }
    }
  });
}

// FAQ页面功能
const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {
  question.addEventListener('click', () => {
    const answer = question.nextElementSibling;
    const isOpen = answer.style.display === 'block';
    
    // 关闭所有其他答案
    document.querySelectorAll('.faq-answer').forEach(ans => {
      ans.style.display = 'none';
    });
    
    // 切换当前答案
    answer.style.display = isOpen ? 'none' : 'block';
  });
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  updatePracticeInfo();
  renderCommunityPosts();
  
  // 为FAQ答案设置初始状态
  document.querySelectorAll('.faq-answer').forEach(answer => {
    answer.style.display = 'none';
  });
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .faq-question {
    cursor: pointer;
  }
  
  .faq-answer {
    display: none;
    transition: all 0.3s ease;
  }
`;
document.head.appendChild(style); 