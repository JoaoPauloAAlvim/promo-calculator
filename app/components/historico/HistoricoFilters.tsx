"use client";

import React from "react";

type Props = {
  filtroProdutoDigitado: string;
  filtroMarca: string;
  filtroCategoria: string;
  filtroComprador: string;
  filtroStatusPromo: string;
  filtroStatus: string;
  sort: string;
  filtroTipoPromocao: string;

  setFiltroTipoPromocao: (v: string) => void;
  setSort: (v: string) => void;
  setFiltroProdutoDigitado: (v: string) => void;
  setFiltroMarca: (v: string) => void;
  setFiltroCategoria: (v: string) => void;
  setFiltroComprador: (v: string) => void;
  setFiltroStatusPromo: (v: string) => void;
  setFiltroStatus: (v: string) => void;

  opcoesMarca: string[];
  opcoesCategoria: string[];
  opcoesComprador: string[];

  setPage: (v: number) => void;

  onClear: () => void;
};

export function HistoricoFilters({
  filtroProdutoDigitado,
  filtroMarca,
  filtroCategoria,
  filtroComprador,
  filtroTipoPromocao,
  filtroStatusPromo,
  filtroStatus,
  sort,

  setFiltroProdutoDigitado,
  setFiltroTipoPromocao,
  setFiltroMarca,
  setFiltroCategoria,
  setFiltroComprador,
  setFiltroStatusPromo,
  setFiltroStatus,
  setSort,

  opcoesMarca,
  opcoesCategoria,
  opcoesComprador,

  setPage,
  onClear,
}: Props) {
  return (
    <section
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        padding: "10px 16px",
        boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>
          Filtros do histórico
        </p>

        <button
          type="button"
          onClick={onClear}
          style={{
            fontSize: "11px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            padding: "3px 10px",
            backgroundColor: "#f9fafb",
            color: "#4b5563",
            cursor: "pointer",
          }}
        >
          Limpar filtros
        </button>
      </div>



      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
          columnGap: 24,
          rowGap: 8,
          alignItems: "end",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 500,
              color: "#6b7280",
              marginBottom: "4px",
            }}
          >
            Produto
          </label>
          <input
            type="text"
            value={filtroProdutoDigitado}
            onChange={(e) => {
              setFiltroProdutoDigitado(e.target.value);
              setPage(1);
            }}
            placeholder="Ex: creme dental"
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: "12px",
              backgroundColor: "#f9fafb",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 500,
              color: "#6b7280",
              marginBottom: "4px",
            }}
          >
            Marca
          </label>
          <select
            value={filtroMarca}
            onChange={(e) => {
              setFiltroMarca(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: "12px",
              backgroundColor: "#f9fafb",
            }}
          >
            <option value="">Todas</option>
            {opcoesMarca.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 500,
              color: "#6b7280",
              marginBottom: "4px",
            }}
          >
            Categoria
          </label>
          <select
            value={filtroCategoria}
            onChange={(e) => {
              setFiltroCategoria(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: "12px",
              backgroundColor: "#f9fafb",
            }}
          >
            <option value="">Todas</option>
            {opcoesCategoria.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 500,
              color: "#6b7280",
              marginBottom: "4px",
            }}
          >
            Comprador
          </label>
          <select
            value={filtroComprador}
            onChange={(e) => {
              setFiltroComprador(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              padding: "6px 10px",
              fontSize: "12px",
              backgroundColor: "#f9fafb",
            }}

          >
            <option value="">Todos</option>
            {opcoesComprador.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "11px", fontWeight: 500, color: "#6b7280" }}>Tipo</label>
          <select
            value={filtroTipoPromocao}
            onChange={(e) => { setFiltroTipoPromocao(e.target.value); setPage(1); }}
            style={{
              minWidth: "180px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              padding: "4px 10px",
              fontSize: "12px",
              backgroundColor: "#f9fafb",
            }}
          >
            <option value="">Todas</option>
            <option value="INTERNA">INTERNA</option>
            <option value="SCANNTECH">SCANNTECH</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "11px", fontWeight: 500, color: "#6b7280" }}>
            Status da promoção
          </label>
          <select
            value={filtroStatusPromo}
            onChange={(e) => {
              setFiltroStatusPromo(e.target.value);
              setPage(1);
            }}
            style={{
              minWidth: "180px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              padding: "4px 10px",
              fontSize: "12px",
              backgroundColor: "#f9fafb",
            }}
          >
            <option value="">Todas</option>
            <option value="NAO_INICIOU">Não iniciadas</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="ENCERRADA">Encerradas</option>
            <option value="SEM_DATAS">Sem datas</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "11px", fontWeight: 500, color: "#6b7280" }}>
            Status da análise
          </label>
          <select
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              setPage(1);
            }}
            style={{
              minWidth: "180px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              padding: "4px 10px",
              fontSize: "12px",
              backgroundColor: "#f9fafb",
            }}
          >
            <option value="">Todas</option>
            <option value="PENDENTE">Pendente</option>
            <option value="ACIMA">ACIMA</option>
            <option value="IGUAL">IGUAL</option>
            <option value="ABAIXO">ABAIXO</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "11px", fontWeight: 500, color: "#6b7280" }}>
            Ordenar por
          </label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            style={{
              minWidth: "180px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              padding: "4px 10px",
              fontSize: "12px",
              backgroundColor: "#f9fafb",
            }}
          >
            <option value="RECENTE">Mais recentes</option>
            <option value="ANTIGO">Mais antigas</option>
            <option value="PROMO_EM_ANDAMENTO">Em andamento primeiro</option>
            <option value="ANALISE_PENDENTE">Pendentes primeiro</option>
            <option value="PRODUTO_AZ">Produto A–Z</option>
          </select>
        </div>
      </div>
    </section>
  );
}
