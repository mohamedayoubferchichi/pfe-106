import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'userRole';
const USER_ID_KEY = 'userId';
const USER_EMAIL_KEY = 'userEmail';
const USER_NAME_KEY = 'userDisplayName';
const AGENT_AGENCE_KEY = 'agentAgenceId';

export const authStorage = {
  async getToken() {
    return AsyncStorage.getItem(TOKEN_KEY);
  },
  async getRole() {
    return AsyncStorage.getItem(ROLE_KEY);
  },
  async getUserId() {
    return AsyncStorage.getItem(USER_ID_KEY);
  },
  async clear() {
    await AsyncStorage.multiRemove([
      TOKEN_KEY,
      ROLE_KEY,
      USER_ID_KEY,
      USER_EMAIL_KEY,
      USER_NAME_KEY,
      AGENT_AGENCE_KEY
    ]);
  }
};
