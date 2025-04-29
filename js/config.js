// Ably configuration
const ABLY_API_KEY = '4-dL3Q.VkaXwg:NdfoNIBv4zQS8ijCYG36X35_oroa7LJVZiV8zsx4MT8';

// Initialize Ably
const ably = new Ably.Realtime(ABLY_API_KEY);

// Default profile photo
const DEFAULT_PROFILE_PHOTO = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

// Audio files
const AUDIO_FILES = {
  privateMessage: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  sendMessage: 'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg',
  notification: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg'
};

// Constants
const CONSTANTS = {
  USER_ID_LENGTH: 8,
  FIXED_PASSWORD: 'Ratubagus'
};

export {
  ably,
  DEFAULT_PROFILE_PHOTO,
  AUDIO_FILES,
  CONSTANTS
};
