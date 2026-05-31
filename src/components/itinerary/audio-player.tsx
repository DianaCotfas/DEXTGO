"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  durationSeconds?: number;
  variant?: "default" | "slim";
}

export function AudioPlayer({
  src,
  durationSeconds,
  variant = "default",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime);
    const onLoaded = () => setDuration(a.duration);
    const onEnded = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
      // Track audio play event
      (window as { gtag?: (...args: unknown[]) => void }).gtag?.("event", "audio_play", {
        audio_src: src,
      });
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const value = Number(e.target.value);
    a.currentTime = value;
    setProgress(value);
  };

  const cycleRate = () => {
    const a = audioRef.current;
    if (!a) return;
    const next = rate >= 1.5 ? 1 : Number((rate + 0.25).toFixed(2));
    a.playbackRate = next;
    setRate(next);
  };

  const isSlim = variant === "slim";

  return (
    <div
      className={`flex items-center gap-2.5 bg-[#F5F5F7] ${
        isSlim ? "rounded-full px-3 py-2" : "rounded-xl px-4 py-3"
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center justify-center rounded-full bg-[#FF453A] text-white ${
          isSlim ? "h-7 w-7" : "h-9 w-9"
        }`}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className={isSlim ? "h-3.5 w-3.5" : "w-4 h-4"} />
        ) : (
          <Play className={isSlim ? "h-3.5 w-3.5 ml-0.5" : "w-4 h-4 ml-0.5"} />
        )}
      </button>
      <div className="flex-1">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={progress}
          onChange={seek}
          className={`w-full accent-[#FF453A] ${isSlim ? "h-1.5" : ""}`}
        />
        {!isSlim && (
          <div className="mt-1 flex justify-between text-[10px] font-mono text-foreground/50">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={cycleRate}
        className={`rounded-full border border-black/10 bg-white font-semibold text-foreground/70 hover:bg-black/[0.03] ${
          isSlim ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
        }`}
        aria-label="Change playback speed"
      >
        {rate.toFixed(2).replace(".00", "")}x
      </button>
      {isSlim && (
        <span className="text-[10px] font-mono text-foreground/45 tabular-nums">
          {formatTime(progress)} / {formatTime(duration)}
        </span>
      )}
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
