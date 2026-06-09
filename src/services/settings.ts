import { StoreSettings, AppSettings } from '../types';

const defaultStoreSettings: StoreSettings = {
  store_name: 'Wakhid Mart',
  owner_name: 'Wakhid',
  phone: '081234567890',
  address: 'Jl. Teknologi No. 88, Jakarta Selatan'
};

const defaultAppSettings: AppSettings = {
  app_name: 'Wakhid Mart App',
  logo_url: ''
};

export const SettingsService = {
  async getStoreSettings(): Promise<StoreSettings> {
    try {
      const stored = localStorage.getItem('pos_store_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse store settings', e);
    }
    return defaultStoreSettings;
  },

  async updateStoreSettings(settings: StoreSettings): Promise<StoreSettings> {
    localStorage.setItem('pos_store_settings', JSON.stringify(settings));
    return settings;
  },

  async getAppSettings(): Promise<AppSettings> {
    try {
      const stored = localStorage.getItem('pos_app_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse app settings', e);
    }
    return defaultAppSettings;
  },

  async updateAppSettings(settings: AppSettings): Promise<AppSettings> {
    localStorage.setItem('pos_app_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('app_settings_updated'));
    return settings;
  }
};
