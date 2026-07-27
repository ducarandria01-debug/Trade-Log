"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Trade = {
  id: number;
  date: string;
  asset: string;
  market: string;
  direction: "Long" | "Short";
  entry: number;
  exit: number;
  size: number;
  pnl: number;
  rr: number;
  setup: string;
  emotion: string;
  notes: string;
};

const seedTrades: Trade[] = [
  { id: 1, date: "2026-07-25", asset: "XAU/USD", market: "Forex", direction: "Long", entry: 3331.4, exit: 3342.6, size: 0.5, pnl: 560, rr: 2.8, setup: "Breakout + retest", emotion: "Confiant", notes: "Entrée propre après confirmation M15." },
  { id: 2, date: "2026-07-24", asset: "NAS100", market: "Indices", direction: "Short", entry: 23210, exit: 23155, size: 1, pnl: 275, rr: 1.9, setup: "Rejet de zone", emotion: "Calme", notes: "Respect du plan et sortie au premier objectif." },
  { id: 3, date: "2026-07-23", asset: "EUR/USD", market: "Forex", direction: "Long", entry: 1.1724, exit: 1.1698, size: 1, pnl: -260, rr: -1, setup: "Support H1", emotion: "Impatient", notes: "Entrée trop tôt, sans attendre la clôture." },
  { id: 4, date: "2026-07-22", asset: "BTC/USD", market: "Crypto", direction: "Long", entry: 117400, exit: 119050, size: 0.15, pnl: 247.5, rr: 2.1, setup: "Range breakout", emotion: "Concentré", notes: "Bonne gestion du stop sous le range." },
  { id: 5, date: "2026-07-21", asset: "US30", market: "Indices", direction: "Short", entry: 44410, exit: 44472, size: 1, pnl: -186, rr: -1, setup: "Double top", emotion: "FOMO", notes: "Trade pris après avoir raté le premier mouvement." },
  { id: 6, date: "2026-07-18", asset: "GBP/USD", market: "Forex", direction: "Short", entry: 1.3482, exit: 1.3421, size: 1, pnl: 610, rr: 3.2, setup: "Structure break", emotion: "Calme", notes: "Alignement H4/H1, exécution parfaite." },
  { id: 7, date: "2026-07-17", asset: "ETH/USD", market: "Crypto", direction: "Long", entry: 3610, exit: 3668, size: 2, pnl: 116, rr: 1.4, setup: "Pullback EMA", emotion: "Neutre", notes: "Position réduite avant news." },
  { id: 8, date: "2026-07-16", asset: "XAU/USD", market: "Forex", direction: "Short", entry: 3360.8, exit: 3350.2, size: 0.4, pnl: 424, rr: 2.4, setup: "Liquidity sweep", emotion: "Confiant", notes: "Sweep Londres puis cassure de structure." },
];

const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const icons: Record<string, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  journal: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h6"/></>,
  chart: <><path d="M3 3v18h18"/><path d="m7 15 4-4 4 3 5-7"/></>,
  notes: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.17A1.65 1.65 0 0 0 9 19.32a1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3v-4h.17A1.65 1.65 0 0 0 4.68 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3h4v.17a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.32 9c.12.6.59 1.08 1.18 1.2h.17v4h-.17A1.65 1.65 0 0 0 19.4 15Z"/></>,
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{icons[name]}</svg>;
}

