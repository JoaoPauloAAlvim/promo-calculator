type Props = {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  itensNaPagina: number;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
};

export function HistoricoPagination({
  totalCount,
  page,
  pageSize,
  totalPages,
  itensNaPagina,
  onFirst,
  onPrev,
  onNext,
  onLast,
}: Props) {
  return (
    <div
      style={{
        marginTop: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: "11px", color: "#6b7280" }}>
        {totalCount > 0 ? (
          <>
            Página {page} de {totalPages} – exibindo {itensNaPagina} de {totalCount} registro
            {totalCount === 1 ? "" : "s"}
          </>
        ) : (
          "Nenhuma simulação encontrada."
        )}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          onClick={onFirst}
          disabled={page === 1}
          style={{
            fontSize: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            padding: "4px 10px",
            backgroundColor: page === 1 ? "#f3f4f6" : "#ffffff",
            color: page === 1 ? "#9ca3af" : "#4b5563",
            cursor: page === 1 ? "default" : "pointer",
          }}
        >
          ⏮ Primeira
        </button>

        <button
          type="button"
          onClick={onPrev}
          disabled={page === 1}
          style={{
            fontSize: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            padding: "4px 10px",
            backgroundColor: page === 1 ? "#f3f4f6" : "#ffffff",
            color: page === 1 ? "#9ca3af" : "#4b5563",
            cursor: page === 1 ? "default" : "pointer",
          }}
        >
          ◀ Anterior
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          style={{
            fontSize: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            padding: "4px 10px",
            backgroundColor: page >= totalPages ? "#f3f4f6" : "#ffffff",
            color: page >= totalPages ? "#9ca3af" : "#4b5563",
            cursor: page >= totalPages ? "default" : "pointer",
          }}
        >
          Próxima ▶
        </button>

        <button
          type="button"
          onClick={onLast}
          disabled={page >= totalPages}
          style={{
            fontSize: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            padding: "4px 10px",
            backgroundColor: page >= totalPages ? "#f3f4f6" : "#ffffff",
            color: page >= totalPages ? "#9ca3af" : "#4b5563",
            cursor: page >= totalPages ? "default" : "pointer",
          }}
        >
          Última ⏭
        </button>
      </div>
    </div>
  );
}
