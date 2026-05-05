import { useEffect, useState } from "react";

const ANIMATION_STORAGE_KEY = "alevant_logo_animation_time";
const ANIMATION_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export function useLogoAnimation() {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const lastAnimationTime = sessionStorage.getItem(ANIMATION_STORAGE_KEY);
    const now = Date.now();

    if (!lastAnimationTime) {
      // First time in this session
      setShouldAnimate(true);
      sessionStorage.setItem(ANIMATION_STORAGE_KEY, now.toString());
    } else {
      const elapsed = now - parseInt(lastAnimationTime, 10);
      if (elapsed > ANIMATION_EXPIRY_MS) {
        // 10+ minutes have passed, re-animate
        setShouldAnimate(true);
        sessionStorage.setItem(ANIMATION_STORAGE_KEY, now.toString());
      } else {
        // Animation already ran recently, skip it
        setShouldAnimate(false);
      }
    }
  }, []);

  return shouldAnimate;
}
