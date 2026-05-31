"use client";

import { useEffect, useRef } from "react";

interface HeroVideoProps {
  mp4Src?: string;
  hlsSrc?: string;
  posterSrc?: string;
  className?: string;
  preload?: "none" | "metadata" | "auto";
  ariaLabel?: string;
}

const HLS_MIME = "application/vnd.apple.mpegurl";

export function HeroVideo({
  mp4Src,
  hlsSrc,
  posterSrc,
  className,
  preload = "metadata",
  ariaLabel = "Hero background video",
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let active = true;
    let detachErrorHandler: (() => void) | null = null;
    let hls: import("hls.js").default | null = null;
    let hlsStartupTimer: ReturnType<typeof setTimeout> | null = null;

    const tryPlay = () => {
      const maybePromise = video.play();
      if (maybePromise && typeof maybePromise.catch === "function") {
        void maybePromise.catch(() => {
          // Autoplay can still be blocked by browser/user policies.
        });
      }
    };

    const setMp4Fallback = () => {
      if (!mp4Src) return false;
      if (video.src !== mp4Src) video.src = mp4Src;
      tryPlay();
      return true;
    };

    const tryNativeHls = () => {
      if (!hlsSrc) return false;
      if (!video.canPlayType(HLS_MIME)) return false;
      if (video.src !== hlsSrc) video.src = hlsSrc;
      tryPlay();
      return true;
    };

    const setup = async () => {
      if (!hlsSrc) {
        setMp4Fallback();
        return;
      }

      if (tryNativeHls()) return;

      const { default: Hls } = await import("hls.js");
      if (!active) return;

      if (!Hls.isSupported()) {
        setMp4Fallback();
        return;
      }

      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(hlsSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        tryPlay();
      });

      // Guard against silent HLS startup failures by falling back quickly.
      hlsStartupTimer = setTimeout(() => {
        if (!active || !hls) return;
        if (video.currentTime > 0 || video.readyState >= 2) return;
        hls.destroy();
        hls = null;
        setMp4Fallback();
      }, 2500);

      const onError = (_event: string, data: { fatal?: boolean }) => {
        if (!data.fatal) return;
        hls?.destroy();
        hls = null;
        setMp4Fallback();
      };

      hls.on(Hls.Events.ERROR, onError);
      detachErrorHandler = () => hls?.off(Hls.Events.ERROR, onError);
    };

    video.addEventListener("canplay", tryPlay);
    tryPlay();
    void setup();

    return () => {
      active = false;
      if (hlsStartupTimer) {
        clearTimeout(hlsStartupTimer);
      }
      video.removeEventListener("canplay", tryPlay);
      detachErrorHandler?.();
      hls?.destroy();
    };
  }, [hlsSrc, mp4Src]);

  return (
    <video
      ref={videoRef}
      src={mp4Src}
      autoPlay
      muted
      loop
      playsInline
      preload={preload}
      poster={posterSrc}
      className={className}
      aria-label={ariaLabel}
    />
  );
}
