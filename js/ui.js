import { auth } from './auth.js';
import { chat } from './chat.js';
import { CONSTANTS } from './config.js';

export function initUI() {
  // Pages
  const loginPage = document.getElementById('login-page');
  const chatPage = document.getElementById('chat-page');

  // Login form elements
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const usernameError = document.getElementById('username-error');
  const passwordError = document.getElementById('password-error');

  // Chat elements
  const chatTitle = document.getElementById('chat-title');
  const chatMessages = document.getElementById('chat-messages');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const fileInput = document.getElementById('file-input');
  const attachBtn = document.getElementById('attach-btn');

  // Menu elements
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const menuAddUserInput = document.getElementById('menu-add-user-input');
  const menuAddUserBtn = document.getElementById('menu-add-user-btn');
  const menuPrivateUsersList = document.getElementById('menu-private-users-list');
  const profilePhoto = document.getElementById('profile-photo');
  const profileName = document.getElementById('profile-name');
  const profileUserId = document.getElementById('profile-user-id');

  // Logout elements
  const logoutBtn = document.getElementById('logout-btn');
  const logoutModal = document.getElementById('logout-modal');
  const logoutConfirmInput = document.getElementById('logout-confirm-input');
  const logoutError = document.getElementById('logout-error');
  const logoutCancelBtn = document.getElementById('logout-cancel-btn');
  const logoutConfirmBtn = document.getElementById('logout-confirm-btn');

  function showChatPage() {
    // First unsubscribe from any existing channels
    chat.cleanup();
    
    // Force display change
    document.body.style.display = 'flex';
    loginPage.style.display = 'none';
    chatPage.style.display = 'flex';
    chatPage.style.flexDirection = 'column';
    
    // Remove hidden class
    loginPage.classList.add('hidden');
    chatPage.classList.remove('hidden');

    // Initialize chat
    chat.switchToGlobalChat();
  }

  function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
    element.classList.add('animate-shake');
    setTimeout(() => {
      element.classList.remove('animate-shake');
    }, 500);
  }

  function addMessageToChat(message, from, isPrivate = false, type = 'text') {
    const messageEl = document.createElement('div');
    messageEl.className = 'p-3 rounded max-w-xs break-words flex flex-col space-y-1';
    
    const isCurrentUser = from === auth.currentUser;
    messageEl.classList.add(
      isCurrentUser ? 'bg-green-600 text-white self-end animate-fadeInRight' : 'bg-gray-200 text-gray-800 self-start animate-fadeInLeft',
      'shadow-md'
    );

    if (type === 'text') {
      const textEl = document.createElement('span');
      textEl.textContent = `${from}: ${message}`;
      messageEl.appendChild(textEl);
    } else if (type === 'image') {
      appendMediaElement('img', message, from, messageEl);
    } else if (type === 'video') {
      appendMediaElement('video', message, from, messageEl);
    } else if (type === 'audio') {
      appendMediaElement('audio', message, from, messageEl);
    }

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (isPrivate && from !== auth.currentUser) {
      chat.playPrivateMessageSound();
    }
  }

  function appendMediaElement(tagName, src, from, container) {
    const element = document.createElement(tagName);
    element.src = src;
    if (tagName !== 'img') {
      element.controls = true;
    }
    element.className = 'rounded max-w-xs max-h-60 object-cover cursor-pointer hover:scale-105 transition-transform';
    
    if (tagName === 'img') {
      element.addEventListener('click', () => {
        window.open(src, '_blank');
      });
    }

    const caption = document.createElement('span');
    caption.textContent = from;
    caption.className = 'text-sm text-gray-600';

    container.appendChild(element);
    container.appendChild(caption);
  }

  function updatePrivateUsersList() {
    menuPrivateUsersList.innerHTML = '';
    const users = chat.getPrivateUsers();

    users.forEach(user => {
      const userBtn = document.createElement('button');
      userBtn.className = 'w-full flex items-center space-x-3 text-left px-4 py-3 rounded-lg hover:bg-green-100 transition';
      
      const img = document.createElement('img');
      img.src = user.photo;
      img.alt = `${user.name} profile photo`;
      img.className = 'w-10 h-10 rounded-full object-cover';

      const span = document.createElement('span');
      span.textContent = user.name;
      span.className = 'font-semibold text-gray-800';

      userBtn.appendChild(img);
      userBtn.appendChild(span);

      userBtn.addEventListener('click', () => {
        const title = chat.switchToPrivateChat(user.id);
        chatTitle.textContent = title;
        closeHamburgerMenu();
      });

      menuPrivateUsersList.appendChild(userBtn);
    });
  }

  // Event Listeners
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    usernameError.classList.add('hidden');
    passwordError.classList.add('hidden');

    try {
      const result = await auth.login(username, password);
      
      // Update profile
      profilePhoto.src = auth.getUserInfo(result.userId).photo;
      profileName.textContent = result.username;
      profileUserId.textContent = result.userId;

      showChatPage();
    } catch (error) {
      if (error.message === 'Username already taken') {
        showError(usernameError, error.message);
      } else if (error.message === 'Incorrect password') {
        showError(passwordError, error.message);
      }
    }
  });

  hamburgerBtn.addEventListener('click', () => {
    hamburgerMenu.classList.toggle('translate-x-full');
    hamburgerMenu.setAttribute('aria-hidden', hamburgerMenu.classList.contains('translate-x-full'));
  });

  document.addEventListener('click', (e) => {
    if (
      !hamburgerMenu.contains(e.target) &&
      !hamburgerBtn.contains(e.target) &&
      !hamburgerMenu.classList.contains('translate-x-full')
    ) {
      closeHamburgerMenu();
    }
  });

  function closeHamburgerMenu() {
    hamburgerMenu.classList.add('translate-x-full');
    hamburgerMenu.setAttribute('aria-hidden', 'true');
  }

  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    const message = chat.sendMessage(text);
    addMessageToChat(message.text, message.from, chat.currentChat !== 'global', 'text');
    messageInput.value = '';
  });

  // Also add click event on send button to trigger form submit
  const sendButton = messageForm.querySelector('button[type="submit"]');
  sendButton.addEventListener('click', () => {
    messageForm.dispatchEvent(new Event('submit'));
  });

  attachBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      let type = 'text';
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      }

      const message = chat.sendMessage(dataUrl, type);
      addMessageToChat(message.text, message.from, chat.currentChat !== 'global', type);
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  });

  menuAddUserBtn.addEventListener('click', () => {
    const userId = menuAddUserInput.value.trim();
    try {
      chat.addUser(userId);
      menuAddUserInput.value = '';
      updatePrivateUsersList();
    } catch (error) {
      alert(error.message);
    }
  });

  // Logout event handlers
  logoutBtn.addEventListener('click', () => {
    showLogoutModal();
  });

  logoutCancelBtn.addEventListener('click', () => {
    hideLogoutModal();
  });

  logoutConfirmBtn.addEventListener('click', () => {
    const password = logoutConfirmInput.value.trim();
    console.log('Attempting logout with password:', password);
    console.log('Expected password:', CONSTANTS.FIXED_PASSWORD);
    
    if (password !== CONSTANTS.FIXED_PASSWORD) {
      showError(logoutError, 'Incorrect password');
      return;
    }

    // Logout success
    auth.logout();
    chat.cleanup();

    // Reset UI state
    loginPage.style.display = 'block';
    chatPage.style.display = 'none';
    loginPage.classList.remove('hidden');
    chatPage.classList.add('hidden');

    // Clear all inputs and errors
    usernameInput.value = '';
    passwordInput.value = '';
    logoutConfirmInput.value = '';
    usernameError.classList.add('hidden');
    passwordError.classList.add('hidden');
    logoutError.classList.add('hidden');

    // Close modals
    hideLogoutModal();
    closeHamburgerMenu();

    // Force page refresh to clear state
    window.location.reload();
  });

  function showLogoutModal() {
    logoutModal.classList.remove('hidden');
    logoutConfirmInput.value = '';
    logoutError.classList.add('hidden');
    logoutConfirmInput.placeholder = 'Type your password to confirm logout';
    logoutConfirmInput.type = 'password';
    logoutConfirmInput.focus();
  }

  function hideLogoutModal() {
    logoutModal.classList.add('hidden');
  }

  function handleLogout() {
    const input = logoutConfirmInput.value.trim();
    if (input !== CONSTANTS.FIXED_PASSWORD) {
      showError(logoutError, 'Password does not match');
      return;
    }

    auth.logout();
    chat.cleanup();

    // Reset UI state properly
    loginPage.style.display = 'block';
    chatPage.style.display = 'none';
    loginPage.classList.remove('hidden');
    chatPage.classList.add('hidden');

    // Clear input fields and errors
    usernameInput.value = '';
    passwordInput.value = '';
    usernameError.classList.add('hidden');
    passwordError.classList.add('hidden');

    hideLogoutModal();
    closeHamburgerMenu();
  }

  // Set up message callback
  chat.setMessageCallback((message, isPrivate) => {
    addMessageToChat(message.text, message.from, isPrivate, message.type || 'text');
  });

  // Initialize UI state
  const savedUserId = auth.loadUserId();
  if (savedUserId) {
    // For demo, we do not restore session
    // Could be improved by storing username as well
    loginPage.style.display = 'none';
    chatPage.style.display = 'flex';
    chatPage.style.flexDirection = 'column';
    chat.switchToGlobalChat();
  }
}
