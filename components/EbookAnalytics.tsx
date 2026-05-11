import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Eye, Instagram, MessageSquare, Clock,
  TrendingUp, Users, CheckCircle2, ExternalLink, AlertTriangle, Download, Calendar
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
);

const TOTAL_PAGES = 15;

const PAGE_TITLES: Record<number, string> = {
  1: "Capa",
  2: "Por que este guia?",
  3: "Avaliação de riscos",
  4: "Câmeras: onde instalar",
  5: "Câmeras: o que observar",
  6: "Controle de acesso",
  7: "Boas práticas de portaria",
  8: "Como escolher empresa",
  9: "Contrato de segurança",
  10: "Erros comuns",
  11: "Mais erros comuns",
  12: "Checklist (16 itens)",
  13: "Placar de avaliação",
  14: "Responsabilidade legal",
  15: "Contatos SEGCOMP",
};

type Preset = "7d" | "30d" | "90d" | "all" | "custom";

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatTempo(segundos: number): string {
  if (segundos < 60) return `${segundos}s`;
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function EbookAnalytics() {
  const [preset, setPreset] = useState<Preset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [exportando, setExportando] = useState(false);

  // Calcular dateFrom/dateTo a partir do preset
  const { dateFrom, dateTo } = useMemo(() => {
    const today = new Date();
    if (preset === "all") return { dateFrom: undefined, dateTo: undefined };
    if (preset === "custom") {
      return {
        dateFrom: customFrom || undefined,
        dateTo: customTo || undefined,
      };
    }
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    const from = new Date(today);
    from.setDate(from.getDate() - days);
    return { dateFrom: toISODate(from), dateTo: toISODate(today) };
  }, [preset, customFrom, customTo]);

  const queryInput = useMemo(() => {
    if (!dateFrom && !dateTo) return undefined;
    return { dateFrom, dateTo };
  }, [dateFrom, dateTo]);

  const { data: stats, isLoading, refetch } = trpc.ebook.stats.useQuery(queryInput, {
    refetchInterval: 30000,
  });
  const utils = trpc.useUtils();

  async function handleExportCsv() {
    setExportando(true);
    try {
      const result = await utils.ebook.exportCsv.fetch(queryInput);
      if (!result || !result.csv) {
        toast.error("Nenhum dado para exportar.");
        return;
      }
      const bom = "\uFEFF";
      const blob = new Blob([bom + result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const hoje = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
      const sufixo = preset !== "all" ? `-${preset}` : "";
      a.href = url;
      a.download = `ebook-sessoes${sufixo}-${hoje}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`CSV exportado com ${result.total} sessões!`);
    } catch {
      toast.error("Erro ao exportar. Tente novamente.");
    } finally {
      setExportando(false);
    }
  }

  // Calcular taxa de retenção por página
  const retencao: number[] = useMemo(() => {
    if (!stats || stats.total === 0) return Array(TOTAL_PAGES).fill(0);
    return Array.from({ length: TOTAL_PAGES }, (_, i) => {
      const pg = i + 1;
      const chegaram = stats.sessoes.filter(s => s.paginaMaxima >= pg).length;
      return Math.round((chegaram / stats.total) * 100);
    });
  }, [stats]);

  const quedas: number[] = useMemo(() =>
    retencao.map((ret, i) => (i === 0 ? 0 : retencao[i - 1] - ret)),
    [retencao]
  );

  const maiorQuedaIdx = useMemo(() =>
    quedas.slice(1).reduce((maxIdx, val, idx) =>
      val > quedas[maxIdx + 1] ? idx : maxIdx, 0) + 1,
    [quedas]
  );

  const top3Abandono = useMemo(() =>
    quedas
      .map((q, i) => ({ pagina: i + 1, queda: q, titulo: PAGE_TITLES[i + 1] }))
      .filter(x => x.pagina > 1)
      .sort((a, b) => b.queda - a.queda)
      .slice(0, 3),
    [quedas]
  );

  const labels = Array.from({ length: TOTAL_PAGES }, (_, i) => `Pág. ${i + 1}`);

  const barColors = retencao.map((ret, i) => {
    if (i === maiorQuedaIdx) return "rgba(239, 68, 68, 0.85)";
    if (ret < 30) return "rgba(249, 115, 22, 0.75)";
    if (ret < 60) return "rgba(234, 179, 8, 0.75)";
    return "rgba(20, 184, 166, 0.75)";
  });

  const retencaoChartData = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: "Retenção (%)",
        data: retencao,
        backgroundColor: barColors,
        borderColor: barColors.map(c => c.replace("0.75", "1").replace("0.85", "1")),
        borderWidth: 1.5,
        borderRadius: 4,
        order: 2,
      },
      {
        type: "line" as const,
        label: "Tendência",
        data: retencao,
        borderColor: "rgba(99, 102, 241, 0.8)",
        borderWidth: 2,
        pointBackgroundColor: retencao.map((_, i) =>
          i === maiorQuedaIdx ? "rgb(239, 68, 68)" : "rgba(99, 102, 241, 0.8)"
        ),
        pointRadius: retencao.map((_, i) => i === maiorQuedaIdx ? 7 : 3),
        fill: false,
        tension: 0.3,
        order: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0].dataIndex;
            return `Pág. ${idx + 1} — ${PAGE_TITLES[idx + 1]}`;
          },
          label: (item: any) => {
            const idx = item.dataIndex;
            const ret = retencao[idx];
            const queda = quedas[idx];
            const lines = [`Retenção: ${ret}%`];
            if (idx > 0 && queda > 0) lines.push(`Queda: -${queda}% vs pág. anterior`);
            if (idx === maiorQuedaIdx) lines.push("⚠️ Maior ponto de abandono");
            return lines;
          },
        },
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#e2e8f0",
        bodyColor: "#94a3b8",
        padding: 12,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#94a3b8" } },
      y: {
        min: 0, max: 100,
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: { font: { size: 11 }, color: "#94a3b8", callback: (v: any) => `${v}%` },
      },
    },
  };

  const quedaChartData = {
    labels: labels.slice(1),
    datasets: [{
      label: "Abandono (%)",
      data: quedas.slice(1),
      backgroundColor: quedas.slice(1).map((_, i) =>
        i + 1 === maiorQuedaIdx ? "rgba(239, 68, 68, 0.85)" : "rgba(249, 115, 22, 0.6)"
      ),
      borderColor: quedas.slice(1).map((_, i) =>
        i + 1 === maiorQuedaIdx ? "rgb(220, 38, 38)" : "rgb(234, 88, 12)"
      ),
      borderWidth: 1.5,
      borderRadius: 4,
    }],
  };

  const quedaOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0].dataIndex + 1;
            return `Pág. ${idx + 1} — ${PAGE_TITLES[idx + 1]}`;
          },
          label: (item: any) => {
            const q = item.raw as number;
            return q > 0 ? `${q}% dos leitores abandonaram aqui` : "Nenhum abandono";
          },
        },
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#e2e8f0",
        bodyColor: "#94a3b8",
        padding: 12,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#94a3b8" } },
      y: {
        min: 0,
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: { font: { size: 11 }, color: "#94a3b8", callback: (v: any) => `${v}%` },
      },
    },
  };

  const PRESETS: { key: Preset; label: string }[] = [
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "90d", label: "90 dias" },
    { key: "all", label: "Tudo" },
    { key: "custom", label: "Personalizado" },
  ];

  const periodoLabel = preset === "all"
    ? "Todo o período"
    : preset === "custom"
    ? (customFrom && customTo ? `${customFrom.split("-").reverse().join("/")} – ${customTo.split("-").reverse().join("/")}` : "Período personalizado")
    : `Últimos ${preset === "7d" ? "7" : preset === "30d" ? "30" : "90"} dias`;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-500" />
            Analytics do E-book
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Guia do Síndico Seguro — monitoramento em tempo real
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/ebook-segcomp"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 border border-teal-200 rounded-lg px-3 py-2 bg-teal-50 hover:bg-teal-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir E-book
          </a>
          <button
            onClick={handleExportCsv}
            disabled={exportando}
            className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-800 border border-green-200 rounded-lg px-3 py-2 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {exportando ? "Exportando..." : "Exportar CSV"}
          </button>
          <button
            onClick={() => refetch()}
            className="text-sm text-muted-foreground border rounded-lg px-3 py-2 hover:bg-muted transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Filtro de período */}
      <Card className="border-indigo-100 bg-indigo-50/40">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
              <Calendar className="w-4 h-4" />
              Período:
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {PRESETS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    preset === p.key
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset === "custom" && (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white text-foreground"
                />
                <span className="text-sm text-muted-foreground">até</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white text-foreground"
                />
              </div>
            )}
            <span className="text-xs text-indigo-600 font-medium ml-auto">
              {periodoLabel}
            </span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 animate-pulse" />
            <p className="text-muted-foreground text-sm">Carregando...</p>
          </div>
        </div>
      ) : !stats ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Nenhum dado disponível.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={<Eye className="w-5 h-5 text-blue-500" />} label="Total de Aberturas" value={stats.total.toString()} sub="sessões únicas" color="blue" />
            <KpiCard icon={<TrendingUp className="w-5 h-5 text-teal-500" />} label="Média de Leitura" value={`${stats.mediaPercentual}%`} sub={`≈ pág. ${Math.round((stats.mediaPercentual / 100) * TOTAL_PAGES)}`} color="teal" />
            <KpiCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} label="Concluíram" value={stats.concluiram.toString()} sub={`${stats.taxaConclusao}% de conclusão`} color="green" />
            <KpiCard icon={<Clock className="w-5 h-5 text-orange-500" />} label="Tempo Médio" value={formatTempo(stats.mediaTempo)} sub="por sessão" color="orange" />
          </div>

          {/* Gráfico de retenção */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    Taxa de Retenção por Página
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    % de leitores que chegaram até cada página — {periodoLabel.toLowerCase()}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-teal-500" />Alta (&gt;60%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-yellow-500" />Média (30–60%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-red-500" />Crítico (&lt;30%)</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stats.total === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  Nenhuma sessão no período selecionado.
                </div>
              ) : (
                <div style={{ height: 280 }}>
                  <Bar data={retencaoChartData as any} options={chartOptions as any} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Abandono + Top 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Abandono Entre Páginas
                </CardTitle>
                <p className="text-xs text-muted-foreground">Queda percentual de leitores de uma página para a próxima</p>
              </CardHeader>
              <CardContent>
                {stats.total === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Nenhuma sessão no período.</div>
                ) : (
                  <div style={{ height: 220 }}>
                    <Bar data={quedaChartData} options={quedaOptions as any} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Pontos Críticos
                </CardTitle>
                <p className="text-xs text-muted-foreground">Páginas com maior taxa de abandono</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.total === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">Sem dados no período.</p>
                ) : (
                  top3Abandono.map((item, idx) => (
                    <div key={item.pagina} className={`p-3 rounded-lg border ${idx === 0 ? "bg-red-50 border-red-200" : idx === 1 ? "bg-orange-50 border-orange-200" : "bg-yellow-50 border-yellow-200"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-muted-foreground">#{idx + 1} — Pág. {item.pagina}</span>
                        <Badge variant="secondary" className={`text-xs border-0 ${idx === 0 ? "bg-red-100 text-red-700" : idx === 1 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>
                          -{item.queda}%
                        </Badge>
                      </div>
                      <p className="text-sm font-medium leading-tight">{item.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.queda > 0 ? `${item.queda}% pararam aqui` : "Sem abandono"}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* CTAs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Engajamento com CTAs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-pink-50 border border-pink-100">
                  <div className="flex items-center gap-3">
                    <Instagram className="w-6 h-6 text-pink-500" />
                    <div>
                      <p className="font-semibold text-sm">Clicou no Instagram</p>
                      <p className="text-xs text-muted-foreground">@segcompbr</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-pink-600">{stats.clicouInstagram}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.total > 0 ? Math.round((stats.clicouInstagram / stats.total) * 100) : 0}% do total
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-teal-50 border border-teal-100">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-teal-500" />
                    <div>
                      <p className="font-semibold text-sm">Clicou em "Entre em Contato"</p>
                      <p className="text-xs text-muted-foreground">Formulário de leads</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-teal-600">{stats.clicouFormulario}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.total > 0 ? Math.round((stats.clicouFormulario / stats.total) * 100) : 0}% do total
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de sessões */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Sessões Recentes
                {stats.total > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({Math.min(stats.sessoes.length, 100)} de {stats.total})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.sessoes.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhuma sessão no período selecionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Data/Hora</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">Pág. Máx.</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">% Lido</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">Tempo</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">Instagram</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">Formulário</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">Concluiu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.sessoes.map((s) => (
                        <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-3 text-xs text-muted-foreground">{formatDate(s.createdAt)}</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{s.paginaMaxima}</span>
                              <span className="text-xs text-muted-foreground leading-tight max-w-20 text-center truncate">{PAGE_TITLES[s.paginaMaxima]}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${s.percentualLido}%`,
                                    background: s.percentualLido >= 80 ? "#10b981" : s.percentualLido >= 50 ? "#14b8a6" : s.percentualLido >= 30 ? "#f59e0b" : "#f97316",
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium">{s.percentualLido}%</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center text-xs">{formatTempo(s.tempoLeituraSegundos || 0)}</td>
                          <td className="py-2 px-3 text-center">
                            {s.clicouInstagram ? <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700 border-0">Sim</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {s.clicouFormulario ? <Badge variant="secondary" className="text-xs bg-teal-100 text-teal-700 border-0">Sim</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {s.concluiu ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  color: "blue" | "teal" | "green" | "orange";
}) {
  const colorMap = {
    blue: "bg-blue-50 border-blue-100",
    teal: "bg-teal-50 border-teal-100",
    green: "bg-green-50 border-green-100",
    orange: "bg-orange-50 border-orange-100",
  };
  return (
    <Card className={`border ${colorMap[color]}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className="mt-1">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