function Sparkline({ values, positive = true }: { values: number[]; positive?: boolean }) {
  const width = 104, height = 40;
  const min = Math.min(...values), max = Math.max(...values);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / Math.max(max - min, 1)) * (height - 5)}`).join(" ");
  return <svg className="sparkline" viewBox={`0 0 ${width} ${height}`}><polyline points={points} fill="none" stroke={positive ? "#00d6a3" : "#ff6b7a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function EquityChart({ trades }: { trades: Trade[] }) {
  const values = useMemo(() => {
    let total = 24500;
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    return [total, ...sorted.map(t => total += t.pnl)];
  }, [trades]);
  const min = Math.min(...values) - 200, max = Math.max(...values) + 200;
  const coords = values.map((v, i) => {
    const x = 16 + (i / Math.max(values.length - 1, 1)) * 668;
    const y = 185 - ((v - min) / Math.max(max - min, 1)) * 150;
    return [x, y];
  });
  const line = coords.map(c => c.join(",")).join(" ");
  const area = `M ${coords[0][0]} 202 L ${coords.map(c => c.join(" ")).join(" L ")} L ${coords.at(-1)?.[0]} 202 Z`;
  return (
    <div className="chart-wrap">
      <svg viewBox="0 0 700 215" preserveAspectRatio="none" aria-label="Courbe du capital">
        {[35, 85, 135, 185].map(y => <line key={y} x1="16" x2="684" y1={y} y2={y} className="grid-line"/>)}
        <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#00d6a3" stopOpacity=".3"/><stop offset="1" stopColor="#00d6a3" stopOpacity="0"/></linearGradient></defs>
        <path d={area} fill="url(#area)"/>
        <polyline points={line} fill="none" stroke="#00d6a3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        {coords.map((c, i) => i === coords.length - 1 && <circle key={i} cx={c[0]} cy={c[1]} r="5" fill="#00d6a3" stroke="#10251f" strokeWidth="4"/>)}
      </svg>
      <div className="chart-labels"><span>16 Juil.</span><span>19 Juil.</span><span>22 Juil.</span><span>25 Juil.</span></div>
    </div>
  );
}

export default function TradingJournal() {
  const [trades, setTrades] = useState<Trade[]>(seedTrades);
  const [active, setActive] = useState("dashboard");
  const [modal, setModal] = useState(false);
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("Tous");
  const [toast, setToast] = useState("");
  const [notes, setNotes] = useState("Objectif de la semaine : rester patient, attendre la confirmation et limiter le risque à 1 % par position.");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("apex-trades");
    const savedNotes = localStorage.getItem("apex-notes");
    if (saved) {
      try { setTrades(JSON.parse(saved)); } catch { /* keep demo data */ }
    }
    if (savedNotes) setNotes(savedNotes);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("apex-trades", JSON.stringify(trades));
  }, [trades, hydrated]);

  const stats = useMemo(() => {
    const pnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
    const profitFactor = Math.abs(wins.reduce((s, t) => s + t.pnl, 0) / (losses.reduce((s, t) => s + t.pnl, 0) || 1));
    const avgR = trades.length ? trades.reduce((s, t) => s + t.rr, 0) / trades.length : 0;
    return { pnl, wins: wins.length, losses: losses.length, winRate, profitFactor, avgR };
  }, [trades]);

  const filtered = useMemo(() => trades.filter(t => {
    const matchesText = `${t.asset} ${t.setup}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (marketFilter === "Tous" || t.market === marketFilter);
  }).sort((a, b) => b.date.localeCompare(a.date)), [trades, query, marketFilter]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function addTrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const entry = Number(data.get("entry")), exit = Number(data.get("exit")), size = Number(data.get("size"));
    const direction = data.get("direction") as "Long" | "Short";
    const multiplier = direction === "Long" ? 1 : -1;
    const rawPnl = (exit - entry) * size * multiplier;
    const pnl = Number(data.get("pnl")) || Number(rawPnl.toFixed(2));
    const next: Trade = {
      id: Date.now(),
      date: String(data.get("date")),
      asset: String(data.get("asset")).toUpperCase(),
      market: String(data.get("market")),
      direction,
      entry, exit, size, pnl,
      rr: Number(data.get("rr")),
      setup: String(data.get("setup")),
      emotion: String(data.get("emotion")),
      notes: String(data.get("notes")),
    };
    setTrades(prev => [next, ...prev]);
    setModal(false);
    notify("Trade ajouté au journal");
  }

  function exportCsv() {
    const headers = ["Date","Actif","Marché","Direction","Entrée","Sortie","Taille","P&L","R:R","Setup","Émotion","Notes"];
    const rows = trades.map(t => [t.date,t.asset,t.market,t.direction,t.entry,t.exit,t.size,t.pnl,t.rr,t.setup,t.emotion,t.notes]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "journal-trading.csv"; a.click();
    URL.revokeObjectURL(url);
    notify("Journal exporté en CSV");
  }

  const pageTitle: Record<string, [string, string]> = {
    dashboard: ["Tableau de bord", "Voici un aperçu de tes performances."],
    journal: ["Journal des trades", "Analyse chaque exécution et retrouve tes erreurs récurrentes."],
    analytics: ["Analyses", "Les chiffres qui racontent ta façon de trader."],
    notes: ["Plan & notes", "Prépare tes sessions et garde ton processus au premier plan."],
    settings: ["Paramètres", "Gère et exporte les données de ton journal."],
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><span></span><span></span><span></span></div>
          <div><strong>APEX</strong><small>TRADING JOURNAL</small></div>
        </div>
        <nav>
          <p>ESPACE DE TRAVAIL</p>
          {[
            ["dashboard","dashboard","Tableau de bord"],
            ["journal","journal","Journal des trades"],
            ["analytics","chart","Analyses"],
            ["notes","notes","Plan & notes"],
          ].map(([id, icon, label]) => (
            <button className={active === id ? "active" : ""} key={id} onClick={() => setActive(id)}>
              <Icon name={icon}/><span>{label}</span>{id === "journal" && <em>{trades.length}</em>}
            </button>
          ))}
          <p className="nav-section">COMPTE</p>
          <button className={active === "settings" ? "active" : ""} onClick={() => setActive("settings")}><Icon name="settings"/><span>Paramètres</span></button>
        </nav>
        <div className="discipline-card">
          <div className="discipline-head"><span>Discipline</span><strong>82%</strong></div>
          <div className="progress"><i/></div>
          <small>Excellent rythme. Reste fidèle à ton plan.</small>
        </div>
        <div className="profile">
          <div className="avatar">DT</div>
          <div><strong>Day Trader</strong><span>Compte personnel</span></div>
          <button aria-label="Menu">•••</button>
        </div>
      </aside>

      <section className="content">
        <header>
          <button className="mobile-brand" onClick={() => setActive("dashboard")} aria-label="Accueil"><span></span><span></span><span></span></button>
          <div><h1>{pageTitle[active][0]}</h1><p>{pageTitle[active][1]}</p></div>
          <div className="header-actions">
            <button className="icon-btn" aria-label="Notifications">♢<i/></button>
            <button className="primary-btn" onClick={() => setModal(true)}><span>＋</span>Nouveau trade</button>
          </div>
        </header>

        {active === "dashboard" && (
          <>
            <section className="kpi-grid">
              <article className="kpi">
                <div className="kpi-top"><span>P&L NET</span><span className="badge up">↗ 12.4%</span></div>
                <div className="kpi-value">{money.format(stats.pnl)}</div>
                <div className="kpi-foot"><small>Sur la période</small><Sparkline values={[10,14,12,19,17,24,31,28,39]} /></div>
              </article>
              <article className="kpi">
                <div className="kpi-top"><span>TAUX DE RÉUSSITE</span><span className="badge up">↗ 4.2%</span></div>
                <div className="kpi-value">{stats.winRate.toFixed(1)}%</div>
                <div className="kpi-foot"><small>{stats.wins} gagnants · {stats.losses} perdants</small><Sparkline values={[25,32,29,36,44,41,52,58,63]} /></div>
              </article>
              <article className="kpi">
                <div className="kpi-top"><span>PROFIT FACTOR</span><span className="badge neutral">Bon</span></div>
                <div className="kpi-value">{stats.profitFactor.toFixed(2)}</div>
                <div className="kpi-foot"><small>Objectif supérieur à 1.50</small><Sparkline values={[18,21,19,26,25,30,33,31,36]} /></div>
              </article>
              <article className="kpi">
                <div className="kpi-top"><span>R MOYEN</span><span className="badge up">↗ 0.3R</span></div>
                <div className="kpi-value">{stats.avgR.toFixed(2)}R</div>
                <div className="kpi-foot"><small>Rendement par trade</small><Sparkline values={[12,15,11,20,18,25,23,30,34]} /></div>
              </article>
            </section>

            <section className="main-grid">
              <article className="panel equity-panel">
                <div className="panel-head">
                  <div><h2>Courbe du capital</h2><p>Évolution du solde cumulé</p></div>
                  <div className="range-tabs"><button>7J</button><button className="selected">1M</button><button>3M</button><button>1A</button></div>
                </div>
                <div className="equity-summary"><strong>{money.format(24500 + stats.pnl)}</strong><span>+{money.format(stats.pnl)} ce mois</span></div>
                <EquityChart trades={trades}/>
              </article>
              <article className="panel win-panel">
                <div className="panel-head"><div><h2>Répartition</h2><p>Gains vs pertes</p></div><button className="dots">•••</button></div>
                <div className="donut" style={{ background: `conic-gradient(#00d6a3 0 ${stats.winRate}%, #ff6577 ${stats.winRate}% 100%)` }}>
                  <div><strong>{stats.winRate.toFixed(0)}%</strong><span>WIN RATE</span></div>
                </div>
                <div className="legend">
                  <div><i className="green"/><span>Trades gagnants</span><strong>{stats.wins}</strong></div>
                  <div><i className="red"/><span>Trades perdants</span><strong>{stats.losses}</strong></div>
                </div>
              </article>
            </section>

            <section className="panel recent-panel">
              <div className="panel-head"><div><h2>Trades récents</h2><p>Les dernières opérations enregistrées</p></div><button className="text-btn" onClick={() => setActive("journal")}>Voir tout →</button></div>
              <TradeTable trades={filtered.slice(0,5)} onDelete={id => { setTrades(t => t.filter(x => x.id !== id)); notify("Trade supprimé"); }}/>
            </section>
          </>
        )}

        {active === "journal" && (
          <section className="panel full-panel">
            <div className="toolbar">
              <label className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un actif ou setup…"/></label>
              <div className="filter-tabs">{["Tous","Forex","Indices","Crypto"].map(m => <button key={m} className={marketFilter === m ? "selected" : ""} onClick={() => setMarketFilter(m)}>{m}</button>)}</div>
              <button className="outline-btn" onClick={exportCsv}>↓ Exporter</button>
            </div>
            <div className="journal-summary">
              <div><span>Trades affichés</span><strong>{filtered.length}</strong></div>
              <div><span>P&L filtré</span><strong className={filtered.reduce((s,t)=>s+t.pnl,0) >= 0 ? "profit" : "loss"}>{money.format(filtered.reduce((s,t)=>s+t.pnl,0))}</strong></div>
              <div><span>Meilleur trade</span><strong className="profit">{money.format(Math.max(...filtered.map(t=>t.pnl),0))}</strong></div>
            </div>
            <TradeTable trades={filtered} detailed onDelete={id => { setTrades(t => t.filter(x => x.id !== id)); notify("Trade supprimé"); }}/>
          </section>
        )}

        {active === "analytics" && (
          <section className="analytics-grid">
            <article className="panel analytics-wide">
              <div className="panel-head"><div><h2>Performance par jour</h2><p>P&L cumulé selon le jour de la semaine</p></div><span className="badge neutral">30 derniers jours</span></div>
              <div className="bars">
                {[["Lun",64,510],["Mar",88,720],["Mer",42,280],["Jeu",76,610],["Ven",35,190]].map(([day,h,val]) => (
                  <div className="bar-col" key={day}><strong>{money.format(Number(val))}</strong><div className="bar-track"><i style={{height:`${h}%`}}/></div><span>{day}</span></div>
                ))}
              </div>
            </article>
            <article className="panel insight-card">
              <span className="insight-icon">✦</span>
              <p>APERÇU DE LA SEMAINE</p>
              <h2>Ton meilleur setup est « Breakout »</h2>
              <div className="insight-stat"><strong>72%</strong><span>de réussite sur 11 exécutions</span></div>
              <small>Évite les entrées motivées par le FOMO : elles représentent la majorité de tes pertes.</small>
            </article>
            <article className="panel analytics-wide setup-panel">
              <div className="panel-head"><div><h2>Performance par setup</h2><p>Identifie ton avantage statistique</p></div></div>
              {[
                ["Breakout + retest",72,1260,"8 trades"],
                ["Structure break",64,880,"6 trades"],
                ["Liquidity sweep",58,610,"5 trades"],
                ["Rejet de zone",41,-120,"7 trades"],
              ].map(([name,rate,pnl,count]) => (
                <div className="setup-row" key={name}><div><strong>{name}</strong><span>{count}</span></div><div className="mini-progress"><i style={{width:`${rate}%`}}/></div><strong>{rate}%</strong><span className={Number(pnl)>0 ? "profit" : "loss"}>{money.format(Number(pnl))}</span></div>
              ))}
            </article>
          </section>
        )}

        {active === "notes" && (
          <section className="notes-grid">
            <article className="panel checklist">
              <div className="panel-head"><div><h2>Checklist avant session</h2><p>Une exécution propre commence avant le trade.</p></div></div>
              {["Ai-je identifié le biais HTF ?","Le setup respecte-t-il mon plan ?","Le ratio gain/risque est-il ≥ 2 ?","Le risque est-il limité à 1 % ?","Suis-je calme et concentré ?"].map((item, i) => (
                <label key={item}><input type="checkbox" defaultChecked={i < 3}/><span>{item}</span></label>
              ))}
            </article>
            <article className="panel daily-note">
              <div className="panel-head"><div><h2>Note du jour</h2><p>Dimanche 27 juillet</p></div><span className="status-dot">Autosauvegarde</span></div>
              <textarea value={notes} onChange={e => { setNotes(e.target.value); localStorage.setItem("apex-notes", e.target.value); }} placeholder="Écris ton plan, tes observations ou ton bilan…"/>
              <div className="note-footer"><span>{notes.length} caractères</span><button className="primary-btn" onClick={() => notify("Note sauvegardée")}>Sauvegarder</button></div>
            </article>
            <article className="panel rules-card">
              <span>MES RÈGLES NON NÉGOCIABLES</span>
              <ol><li>Maximum 3 trades par jour</li><li>Stop loss défini avant l’entrée</li><li>Pas de revenge trading</li><li>Arrêt après −2R dans la journée</li></ol>
            </article>
          </section>
        )}

        {active === "settings" && (
          <section className="settings-grid">
            <article className="panel settings-card">
              <h2>Données du journal</h2><p>Tes données sont enregistrées localement dans ce navigateur.</p>
              <div className="settings-actions"><button className="outline-btn" onClick={exportCsv}>↓ Exporter en CSV</button><button className="danger-btn" onClick={() => { if (confirm("Réinitialiser toutes les données de démonstration ?")) { setTrades(seedTrades); notify("Données réinitialisées"); } }}>Réinitialiser les données</button></div>
            </article>
            <article className="panel settings-card">
              <h2>Préférences</h2>
              <div className="setting-row"><div><strong>Devise principale</strong><span>Utilisée pour tous les résultats</span></div><select defaultValue="USD"><option>USD — Dollar américain</option><option>EUR — Euro</option><option>MGA — Ariary</option></select></div>
              <div className="setting-row"><div><strong>Thème sombre</strong><span>Réduit la fatigue visuelle</span></div><div className="toggle on"><i/></div></div>
            </article>
          </section>
        )}

        <nav className="mobile-nav">
          {[["dashboard","dashboard"],["journal","journal"],["analytics","chart"],["notes","notes"],["settings","settings"]].map(([id, icon]) => <button key={id} className={active===id?"active":""} onClick={() => setActive(id)}><Icon name={icon}/></button>)}
        </nav>
      </section>

      {modal && <TradeModal onClose={() => setModal(false)} onSubmit={addTrade}/>}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}

function TradeTable({ trades, detailed = false, onDelete }: { trades: Trade[]; detailed?: boolean; onDelete: (id:number) => void }) {
  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th>DATE</th><th>ACTIF</th><th>DIRECTION</th><th>SETUP</th>{detailed && <th>ÉMOTION</th>}<th>R:R</th><th>P&L</th><th></th></tr></thead>
        <tbody>
          {trades.map(t => (
            <tr key={t.id}>
              <td><span className="date-cell">{new Date(`${t.date}T12:00:00`).toLocaleDateString("fr-FR", {day:"2-digit",month:"short"})}</span></td>
              <td><div className="asset-cell"><span className={`asset-icon ${t.market.toLowerCase()}`}>{t.asset.slice(0,1)}</span><div><strong>{t.asset}</strong><small>{t.market}</small></div></div></td>
              <td><span className={`direction ${t.direction.toLowerCase()}`}>{t.direction === "Long" ? "↗" : "↘"} {t.direction}</span></td>
              <td><span className="setup-tag">{t.setup}</span></td>
              {detailed && <td><span className="emotion">{t.emotion}</span></td>}
              <td><strong className={t.rr > 0 ? "profit" : "loss"}>{t.rr > 0 ? "+" : ""}{t.rr.toFixed(1)}R</strong></td>
              <td><strong className={t.pnl > 0 ? "profit" : "loss"}>{t.pnl > 0 ? "+" : ""}{money.format(t.pnl)}</strong></td>
              <td><button className="row-menu" onClick={() => onDelete(t.id)} title="Supprimer">×</button></td>
            </tr>
          ))}
          {!trades.length && <tr><td colSpan={detailed ? 8 : 7} className="empty">Aucun trade ne correspond à ces filtres.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function TradeModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={onSubmit}>
        <div className="modal-head"><div><span>NOUVELLE EXÉCUTION</span><h2>Ajouter un trade</h2></div><button type="button" onClick={onClose}>×</button></div>
        <div className="form-grid">
          <label>Date<input name="date" type="date" defaultValue="2026-07-27" required/></label>
          <label>Actif<input name="asset" placeholder="Ex. XAU/USD" required/></label>
          <label>Marché<select name="market"><option>Forex</option><option>Indices</option><option>Crypto</option><option>Actions</option></select></label>
          <label>Direction<select name="direction"><option>Long</option><option>Short</option></select></label>
          <label>Prix d’entrée<input name="entry" type="number" step="any" placeholder="0.00" required/></label>
          <label>Prix de sortie<input name="exit" type="number" step="any" placeholder="0.00" required/></label>
          <label>Taille de position<input name="size" type="number" step="any" defaultValue="1" required/></label>
          <label>P&L réalisé ($)<input name="pnl" type="number" step="any" placeholder="Calcul auto si vide"/></label>
          <label>Résultat en R<input name="rr" type="number" step=".1" placeholder="Ex. 2.5" required/></label>
          <label>Émotion<select name="emotion"><option>Calme</option><option>Confiant</option><option>Concentré</option><option>Neutre</option><option>Impatient</option><option>FOMO</option></select></label>
          <label className="full">Setup<input name="setup" placeholder="Ex. Breakout + retest" required/></label>
          <label className="full">Notes<textarea name="notes" placeholder="Pourquoi as-tu pris ce trade ? Qu’as-tu bien ou mal exécuté ?"/></label>
        </div>
        <div className="modal-actions"><button type="button" className="outline-btn" onClick={onClose}>Annuler</button><button className="primary-btn" type="submit">Ajouter au journal</button></div>
      </form>
    </div>
  );
}
