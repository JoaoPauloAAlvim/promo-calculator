import { NextResponse } from "next/server";
import { db } from "@/lib/knex";
import { MonitoramentoItem } from "@/lib/types";
import { toNumberBR } from "@/lib/format";
import { isISODate } from "@/lib/date";
import { requireAuth } from "@/lib/authGuard";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const denied = requireAuth();
    if (denied) return denied;

    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const row = await db("historico")
      .select("id", "dataHora", "resultado")
      .where({ id })
      .first();

    if (!row) {
      return NextResponse.json(
        { error: "Registro de histórico não encontrado." },
        { status: 404 }
      );
    }

    let resultado: any = {};
    if (typeof row.resultado === "string") {
      try {
        resultado = JSON.parse(row.resultado);
      } catch {
        resultado = {};
      }
    } else {
      resultado = row.resultado || {};
    }

    return NextResponse.json({
      id: row.id,
      dataHora: row.dataHora,
      resultado,
    });
  } catch (err: any) {
    console.error("ERRO GET /api/historico/:id:", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao carregar detalhe." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const denied = requireAuth();
    if (denied) return denied;

    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido para atualização." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Body inválido." },
        { status: 400 }
      );
    }

    const row = await db("historico")
      .select("resultado")
      .where({ id })
      .first();

    if (!row) {
      return NextResponse.json(
        { error: "Registro de histórico não encontrado." },
        { status: 404 }
      );
    }

    const atual =
      typeof row.resultado === "string"
        ? JSON.parse(row.resultado)
        : row.resultado || {};

    const metasAtuais = (atual?.metas && typeof atual.metas === "object") ? atual.metas : {};

    const hasVendaReal =
      body.qtdVendida !== undefined ||
      body.lucroHistPeriodo !== undefined ||
      body.lucroRealPromo !== undefined ||
      body.diff !== undefined ||
      body.situacao !== undefined;

    let vendaRealPatch: any = null;

    if (hasVendaReal) {
      const qtdVendida = toNumberBR(body.qtdVendida);
      const lucroHistPeriodo = toNumberBR(body.lucroHistPeriodo);
      const lucroRealPromo = toNumberBR(body.lucroRealPromo);
      const diff = toNumberBR(body.diff);
      const situacao = String(body.situacao || "").toUpperCase();

      if (!Number.isFinite(qtdVendida) || qtdVendida <= 0) {
        return NextResponse.json(
          { error: "Quantidade vendida inválida." },
          { status: 400 }
        );
      }

      if (
        !Number.isFinite(lucroHistPeriodo) ||
        !Number.isFinite(lucroRealPromo) ||
        !Number.isFinite(diff)
      ) {
        return NextResponse.json(
          { error: "Valores de lucro inválidos." },
          { status: 400 }
        );
      }

      if (!["ACIMA", "ABAIXO", "IGUAL"].includes(situacao)) {
        return NextResponse.json(
          { error: "Situação inválida." },
          { status: 400 }
        );
      }

      vendaRealPatch = {
        qtd_vendida: qtdVendida,
        lucro_hist_periodo: lucroHistPeriodo,
        lucro_real_promo: lucroRealPromo,
        diff,
        situacao,
        atualizadoEm: new Date().toISOString(),
      };
    }

    let monitoramentoPatch: MonitoramentoItem[] | null = null;

    if (body.monitoramento) {
      const data = body.monitoramento.data;
      const vendido = toNumberBR(body.monitoramento.vendido);
      const estoque = toNumberBR(body.monitoramento.estoque);

      if (!isISODate(data)) {
        return NextResponse.json(
          { error: "Data do monitoramento inválida (use AAAA-MM-DD)." },
          { status: 400 }
        );
      }
      if (!Number.isFinite(vendido) || vendido < 0) {
        return NextResponse.json(
          { error: "Vendido acumulado inválido (>= 0)." },
          { status: 400 }
        );
      }
      if (!Number.isFinite(estoque) || estoque < 0) {
        return NextResponse.json(
          { error: "Estoque inválido (>= 0)." },
          { status: 400 }
        );
      }

      const lista: MonitoramentoItem[] = Array.isArray(metasAtuais.monitoramento)
        ? metasAtuais.monitoramento
        : [];

      const novo: MonitoramentoItem = {
        data,
        vendido: Math.floor(vendido),
        estoque: Math.floor(estoque),
        criadoEm: new Date().toISOString(),
      };

      const idx = lista.findIndex((x) => x?.data === data);
      if (idx >= 0) lista[idx] = novo;
      else lista.push(novo);

      lista.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));

      monitoramentoPatch = lista;
    }

    if (!hasVendaReal && !body.monitoramento) {
      return NextResponse.json(
        { error: "Nada para atualizar." },
        { status: 400 }
      );
    }

    const novoResultado = {
      ...atual,
      metas: {
        ...metasAtuais,
        ...(vendaRealPatch ? { venda_real: vendaRealPatch } : {}),
        ...(monitoramentoPatch ? { monitoramento: monitoramentoPatch } : {}),
      },
    };

    const novoValor =
      typeof row.resultado === "string"
        ? JSON.stringify(novoResultado)
        : novoResultado;

    const patchDb: any = { resultado: novoValor };

    if (vendaRealPatch) {
      patchDb.situacao_analise = vendaRealPatch.situacao;
    }

    await db("historico").where({ id }).update(patchDb);


    return NextResponse.json({ ok: true, resultado: novoResultado });
  } catch (err: any) {
    console.error("ERRO PATCH /api/historico/:id:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar histórico." },
      { status: 500 }
    );
  }
}
