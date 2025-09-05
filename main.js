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

// Bookmark functionality
const bookmarkBtn = document.getElementById('bookmarkBtn');
if (bookmarkBtn) {
  bookmarkBtn.addEventListener('click', () => {
    const currentUrl = window.location.href;
    const currentTitle = document.title;
    
    if (bookmarkBtn.classList.contains('bookmarked')) {
      // Remove bookmark
      bookmarkBtn.classList.remove('bookmarked');
      bookmarkBtn.querySelector('.bookmark-text').textContent = 'Bookmark';
      localStorage.removeItem(`bookmark_${currentUrl}`);
      showNotification('Bookmark removed!', 'info');
    } else {
      // Add bookmark
      bookmarkBtn.classList.add('bookmarked');
      bookmarkBtn.querySelector('.bookmark-text').textContent = 'Bookmarked';
      localStorage.setItem(`bookmark_${currentUrl}`, JSON.stringify({
        url: currentUrl,
        title: currentTitle,
        timestamp: new Date().toISOString()
      }));
      showNotification('Page bookmarked!', 'success');
    }
  });
  
  // Check if page is already bookmarked
  const currentUrl = window.location.href;
  if (localStorage.getItem(`bookmark_${currentUrl}`)) {
    bookmarkBtn.classList.add('bookmarked');
    bookmarkBtn.querySelector('.bookmark-text').textContent = 'Bookmarked';
  }
}

// Social sharing functionality
const shareLinks = document.querySelectorAll('.share-link');
shareLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const platform = link.dataset.platform;
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const description = encodeURIComponent(document.querySelector('meta[name="description"]')?.content || '');
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${title}%20${url}`;
        break;
      case 'wechat':
        // 微信分享需要特殊处理，这里显示二维码或提示
        showNotification('请复制链接分享到微信', 'info');
        navigator.clipboard.writeText(window.location.href);
        return;
      case 'weibo':
        shareUrl = `https://service.weibo.com/share/share.php?url=${url}&title=${title}`;
        break;
      case 'qq':
        shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}&summary=${description}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${title}&body=${description}%0A%0A${url}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      showNotification(`Sharing to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`, 'info');
    }
  });
});

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#667eea'};
    color: white;
    padding: 1rem 2rem;
    border-radius: 5px;
    z-index: 10000;
    animation: slideIn 0.5s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.5s ease';
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}

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
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
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