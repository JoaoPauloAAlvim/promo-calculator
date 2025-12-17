"use client";

type SpinnerProps = {
  size?: number;
};

export function Spinner({ size = 32 }: SpinnerProps) {
  return (
    <span
      className="
        inline-block animate-spin rounded-full
        border-4 border-slate-300 border-t-indigo-500
      "
      style={{ width: size, height: size }}
    />
  );
}
