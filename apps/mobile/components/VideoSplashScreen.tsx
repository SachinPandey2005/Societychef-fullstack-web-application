import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const splashVideoAsset = require('../assets/create_a_splash_screen_video_f.mp4');

interface VideoSplashScreenProps {
  onPrepareRoute?: () => void;
  onFinish: () => void;
  /** Hard ceiling in ms before we bail out of the splash regardless of video state. */
  maxDurationMs?: number;
}

// The actual splash asset (assets/create_a_splash_screen_video_f.mp4) is
// ~10.0s long. The fallback timeout below used to default to 4000ms — a
// safety net against a stuck/undecodable video on some device, added without
// checking the real clip length — which meant it fired on every normal
// playback too, cutting the animation off at the 4s mark whether it was
// working or not. Give it real headroom past the actual duration so it only
// ever triggers for a genuine stall.
const SPLASH_VIDEO_DURATION_MS = 10000;

export function VideoSplashScreen({ onPrepareRoute, onFinish, maxDurationMs = SPLASH_VIDEO_DURATION_MS + 2000 }: VideoSplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isFading = useRef(false);

  const player = useVideoPlayer(splashVideoAsset, (p) => {
    p.loop = false;
    p.muted = true;
    try {
      p.play();
    } catch (e) {
      // Playback failed to start (e.g. codec issue on this device) — the
      // fallback timeout below will still get the user into the app.
      console.warn('[VideoSplashScreen] play() failed:', e);
    }
  });

  const triggerBlendTransition = () => {
    if (isFading.current) return;
    isFading.current = true;

    // 1. Prepare target route in background so target page is mounted underneath
    if (onPrepareRoute) {
      onPrepareRoute();
    }

    // 2. Smoothly blend/fade out the splash screen overlay over 550ms
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 550,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  };

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      triggerBlendTransition();
    });
    // Some devices/codecs can fail silently instead of emitting playToEnd —
    // surface player errors and fall through to the timeout below rather
    // than leaving the user stuck on the splash screen.
    const errorSubscription = player.addListener('statusChange', (payload: any) => {
      if (payload?.status === 'error') {
        console.warn('[VideoSplashScreen] player status error:', payload?.error);
        triggerBlendTransition();
      }
    });

    // Hard fallback: never let a stalled/undecodable video block app entry.
    const timeoutId = setTimeout(() => {
      triggerBlendTransition();
    }, maxDurationMs);

    return () => {
      subscription?.remove();
      errorSubscription?.remove();
      clearTimeout(timeoutId);
    };
  }, [player]);

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim }]}
      pointerEvents={isFading.current ? 'none' : 'auto'}
    >
      {Platform.OS === 'web' ? (
        <video
          src={splashVideoAsset}
          autoPlay
          muted
          playsInline
          onEnded={triggerBlendTransition}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A2116',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
