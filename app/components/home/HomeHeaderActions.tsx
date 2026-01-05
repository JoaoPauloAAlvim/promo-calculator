"use client";

import Link from "next/link";

type Props = {
  onOpenImport: () => void;
  onLogout: () => void;
};

export function HomeHeaderActions({ onOpenImport, onLogout }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Link href="/historico" className="no-underline">
        <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-[10px] bg-indigo-600 text-white text-xs font-semibold shadow">
          Histórico
        </span>
      </Link>

      <button
        type="button"
        onClick={onOpenImport}
        className="px-3.5 py-1.5 rounded-[10px] bg-teal-700 text-white text-xs font-semibold shadow"
      >
        Importar planilha
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="px-3.5 py-1.5 rounded-[10px] border border-slate-300 bg-red-600 text-white text-xs font-medium"
      >
        Sair
      </button>
    </div>
  );
}
