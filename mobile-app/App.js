import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Platform, BackHandler, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

// Replace with your actual live production URL when deploying
const WEBSITE_URL = 'https://ai-expanse-demo.vercel.app/'; // Temporary fallback, change this to your actual Vercel/live URL

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Handle hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, [canGoBack]);

  const onNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Configure StatusBar to match the website's dark theme */}
      <StatusBar barStyle="light-content" backgroundColor="#06070e" />
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: WEBSITE_URL }}
          style={styles.webview}
          onNavigationStateChange={onNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7c3aed" />
            </View>
          )}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          pullToRefreshEnabled={true}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06070e', // Match the website background
  },
  webviewContainer: {
    flex: 1,
    // Add top padding on Android to avoid drawing under the notch/status bar if SafeAreaView isn't enough
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#06070e',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#06070e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  }
});
