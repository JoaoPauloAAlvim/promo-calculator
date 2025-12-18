import type { ReactNode } from "react";

type AppHeaderProps = {
  title: string;
  rightSlot?: ReactNode;
};

export function AppHeader({ title, rightSlot }: AppHeaderProps) {
  return (
    <header
      style={{
        backgroundColor: "#e5e7eb",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "24px",
          fontWeight: 700,
          color: "#0f172a",
        }}
      >
        {title}
      </h1>
      {rightSlot && rightSlot}
    </header>
  );
}
