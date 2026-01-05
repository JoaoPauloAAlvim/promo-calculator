"use client";

type Props = {
  open: boolean;
  message: string;
  onClose: () => void;
};

export function ErrorModal({ open, message, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
        >
          ✕
        </button>

        <div className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 font-bold">
            !
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800 mb-1">
              Não foi possível concluir a simulação
            </p>
            <p className="text-sm text-slate-600">{message}</p>

            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white"
              >
                OK, entendi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
