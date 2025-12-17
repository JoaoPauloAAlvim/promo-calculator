import Link from "next/link";
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

      {rightSlot ?? (
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 16px",
              borderRadius: "10px",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "14px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}
          >
            Início
          </span>
        </Link>
      )}
    </header>
  );
}
