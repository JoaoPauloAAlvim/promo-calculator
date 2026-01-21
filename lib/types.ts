export type PromoStatus = "SEM_DATAS" | "NAO_INICIOU" | "EM_ANDAMENTO" | "ENCERRADA";
export type AnaliseStatus = "PENDENTE" | "ACIMA" | "ABAIXO" | "IGUAL";

export type Resultado = {
  entrada?: Record<string, any>;
  metas?: Record<string, any>;
};

export type HistoricoItem = {
  id: number;
  dataHora: string;
  resultado: Resultado;
};

export type HistoricoFiltros = {
  produto?: string;
  marca?: string;
  categoria?: string;
  comprador?: string;
  statusPromo?: PromoStatus | "";
  statusAnalise?: AnaliseStatus | "";
  tipoPromocao?: string;
};

export type ChipStyle = {
  label: string;
  bg: string;
  color: string;
  border: string;
};

export type AnalisePromo = {
  lucroHistPeriodo: number;
  lucroRealPromo: number;
  diff: number;
  situacao: "ACIMA" | "ABAIXO" | "IGUAL";
};

export type FormState = {
  produto: string;
  categoria: string;
  comprador: string;
  marca: string;
  tipoPromocao: "INTERNA" | "SCANNTECH" | "";
  dataInicio: string;
  dataFim: string;
  A: string;
  B: string;
  D: string;
  E: string;
  F: string;
};


export type ImportRow = {
  Produto?: string;
  Categoria?: string;
  Marca?: string;
  TipoPromocao?: string;

  PeriodoHistorico?: number | string;
  LucroTotalHistorico?: number | string;
  DataInicioPromocao?: string | number;
  DataFimPromocao?: string | number;
  PrecoPromocional?: number | string;
  CustoUnitario?: number | string;
  ReceitaAdicional?: number | string;
};


export type ResultadoLote = {
  linha: number;
  produto: string;
  ok: boolean;
  erro?: string;
  resultado?: Resultado;
};

export type HistoricoSort =
  | "RECENTE"
  | "ANTIGO"
  | "PRODUTO_AZ"
  | "PROMO_EM_ANDAMENTO"
  | "ANALISE_PENDENTE";

export type HistoricoGetParams = {
  produto?: string;
  marca?: string;
  categoria?: string;
  comprador?: string;
  statusPromo?: string;
  statusAnalise?: string;
  sort?: HistoricoSort;
  page: number;
  pageSize: number;
};

export type MonitoramentoItem = {
  data: string;
  vendido: number;
  estoque: number;
  criadoEm: string;
};