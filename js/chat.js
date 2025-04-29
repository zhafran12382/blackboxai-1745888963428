import { ably, AUDIO_FILES } from './config.js';
import { auth } from './auth.js';

class Chat {
  constructor() {
    this.currentChat = 'global';
    this.privateUsers = new Set();
    this.globalChannel = ably.channels.get('global-chat');
    this.privateChannels = new Map();
    this.messageSound = new Audio(AUDIO_FILES.sendMessage);
    this.privateMessageSound = new Audio(AUDIO_FILES.privateMessage);
    this.onMessageCallback = null;

    // Subscribe to global chat on initialization
    this.subscribeGlobalChat();
  }

  setMessageCallback(callback) {
    this.onMessageCallback = callback;
  }

  switchToGlobalChat() {
    this.currentChat = 'global';
    this.clearMessages();

    // Unsubscribe from all private channels
    this.privateChannels.forEach(channel => channel.unsubscribe());
    this.privateChannels.clear();

    this.subscribeGlobalChat();
    return 'Global Chat';
  }

  switchToPrivateChat(userId) {
    if (!auth.isValidUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    this.currentChat = userId;
    this.clearMessages();

    // Unsubscribe from global channel
    this.globalChannel.unsubscribe();

    this.subscribePrivateChat(userId);
    const userInfo = auth.getUserInfo(userId);
    return `Chat with ${userInfo.name}`;
  }

  subscribeGlobalChat() {
    this.globalChannel.subscribe((msg) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(msg.data, false);
      }
    });
  }

  clearMessages() {
    // This will be implemented by the UI
  }

  subscribePrivateChat(userId) {
    if (!this.privateChannels.has(userId)) {
      const channel = ably.channels.get(`private-chat-${[auth.currentUserId, userId].sort().join('-')}`);
      this.privateChannels.set(userId, channel);
      channel.subscribe((msg) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(msg.data, true);
        }
      });
    }
  }

  sendMessage(text, type = 'text') {
    const message = {
      text,
      from: auth.currentUser,
      type
    };

    this.messageSound.play();

    if (this.currentChat === 'global') {
      this.globalChannel.publish('message', message);
    } else {
      const channel = this.privateChannels.get(this.currentChat);
      if (channel) {
        channel.publish('message', message);
      }
    }

    return message;
  }

  addUser(userId) {
    if (userId === auth.currentUserId) {
      throw new Error('Cannot add yourself');
    }

    if (!auth.isValidUserId(userId)) {
      throw new Error('User ID not found');
    }

    if (this.privateUsers.has(userId)) {
      throw new Error('User already added');
    }

    this.privateUsers.add(userId);
    return auth.getUserInfo(userId);
  }

  getPrivateUsers() {
    return Array.from(this.privateUsers).map(userId => ({
      id: userId,
      ...auth.getUserInfo(userId)
    }));
  }

  clearMessages() {
    // This will be implemented by the UI
  }

  playPrivateMessageSound() {
    this.privateMessageSound.play();
  }

  cleanup() {
    this.globalChannel.unsubscribe();
    this.privateChannels.forEach(channel => channel.unsubscribe());
  }
}

export const chat = new Chat();
