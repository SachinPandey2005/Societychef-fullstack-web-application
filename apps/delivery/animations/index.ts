import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/** Fade‑in hook – simple opacity animation */
export const useFadeIn = (duration = 300) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, []);
  return opacity;
};

/** Scale‑in hook – animates from 0.9 → 1 */
export const useScaleIn = (duration = 300) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 20,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, []);
  return scale;
};

/** Slide‑in hook – slides from the right */
export const useSlideIn = (offset = 30, duration = 300) => {
  const translateX = useRef(new Animated.Value(offset)).current;
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  return translateX;
};

/** Pulse animation – quick scaling pulse */
export const usePulse = (duration = 500, minVal = 0.95, maxVal = 1.05) => {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: maxVal,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: minVal,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [duration, minVal, maxVal]);
  return scale;
};

/** Shimmer pulse – opacity shimmer for skeleton loaders */
export const useShimmerPulse = (duration = 1500) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  return opacity;
};

/** Staggered fade‑in for a list of Animated.Values */
export const useStaggeredFadeIn = (itemCount: number, baseDelay = 100) => {
  const animations = useRef<Animated.Value[]>(
    Array.from({ length: itemCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const staggered = animations.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: i * baseDelay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    Animated.stagger(baseDelay, staggered).start();
  }, []);

  return animations;
};

/** Spring scale hook – returns an Animated.Value that springs from 0.9 to 1 */
export const useSpringScale = (duration = 250) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 20,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, []);
  return scale;
};

/** Count‑up animation for numbers – useful for balances, earnings, etc. */
export const useCountUp = (target: number, duration = 800) => {
  const animated = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animated, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [target, duration]);
  return animated;
};

export default {
  useFadeIn,
  useScaleIn,
  useSlideIn,
  usePulse,
  useShimmerPulse,
  useStaggeredFadeIn,
  useSpringScale,
  useCountUp,
};
