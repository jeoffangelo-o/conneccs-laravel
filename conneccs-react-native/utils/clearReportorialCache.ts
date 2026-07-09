import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clear all reportorial-related data from AsyncStorage
 * Use this if requirements are not showing up properly
 */
export const clearReportorialCache = async () => {
  try {
    console.log('Clearing reportorial cache...');
    
    // Use removeItem instead of multiRemove for web compatibility
    const keys = [
      'reportorial_data_version',
      'reportorial_requirements',
      'reportorial_submissions',
      'reportorial_reminders',
      'reportorial_reports',
      'message_channels',
      'messages',
    ];
    
    for (const key of keys) {
      await AsyncStorage.removeItem(key);
    }
    
    console.log('✅ Reportorial cache cleared successfully!');
    console.log('Please refresh the app to reload initial data.');
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing reportorial cache:', error);
    return false;
  }
};

/**
 * Clear ALL AsyncStorage data (use with caution!)
 */
export const clearAllCache = async () => {
  try {
    console.log('Clearing ALL AsyncStorage...');
    await AsyncStorage.clear();
    console.log('✅ All cache cleared successfully!');
    console.log('Please refresh the app to reload all data.');
    return true;
  } catch (error) {
    console.error('❌ Error clearing all cache:', error);
    return false;
  }
};

/**
 * Debug: Show all reportorial data in AsyncStorage
 */
export const debugReportorialData = async () => {
  try {
    const keys = [
      'reportorial_data_version',
      'reportorial_requirements',
      'reportorial_submissions',
      'reportorial_reminders',
      'reportorial_reports',
      'message_channels',
      'messages',
    ];
    
    console.log('=== REPORTORIAL DEBUG DATA ===');
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          console.log(`${key}:`, Array.isArray(parsed) ? `${parsed.length} items` : parsed);
        } catch {
          console.log(`${key}:`, value);
        }
      } else {
        console.log(`${key}:`, 'null');
      }
    }
    
    console.log('=== END DEBUG DATA ===');
  } catch (error) {
    console.error('Error debugging reportorial data:', error);
  }
};
