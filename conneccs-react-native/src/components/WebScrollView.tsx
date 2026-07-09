import React from 'react';
import { ScrollView, Platform, View } from 'react-native';

/**
 * Web-compatible ScrollView wrapper
 * On web, uses a View with proper overflow styling
 * On mobile, uses native ScrollView
 */
export const WebScrollView = ({ children, style, contentContainerStyle, ...props }: any) => {
  if (Platform.OS === 'web') {
    // On web, we need to use a different approach
    // The outer div acts as the scroll container
    // The inner div holds the content
    return (
      <View
        style={[
          {
            flex: 1,
            // @ts-ignore - web-specific styles
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
            maxHeight: '100%',
          },
          style,
        ]}
      >
        <View style={contentContainerStyle}>
          {children}
        </View>
      </View>
    );
  }
  
  return (
    <ScrollView style={style} contentContainerStyle={contentContainerStyle} {...props}>
      {children}
    </ScrollView>
  );
};

export default WebScrollView;
