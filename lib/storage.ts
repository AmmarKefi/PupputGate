import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Auth tokens live in SecureStore (encrypted). Non-sensitive preferences
 * (locale, onboarding drafts) live in AsyncStorage. Never store tokens in
 * AsyncStorage.
 */
const TOKEN_KEY = 'pupput.auth.token';

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}
export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function getPref(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`pupput.pref.${key}`);
  } catch {
    return null;
  }
}
export async function setPref(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`pupput.pref.${key}`, value);
  } catch {
    /* ignore */
  }
}
