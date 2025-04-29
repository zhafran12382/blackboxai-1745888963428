import { CONSTANTS, DEFAULT_PROFILE_PHOTO } from './config.js';

class Auth {
  constructor() {
    this.currentUser = null;
    this.currentUserId = null;
    this.userIdToNameMap = JSON.parse(localStorage.getItem('userIdToNameMap') || '{}');
    this.userIdToPhotoMap = JSON.parse(localStorage.getItem('userIdToPhotoMap') || '{}');
  }

  generateUserId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < CONSTANTS.USER_ID_LENGTH; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  isUsernameTaken(username) {
    if (username === 'TubagusS') {
      return false; // Allow multiple usage for testing
    }
    const users = JSON.parse(localStorage.getItem('allUsernames') || '[]');
    return users.includes(username);
  }

  addUsername(username) {
    const users = JSON.parse(localStorage.getItem('allUsernames') || '[]');
    if (!users.includes(username)) {
      users.push(username);
      localStorage.setItem('allUsernames', JSON.stringify(users));
    }
  }

  removeUsername(username) {
    const users = JSON.parse(localStorage.getItem('allUsernames') || '[]');
    const index = users.indexOf(username);
    if (index !== -1) {
      users.splice(index, 1);
      localStorage.setItem('allUsernames', JSON.stringify(users));
    }
  }

  login(username, password) {
    return new Promise((resolve, reject) => {
      if (this.isUsernameTaken(username)) {
        reject(new Error('Username already taken'));
        return;
      }

      if (password !== CONSTANTS.FIXED_PASSWORD) {
        reject(new Error('Incorrect password'));
        return;
      }

      // Login success
      this.addUsername(username);
      this.currentUser = username;
      this.currentUserId = this.generateUserId();
      
      // Save to localStorage
      localStorage.setItem('userId', this.currentUserId);
      
      // Update user maps
      this.userIdToNameMap[this.currentUserId] = username;
      this.userIdToPhotoMap[this.currentUserId] = DEFAULT_PROFILE_PHOTO;
      
      localStorage.setItem('userIdToNameMap', JSON.stringify(this.userIdToNameMap));
      localStorage.setItem('userIdToPhotoMap', JSON.stringify(this.userIdToPhotoMap));

      resolve({
        username: this.currentUser,
        userId: this.currentUserId
      });
    });
  }

  logout() {
    if (this.currentUser) {
      this.removeUsername(this.currentUser);
      this.currentUser = null;
      this.currentUserId = null;
      localStorage.removeItem('userId');
    }
  }

  getUserInfo(userId) {
    return {
      name: this.userIdToNameMap[userId] || userId,
      photo: this.userIdToPhotoMap[userId] || DEFAULT_PROFILE_PHOTO
    };
  }

  isValidUserId(userId) {
    return this.userIdToNameMap.hasOwnProperty(userId);
  }

  loadUserId() {
    return localStorage.getItem('userId');
  }
}

export const auth = new Auth();
