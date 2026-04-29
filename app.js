// ════════════════════════════════════════════
//  app.js  —  Orchestration
//   Drives Backend.tick() and B's render pipeline at fixed cadence.
// ════════════════════════════════════════════

function fmtPctSign(v, dp=1) { return (v >= 0 ? '+' : '') + v.toFixed(dp) + '%'; }

function masterTick() {
  Backend.tick();
  Trader.tick();
  DataB.tickCount++;
  mockDrift();

  // ── Sync Trader → DataB (backward-compat for existing render fns) ──
  DataB.livePositions               = Trader.positions;
  DataB.mock.portfolio.open         = Trader.positions.length;
  DataB.mock.account.balance        = Math.round(Trader.balance);
  DataB.mock.account.dd             = Trader.drawdown;
  DataB.mock.account.stake          = Math.round(Math.min(Trader.balance * Trader.STAKE_PCT, Trader.STAKE_CAP));
  DataB.mock.account.notional       = Math.round(Trader.positions.reduce((s,p) => s + p.mark * p.size, 0));
  DataB.mock.account.maxLoss        = Math.round(DataB.mock.account.stake * 0.025);
  const b = DataB.mock.bots, tb = Trader.bots;
  b.v3.hb   = tb.v3.hb;   b.v3.tradesToday   = tb.v3.tradesToday;   b.v3.pnlToday = tb.v3.pnlToday;
  b.test.hb = tb.test.hb; b.test.decisionsToday = tb.test.decisionsToday; b.test.rejectsToday = tb.test.rejectsToday;
  b.nfi.hb  = tb.nfi.hb;  b.nfi.tradesToday  = tb.nfi.tradesToday;  b.nfi.pnlToday  = tb.nfi.pnlToday;
  DataB.pnl.v3.pts   = Trader.equityCurve;
  DataB.pnl.test.pts = Trader.bots.test.equityCurve;
  DataB.pnl.nfi.pts  = Trader.bots.nfi.equityCurve;
  // BTC HODL 基准 (合成漂移,稍后可接 OKX 历史)
  const lastBtc = DataB.pnl.btc.pts.length ? DataB.pnl.btc.pts[DataB.pnl.btc.pts.length-1] : 10000;
  DataB.pnl.btc.pts.push(lastBtc + (Math.random() - 0.47) * 12);
  if (DataB.pnl.btc.pts.length > 500) DataB.pnl.btc.pts.shift();

  // HALTED MODE: Trader 仍在 _driftMarks, 但 B 只渲染 halted view
  if (Trader.halted) {
    renderHalted();
    return;
  }

  // PnL 主数字 = Trader 余额
  Backend.totalPnL = Math.round(Trader.balance);
  document.getElementById('pnlNum').textContent = '$' + Math.round(Trader.balance).toLocaleString();
  const pnlFromEl = document.getElementById('pnlFrom');
  if (pnlFromEl) {
    const pct = ((Trader.balance / Trader.INITIAL_CAPITAL - 1) * 100).toFixed(1);
    pnlFromEl.textContent = `from $${Trader.INITIAL_CAPITAL.toLocaleString()} · ROI ${pct}%`;
  }
  drawPnL();

  renderBtcRegime();
  renderFilterDecision();
  renderPositionSizing();
  renderFactors();
  renderSignals();
  renderBots();
  renderOpenPositions();
  renderTradeHistory();
  updateApiPanel();
  buildTicker();

  // Block number
  const bn = document.getElementById('blockNum');
  bn.textContent = (parseInt(bn.textContent.replace(/,/g,'')) + 1).toLocaleString();

  // Random log events — PumpHunter / freqtrade themed
  if (Math.random() < 0.4) {
    const tags = ['TRIG','FILTER','OPEN','CLOSE','REJECT','HEARTBEAT','BTC','FUNDING'];
    const coins = ['WIF','PEPE','BONK','DOGE','SHIB','FLOKI'];
    const coin  = () => coins[Math.random()*coins.length|0];
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    const vals = [
      coin() + ' vol×' + (2+Math.random()*3).toFixed(1),
      coin() + ' brkout ' + (1+Math.random()*3).toFixed(1) + '%',
      'btc regime ' + fmtPctSign(DataB.mock.btc.h24),
      'hb ok',
      'rejected ' + coin() + ' RSI>70',
      'funding anomaly ' + coin(),
      'opened ' + coin() + ' stake $' + DataB.mock.account.stake,
      'closed ' + coin() + ' pnl ' + (Math.random() < 0.55 ? '+' : '−') + '$' + (Math.random()*60).toFixed(0),
    ];
    DataB.logLines.push([ts, tags[Math.random()*tags.length|0], vals[Math.random()*vals.length|0]]);
    if (DataB.logLines.length > 40) DataB.logLines.shift();
    renderLog();
  }

  // Drawdown + circuit distance
  const dd = Trader.drawdown.toFixed(1);
  const ddEl = document.getElementById('ddVal');
  if (ddEl) { ddEl.textContent = dd + '%'; ddEl.className = parseFloat(dd) > 10 ? 'sr' : 'sg'; }
  const cdEl = document.getElementById('cdVal');
  if (cdEl) {
    const cd = Math.max(0, DataB.mock.account.ddMax - Trader.drawdown).toFixed(1);
    cdEl.textContent = cd + '%';
    cdEl.className = parseFloat(cd) > 5 ? 'sg' : 'sr';
  }
}

// ── 连接 Trader 事件到 A/B/C 三模块 ──
window.addEventListener('DOMContentLoaded', () => {
  Trader.on('halt',   () => { window.__c_haltAll?.();       window.__b_halt?.(); });
  Trader.on('resume', () => { window.__c_resumeTrading?.(); window.__b_resume?.(); });
  // 日志事件
  Trader.on('open', (t) => {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    DataB.logLines.push([ts, 'OPEN', `${t.sym} stake $${t.stake.toFixed(0)} @ ${t.entry < 0.001 ? t.entry.toExponential(2) : t.entry.toFixed(4)}`]);
    if (DataB.logLines.length > 40) DataB.logLines.shift();
  });
  Trader.on('close', (t) => {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    const sign = t.wasProfit ? '+' : '−';
    DataB.logLines.push([ts, 'CLOSE', `${t.sym} pnl ${sign}$${Math.abs(t.realizedPnl).toFixed(2)}`]);
    if (DataB.logLines.length > 40) DataB.logLines.shift();
  });
});

window.addEventListener('DOMContentLoaded', () => {
  tickPositions();
  renderBtcRegime();
  renderFilterDecision();
  renderPositionSizing();
  initPnL();
  drawPnL();
  renderBots();
  renderOpenPositions();
  renderTradeHistory();
  renderLog();
  renderFactors();
  renderSignals();
  buildTicker();
  updateApiPanel();

  setInterval(masterTick, 1600);
});
