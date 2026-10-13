import { useState, useEffect, useRef } from 'react';
export { useTheme } from '../theme/ThemeContext';

/**
 * A countdown timer hook for handling OTP resend limits or order delivery targets.
 */
export function useCountdown(initialSeconds: number, onComplete?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onComplete) onComplete();
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsLeft, onComplete]);

  const reset = (secs: number = initialSeconds) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSecondsLeft(secs);
  };

  const formattedTime = () => {
    const minutes = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return { secondsLeft, reset, formattedTime };
}
