// ════════════════════════════════════════════
//  B  —  市场实时数据区 (Market Real-Time Data)
//   Data sources:
//     - Backend.*   : OKX live (btcPrice, spread, latency)
//     - DataB.mock  : PumpHunter/freqtrade 占位数据, 待后端暴露
// ════════════════════════════════════════════
const DataB = {
  logLines: [
    ['--:--:--','INIT','strategy engine starting'],
    ['--:--:--','OKX','WS stream connected'],
    ['--:--:--','FILTER','24h regime bucket loaded'],
    ['--:--:--','SCAN','watching BTC ETH SOL PEPE WIF'],
  ],
  tickCount: 0,

  // PnL: 4 条曲线 (v3 live / test with filter / NFI baseline / BTC buy-and-hold)
  pnl: {
    v3:   { pts: [], val: 74523 },
    test: { pts: [], val: 3100 },
    nfi:  { pts: [], val: 22000 },
    btc:  { pts: [], val: 14500 },
  },

  // PumpHunter 占位状态 (每 tick drift, 等对接后端后删)
  mock: {
    btc: { h1: 0.4, h24: -0.5, d7: 3.2, atr: 2.1, bucket: '[0, 5)', sizing: 0.50 },
    trigger: { volSpike: 3.8, breakout: 0.028, emaAlign: 0.85, rsi: 64 },
    portfolio: { open: 2, max: 3, exposure: 0.33, triggers24h: 47 },
    funding: [
      { sym: 'PEPE', rate: 0.018 },
      { sym: 'WIF',  rate: 0.012 },
      { sym: 'BONK', rate: -0.008 },
    ],
    filter: {
      time: '14:23:11', coin: 'WIF', decision: 'ALLOW',
      reason: 'regime OK, vol×3.8',
      accept24h: 18, reject24h: 29,
    },
    account: { balance: 24400, stake: 244, notional: 800, maxLoss: 24, dd: 3.4, ddMax: 15 },
    bots: {
      v3:   { running: true, hb: 2, tradesToday: 12, pnlToday: +340 },
      test: { running: true, hb: 3, decisionsToday: 89, rejectsToday: 71 },
      nfi:  { running: true, hb: 1, tradesToday: 23, pnlToday: +120 },
    },
    triggers: [
      { time: '14:23:11', sym: 'WIF',  act: 'OPEN',   reason: 'vol×3.8, brkout 2.8%' },
      { time: '14:19:47', sym: 'PEPE', act: 'REJECT', reason: 'RSI=78 > 70' },
      { time: '14:15:02', sym: 'BONK', act: 'OPEN',   reason: 'vol×4.1, brkout 3.1%' },
      { time: '14:08:55', sym: 'DOGE', act: 'REJECT', reason: 'btc regime −3.2%' },
    ],
  },
};

function mockDrift() {
  const m = DataB.mock;
  m.btc.h1   += (Math.random()-0.5)*0.15;
  m.btc.h24  += (Math.random()-0.5)*0.08;
  m.btc.d7   += (Math.random()-0.5)*0.05;
  m.btc.atr   = Math.max(0.5, m.btc.atr + (Math.random()-0.5)*0.12);
  m.trigger.volSpike = Math.max(1,  m.trigger.volSpike + (Math.random()-0.5)*0.4);
  m.trigger.breakout = Math.max(0,  m.trigger.breakout + (Math.random()-0.5)*0.003);
  m.trigger.emaAlign = Math.max(0,  Math.min(1, m.trigger.emaAlign + (Math.random()-0.5)*0.03));
  m.trigger.rsi      = Math.max(25, Math.min(95, m.trigger.rsi + (Math.random()-0.5)*2));
  m.portfolio.exposure = Math.max(0, Math.min(1, m.portfolio.exposure + (Math.random()-0.5)*0.01));
  m.bots.v3.hb   = Math.floor(Math.random()*5);
  m.bots.test.hb = Math.floor(Math.random()*5);
  m.bots.nfi.hb  = Math.floor(Math.random()*5);
  m.account.dd   = Math.max(0, m.account.dd + (Math.random()-0.5)*0.3);
}

const fmtPct = (v, dp=2) => (v >= 0 ? '+' : '') + v.toFixed(dp) + '%';
const clsPn  = v => v >= 0 ? 'sg' : 'sr';

// ════════════════════════════════════════════
//  TOP ROW — BTC Regime · Last Filter · Position Sizing
// ════════════════════════════════════════════
function renderBtcRegime() {
  const m = DataB.mock.btc;
  document.getElementById('regimeBody').innerHTML = `
    <div class="kv"><span>BTC 1h</span><span class="${clsPn(m.h1)}">${fmtPct(m.h1)}</span></div>
    <div class="kv"><span>BTC 24h</span><span class="${clsPn(m.h24)}">${fmtPct(m.h24)}</span></div>
    <div class="kv"><span>BTC 7d</span><span class="${clsPn(m.d7)}">${fmtPct(m.d7)}</span></div>
    <div class="kv"><span>ATR%</span><span class="sv">${m.atr.toFixed(2)}%</span></div>
    <div class="kv"><span>Bucket</span><span class="sv">${m.bucket}</span></div>
    <div class="kv"><span>Filter sizing</span><span class="sg">${(m.sizing*100).toFixed(0)}%</span></div>
    <div class="kv"><span>Source</span><span class="sv">live · 2s</span></div>
  `;
}

function renderFilterDecision() {
  const f = DataB.mock.filter;
  const cls = f.decision === 'ALLOW' ? 'sg' : 'sr';
  document.getElementById('filterBody').innerHTML = `
    <div class="kv"><span>Time</span><span class="sv">${f.time}</span></div>
    <div class="kv"><span>Coin</span><span class="sv">${f.coin}</span></div>
    <div class="kv"><span>Decision</span><span class="${cls}">${f.decision}</span></div>
    <div class="kv"><span>Reason</span><span class="sv">${f.reason}</span></div>
    <div class="kv-sep"></div>
    <div class="kv"><span>24h allow</span><span class="sg">${f.accept24h}</span></div>
    <div class="kv"><span>24h reject</span><span class="sr">${f.reject24h}</span></div>
  `;
}

function renderPositionSizing() {
  const a = DataB.mock.account;
  const dist = Math.max(0, a.ddMax - a.dd).toFixed(2);
  const distCls = (a.ddMax - a.dd) > 5 ? 'sg' : 'sr';
  document.getElementById('sizingBody').innerHTML = `
    <div class="kv"><span>Balance</span><span class="sv">$${a.balance.toLocaleString()}</span></div>
    <div class="kv"><span>Stake</span><span class="sv">$${a.stake}</span></div>
    <div class="kv"><span>Notional</span><span class="sv">$${a.notional}</span></div>
    <div class="kv"><span>Theor. max loss</span><span class="sr">−$${a.maxLoss}</span></div>
    <div class="kv-sep"></div>
    <div class="kv"><span>Drawdown</span><span class="sv">${a.dd.toFixed(2)}%</span></div>
    <div class="kv"><span>Circuit dist</span><span class="${distCls}">${dist}%</span></div>
  `;
}

// ════════════════════════════════════════════
//  MID ROW — Factors (4 sections) · Signals (trigger log)
// ════════════════════════════════════════════
function barRow(name, val, suffix='', pct=null) {
  const p = pct == null ? Math.min(100, Math.abs(val)*50) : pct;
  const cls = val >= 0 ? 'factor-pos' : 'factor-neg';
  const sign = val >= 0 ? '+' : '';
  return `
    <div class="factor-row">
      <div class="factor-name">${name}</div>
      <div class="factor-bar-bg"><div class="factor-bar ${cls}" style="width:${p}%"></div></div>
      <div class="factor-val">${sign}${val.toFixed(2)}${suffix}</div>
    </div>`;
}

function renderFactors() {
  const m = DataB.mock;

  document.getElementById('triggerRows').innerHTML = [
    barRow('VOL SPIKE',     m.trigger.volSpike,    '×', Math.min(100, m.trigger.volSpike * 15)),
    barRow('BREAKOUT',      m.trigger.breakout*100, '%', Math.min(100, m.trigger.breakout*100*25)),
    barRow('EMA ALIGN',     m.trigger.emaAlign,    '',  m.trigger.emaAlign*100),
    barRow('RSI',           m.trigger.rsi,         '',  m.trigger.rsi),
  ].join('');

  document.getElementById('btcRegRows').innerHTML = [
    barRow('BTC 1h',  m.btc.h1,  '%'),
    barRow('BTC 24h', m.btc.h24, '%'),
    barRow('BTC 7d',  m.btc.d7,  '%'),
    barRow('BTC ATR', m.btc.atr, '%', m.btc.atr*20),
  ].join('');

  const p = m.portfolio;
  document.getElementById('portfolioRows').innerHTML = `
    <div class="factor-row"><div class="factor-name">OPEN / MAX</div>
      <div class="factor-bar-bg"><div class="factor-bar factor-pos" style="width:${p.open/p.max*100}%"></div></div>
      <div class="factor-val">${p.open}/${p.max}</div>
    </div>
    <div class="factor-row"><div class="factor-name">EXPOSURE</div>
      <div class="factor-bar-bg"><div class="factor-bar factor-pos" style="width:${p.exposure*100}%"></div></div>
      <div class="factor-val">${(p.exposure*100).toFixed(0)}%</div>
    </div>
    <div class="factor-row"><div class="factor-name">TRIGGERS 24h</div>
      <div class="factor-bar-bg"><div class="factor-bar factor-pos" style="width:${Math.min(100, p.triggers24h)}%"></div></div>
      <div class="factor-val">${p.triggers24h}</div>
    </div>`;

  document.getElementById('fundingRows').innerHTML = m.funding.map(f => {
    const w = Math.min(100, Math.abs(f.rate)*2000);
    const cls = f.rate >= 0 ? 'factor-pos' : 'factor-neg';
    const sign = f.rate >= 0 ? '+' : '';
    return `<div class="factor-row">
      <div class="factor-name">${f.sym}</div>
      <div class="factor-bar-bg"><div class="factor-bar ${cls}" style="width:${w}%"></div></div>
      <div class="factor-val">${sign}${(f.rate*100).toFixed(3)}%</div>
    </div>`;
  }).join('');
}

function renderSignals() {
  document.getElementById('signalRows').innerHTML = DataB.mock.triggers.map(t => {
    const cls = t.act === 'OPEN' ? 'sig-long' : t.act === 'REJECT' ? 'sig-short' : 'sig-hold';
    return `<div class="signal-item">
      <div class="signal-head">
        <span class="signal-time">${t.time}</span>
        <span class="signal-sym">${t.sym}</span>
        <span class="signal-badge ${cls}">${t.act}</span>
      </div>
      <div class="signal-reason">${t.reason}</div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════
//  BOT ROW — Log · PnL · Bots
// ════════════════════════════════════════════
function renderLog() {
  document.getElementById('logArea').innerHTML = DataB.logLines.slice(-10).map(([t, tag, v]) =>
    `<div class="log-line"><span class="lt">${t}</span> <span class="ltag">[${tag}]</span> <span class="lv">${v}</span></div>`
  ).join('');
}

function initPnL() {
  const seed = (vola, bias) => {
    let v = 0; const out = [];
    for (let i = 0; i < 200; i++) { v += Math.random()*vola - vola*bias; if (v < 0) v = 0; out.push(v); }
    return out;
  };
  DataB.pnl.v3.pts   = seed(2.5, 0.38);  // 最高增长
  DataB.pnl.nfi.pts  = seed(1.8, 0.42);
  DataB.pnl.test.pts = seed(1.2, 0.45);
  DataB.pnl.btc.pts  = seed(0.8, 0.48);  // 最慢基准
}

function drawPnL() {
  const c = document.getElementById('pnlC');
  const W = c.parentElement.clientWidth - 16;
  c.width = W * 2; c.height = 150;
  const ctx = c.getContext('2d');
  ctx.scale(2, 2);
  const cW = W, cH = 75;
  ctx.clearRect(0, 0, cW, cH);

  // 全局最大值 (四条共用纵轴)
  let mx = 1;
  ['v3','test','nfi','btc'].forEach(k => {
    for (const v of DataB.pnl[k].pts) if (v > mx) mx = v;
  });

  const series = [
    { key: 'btc',  col: '#444', dashed: true  },  // 基准画在最底层
    { key: 'nfi',  col: '#777', dashed: false },
    { key: 'test', col: '#aaa', dashed: false },
    { key: 'v3',   col: '#fff', dashed: false },  // 主策略最亮
  ];
  series.forEach(({ key, col, dashed }) => {
    const pts = DataB.pnl[key].pts.slice(-cW);
    ctx.setLineDash(dashed ? [2,2] : []);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = i, y = cH - (p / mx) * cH * 0.88;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = col; ctx.lineWidth = key === 'v3' ? 1.2 : 1; ctx.stroke();
  });
  ctx.setLineDash([]);
}

function renderTradeHistory() {
  const el = document.getElementById('tradeHistoryRows');
  if (!el) return;
  const trades = (window.Trader?.closedTrades || []).slice().reverse();
  if (trades.length === 0) {
    el.innerHTML = '<div class="op-empty">no closed trades</div>';
    return;
  }
  el.innerHTML = trades.slice(0, 12).map(t => {
    const d   = new Date(t.closeTs);
    const ts  = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    const cls  = t.wasProfit ? 'sg' : 'sr';
    const sign = t.wasProfit ? '+' : '−';
    return `<div class="rank-row">
      <span class="rk-sym">${ts}</span>
      <span class="rk-trades">${t.sym}</span>
      <span class="rk-pnl ${cls}">${sign}$${Math.abs(t.realizedPnl).toFixed(2)}</span>
    </div>`;
  }).join('');
}

function renderBots() {
  const b = DataB.mock.bots;
  const fmtPnl = v => (v >= 0 ? '+$' : '−$') + Math.abs(v);
  const block = (name, running, hb, extra) => `
    <div class="bot-block">
      <div class="bot-head">
        <span class="bot-name">${name}</span>
        <span class="${running ? 'sg' : 'sr'}">${running ? 'RUN' : 'DOWN'}</span>
      </div>
      <div class="bot-sub">hb ${hb}s · ${extra}</div>
    </div>`;
  document.getElementById('botRows').innerHTML =
    block('v3 live',  b.v3.running,   b.v3.hb,   `t/d ${b.v3.tradesToday} · pnl ${fmtPnl(b.v3.pnlToday)}`) +
    block('test',     b.test.running, b.test.hb, `dec ${b.test.decisionsToday} · rej ${b.test.rejectsToday}`) +
    block('nfi',      b.nfi.running,  b.nfi.hb,  `t/d ${b.nfi.tradesToday} · pnl ${fmtPnl(b.nfi.pnlToday)}`);
}

// ════════════════════════════════════════════
//  OPEN POSITIONS — live list, shared by normal + halted views
// ════════════════════════════════════════════
DataB.halted = false;
DataB.livePositions = [];

const _POS_COINS = ['WIF','PEPE','BONK','DOGE','SHIB','FLOKI'];
const _POS_BASE  = { WIF: 2.47, PEPE: 0.00000180, BONK: 0.0000312, DOGE: 0.412, SHIB: 0.0000241, FLOKI: 0.194 };

function tickPositions() {
  const arr = DataB.livePositions;
  const target = DataB.mock.portfolio.open;

  // Reconcile count
  while (arr.length < target) {
    const used = new Set(arr.map(p => p.sym));
    const pool = _POS_COINS.filter(c => !used.has(c));
    const sym  = pool[Math.floor(Math.random() * pool.length)] || _POS_COINS[Math.floor(Math.random() * _POS_COINS.length)];
    const entry = _POS_BASE[sym];
    const side  = Math.random() < 0.9 ? 'LONG' : 'SHORT';
    const stake = DataB.mock.account.stake * (0.8 + Math.random()*0.4);
    arr.push({ sym, side, size: stake / entry, entry, mark: entry, pnl: 0, pnlPct: 0 });
  }
  while (arr.length > target) arr.shift();

  // Drift marks → recompute PnL
  for (const p of arr) {
    p.mark *= (1 + (Math.random() - 0.5) * 0.008);
    p.pnl    = (p.mark - p.entry) * p.size * (p.side === 'LONG' ? 1 : -1);
    p.pnlPct = ((p.mark / p.entry) - 1) * 100 * (p.side === 'LONG' ? 1 : -1);
  }
}

function renderOpenPositions() {
  const el      = document.getElementById('openPosRows');
  const countEl = document.getElementById('pbCount');
  if (!el) return;
  const positions = DataB.livePositions || [];
  if (countEl) countEl.textContent = positions.length;

  if (positions.length === 0) {
    el.innerHTML = '<div class="op-empty">no open positions</div>';
    return;
  }

  const fmtP    = v => v < 1e-5 ? v.toExponential(2) : v < 1e-3 ? v.toFixed(7) : v < 1 ? v.toFixed(4) : v.toFixed(3);
  const fmtSize = v => v > 1e5 ? (v/1000).toFixed(0) + 'k' : v > 1000 ? v.toFixed(0) : v.toFixed(2);

  el.innerHTML = positions.map(p => {
    const cls     = p.pnl >= 0 ? 'sg' : 'sr';
    const sign    = p.pnl >= 0 ? '+' : '−';
    const pctSign = p.pnlPct >= 0 ? '+' : '−';
    return `<div class="big-pos-row" data-sym="${p.sym}" style="cursor:pointer">
      <div class="bpr-top">
        <span class="bpr-sym">${p.sym}</span>
        <span class="bpr-side">${p.side}</span>
        <span class="bpr-pnl ${cls}">${sign}$${Math.abs(p.pnl).toFixed(2)}</span>
      </div>
      <div class="bpr-sub">
        <span>size ${fmtSize(p.size)} <span class="bpr-at">@</span> ${fmtP(p.mark)}</span>
        <span class="${cls}">${pctSign}${Math.abs(p.pnlPct).toFixed(2)}%</span>
      </div>
    </div>`;
  }).join('');

  el.querySelectorAll('.big-pos-row').forEach(row => {
    row.addEventListener('click', () => {
      const sym = row.dataset.sym;
      const trade = (window.Trader?.positions || []).find(t => t.sym === sym);
      window.__showCoinModal?.({ symbol: sym, tradeId: trade?.id ?? null });
    });
  });
}

// ════════════════════════════════════════════
//  HALTED MODE — kill switch view (reads DataB.livePositions)
// ════════════════════════════════════════════
function renderHalted() {
  const a = DataB.mock.account;
  const positions = DataB.livePositions;
  const unrealized = positions.reduce((s, p) => s + p.pnl, 0);
  const totalNotional = positions.reduce((s, p) => s + p.mark * p.size, 0);

  const fmtPrice = v => v < 0.00001 ? v.toExponential(3) : v < 0.001 ? v.toFixed(7) : v < 1 ? v.toFixed(4) : v.toFixed(3);
  const fmtSize  = v => v > 100000 ? (v/1000).toFixed(0) + 'k' : v > 1000 ? v.toFixed(0) : v.toFixed(2);
  const sign     = v => v >= 0 ? '+' : '−';
  const abs      = v => Math.abs(v);

  let html = '<div class="halted-warn">⚠ TRADING HALTED</div>';
  html += '<div class="halted-sub">all positions liquidated at market · trading paused</div>';

  html += '<div class="halted-section"><div class="halted-h">ACCOUNT BALANCE</div>';
  html += `<div class="balance-hero">$${a.balance.toLocaleString()}</div>`;
  html += `<div class="balance-sub ${unrealized >= 0 ? 'sg' : 'sr'}">${sign(unrealized)}$${abs(unrealized).toFixed(2)} unrealized</div>`;
  html += `<div class="halted-kv"><span>Available</span><span>$${(a.balance - totalNotional).toFixed(2)}</span></div>`;
  html += `<div class="halted-kv"><span>Drawdown</span><span class="${a.dd > 10 ? 'sr' : 'sv'}">${a.dd.toFixed(2)}%</span></div>`;
  html += '</div>';

  html += `<div class="halted-section"><div class="halted-h">POSITIONS · ${positions.length} OPEN</div>`;
  if (positions.length === 0) {
    html += '<div class="halted-empty">no open positions</div>';
  } else {
    for (const p of positions) {
      const cls = p.pnl >= 0 ? 'sg' : 'sr';
      html += `<div class="halted-pos">
        <div class="hp-row">
          <span class="hp-sym">${p.sym}</span>
          <span class="hp-side">${p.side}</span>
          <span class="hp-size">size ${fmtSize(p.size)}</span>
        </div>
        <div class="hp-row hp-sub">
          <span>entry ${fmtPrice(p.entry)} · mark ${fmtPrice(p.mark)}</span>
          <span class="${cls}">${sign(p.pnl)}$${abs(p.pnl).toFixed(2)} (${sign(p.pnlPct)}${abs(p.pnlPct).toFixed(2)}%)</span>
        </div>
      </div>`;
    }
  }
  html += '</div>';

  html += '<div class="halted-section"><div class="halted-h">SUMMARY</div>';
  html += `<div class="halted-kv"><span>Total Notional</span><span>$${totalNotional.toFixed(0)}</span></div>`;
  html += `<div class="halted-kv"><span>Exposure</span><span>${(totalNotional/a.balance*100).toFixed(1)}%</span></div>`;
  html += '</div>';

  // SESSION TRADES (本次会话所有已平仓交易)
  const closed  = (window.Trader?.closedTrades || []).slice().reverse();
  const wins    = closed.filter(t => t.wasProfit).length;
  const losses  = closed.length - wins;
  const totalRealized = closed.reduce((s, t) => s + t.realizedPnl, 0);
  const totalSign = totalRealized >= 0 ? '+' : '−';
  const totalCls  = totalRealized >= 0 ? 'sg' : 'sr';

  html += `<div class="halted-section"><div class="halted-h">SESSION PnL</div>`;
  html += `<div class="session-pnl-hero ${totalCls}">${totalSign}$${Math.abs(totalRealized).toFixed(2)}</div>`;
  html += `<div class="session-pnl-sub">${closed.length} closed · ${wins}W · ${losses}L</div>`;
  if (closed.length === 0) {
    html += '<div class="halted-empty">no closed trades yet</div>';
  } else {
    for (const t of closed.slice(0, 40)) {
      const d = new Date(t.closeTs);
      const ts = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
      const cls = t.wasProfit ? 'sg' : 'sr';
      const s   = t.wasProfit ? '+' : '−';
      const pct = Math.abs(t.realizedPnl / t.stake * 100);
      html += `<div class="trade-row">
        <span class="tr-time">${ts}</span>
        <span class="tr-sym">${t.sym}</span>
        <span class="tr-stake">$${Math.round(t.stake)}</span>
        <span class="tr-pnl ${cls}">${s}$${Math.abs(t.realizedPnl).toFixed(2)} (${s}${pct.toFixed(1)}%)</span>
      </div>`;
    }
  }
  html += '</div>';

  document.getElementById('panelB-halted').innerHTML = html;
}

function enterHaltedB() {
  DataB.halted = true;
  document.getElementById('panelB-normal').style.display = 'none';
  document.getElementById('panelB-halted').style.display = '';
  renderHalted();
}

function exitHaltedB() {
  DataB.halted = false;
  document.getElementById('panelB-normal').style.display = '';
  document.getElementById('panelB-halted').style.display = 'none';
}

window.__b_halt   = enterHaltedB;
window.__b_resume = exitHaltedB;

// ════════════════════════════════════════════
//  COIN INFO MODAL (点击球体标签弹出)
// ════════════════════════════════════════════
const COIN_INFO = {
  WIF:   { name: 'dogwifhat',  chain: 'Solana',   desc: 'Solana-based meme token featuring a shiba inu wearing a knitted hat. Community-driven, launched late 2023.' },
  PEPE:  { name: 'Pepe',       chain: 'Ethereum', desc: 'ERC-20 meme coin inspired by the Pepe the Frog internet meme. Exploded in April 2023.' },
  BONK:  { name: 'Bonk',       chain: 'Solana',   desc: 'Solana community dog coin, 50% of supply airdropped in Dec 2022.' },
  DOGE:  { name: 'Dogecoin',   chain: 'Dogecoin', desc: 'Original dog-themed meme cryptocurrency, launched 2013 as a joke, now top-10 by market cap.' },
  SHIB:  { name: 'Shiba Inu',  chain: 'Ethereum', desc: 'Ethereum-based Dogecoin alternative, launched 2020 by the anonymous "Ryoshi".' },
  FLOKI: { name: 'Floki Inu',  chain: 'Ethereum', desc: 'Meme coin named after Elon Musk\'s Shiba Inu puppy Floki.' },
  BRETT: { name: 'Brett',      chain: 'Base',     desc: 'Base-chain meme coin based on Matt Furie\'s "Boys Club" character Brett.' },
  MOG:   { name: 'Mog Coin',   chain: 'Ethereum', desc: 'ERC-20 meme coin riding the "mog" internet culture trend.' },
};

let _coinModalSphere = null;
let _coinModalTimer  = null;

function showCoinModal(sph) {
  const modal   = document.getElementById('coinModal');
  const content = document.getElementById('coinModalContent');
  if (!modal || !content || !sph?.symbol) return;
  _coinModalSphere = sph;

  const sym  = sph.symbol;
  const info = COIN_INFO[sym] || { name: sym, chain: '—', desc: 'No description available.' };
  const trade = (window.Trader?.positions || []).find(p => p.id === sph.tradeId);
  const fmtP  = v => v < 1e-5 ? v.toExponential(3) : v < 1e-3 ? v.toFixed(7) : v < 1 ? v.toFixed(5) : v.toFixed(4);

  const side = trade?.side || 'LONG';
  const sideCls = side === 'LONG' ? 'long' : 'short';
  let html = `
    <div class="cm-head">
      <div class="cm-sym-row">
        <span class="cm-sym">${sym}</span>
        <span class="cm-side-pill ${sideCls}">▲ ${side}</span>
      </div>
      <div class="cm-full">${info.name}</div>
      <div class="cm-meta">${info.chain} · memecoin</div>
    </div>`;

  if (trade) {
    const heldMs  = Date.now() - trade.openTs;
    const heldStr = heldMs < 60000 ? `${Math.floor(heldMs/1000)}s` : `${Math.floor(heldMs/60000)}m ${Math.floor((heldMs%60000)/1000)}s`;
    const pnlCls  = trade.pnl >= 0 ? 'cm-pnl-pos' : 'cm-pnl-neg';
    const pnlSign = trade.pnl >= 0 ? '+' : '−';
    const pct24h  = (Math.sin(Date.now() / 3e6 + sym.charCodeAt(0)) * 8 + 2);
    const pct24Sign = pct24h >= 0 ? '+' : '';
    const sizeStr = trade.size > 1000 ? (trade.size/1000).toFixed(1) + 'k' : trade.size.toFixed(2);
    html += `
      <div class="cm-sec">
        <div class="cm-h">MARK PRICE</div>
        <div class="cm-price">${fmtP(trade.mark)}</div>
        <div class="cm-price-sub">24h ${pct24Sign}${pct24h.toFixed(2)}% <span class="cm-sep">·</span> entry ${fmtP(trade.entry)}</div>
      </div>
      <div class="cm-sec">
        <div class="cm-h">YOUR POSITION</div>
        <div class="cm-kv"><span>Stake</span><span>$${trade.stake.toFixed(2)}</span></div>
        <div class="cm-kv"><span>Size</span><span>${sizeStr}</span></div>
        <div class="cm-kv"><span>Unrealized PnL</span><span class="${pnlCls}">${pnlSign}$${Math.abs(trade.pnl).toFixed(2)} (${pnlSign}${Math.abs(trade.pnlPct).toFixed(2)}%)</span></div>
        <div class="cm-kv"><span>Held</span><span>${heldStr}</span></div>
      </div>`;
  } else {
    html += `<div class="cm-sec"><div class="cm-h">POSITION</div><div class="cm-empty">closed</div></div>`;
  }

  html += `
    <div class="cm-sec">
      <div class="cm-h">PRICE · LAST 120 TICKS</div>
      <canvas id="coinChart" class="cm-chart"></canvas>
    </div>`;

  html += `
    <div class="cm-sec">
      <div class="cm-h">ABOUT</div>
      <div class="cm-desc">${info.desc}</div>
    </div>`;

  content.innerHTML = html;
  modal.style.display = '';

  drawCoinChart();
  clearInterval(_coinModalTimer);
  _coinModalTimer = setInterval(drawCoinChart, 1000);
}

function drawCoinChart() {
  if (!_coinModalSphere) return;
  const sym = _coinModalSphere.symbol;
  const canvas = document.getElementById('coinChart');
  if (!canvas || !window.Trader?.getPriceHistory) return;
  const arr = Trader.getPriceHistory(sym);
  if (!arr || arr.length < 2) return;

  const W = Math.max(100, canvas.parentElement.clientWidth);
  canvas.width = W * 2; canvas.height = 110 * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  const cW = W, cH = 110;
  ctx.clearRect(0, 0, cW, cH);

  let mn = Infinity, mx = -Infinity;
  for (const v of arr) { if (v < mn) mn = v; if (v > mx) mx = v; }
  const range = (mx - mn) || mx * 0.01 || 1;

  const first = arr[0];
  const last  = arr[arr.length - 1];
  const up    = last >= first;
  const col   = up ? '#4dffd2' : '#ff7070';

  // 底部渐变填充
  ctx.beginPath();
  ctx.moveTo(0, cH - 6);
  for (let i = 0; i < arr.length; i++) {
    const x = (i / (arr.length - 1)) * cW;
    const y = cH - ((arr[i] - mn) / range) * (cH - 16) - 6;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(cW, cH - 6);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, cH);
  grad.addColorStop(0, up ? 'rgba(77,255,210,0.18)' : 'rgba(255,112,112,0.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // 主线
  ctx.beginPath();
  for (let i = 0; i < arr.length; i++) {
    const x = (i / (arr.length - 1)) * cW;
    const y = cH - ((arr[i] - mn) / range) * (cH - 16) - 6;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 入场价参考线
  const trade = (window.Trader?.positions || []).find(p => p.id === _coinModalSphere.tradeId);
  if (trade) {
    const entryY = cH - ((trade.entry - mn) / range) * (cH - 16) - 6;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(0, entryY); ctx.lineTo(cW, entryY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '9px Inter';
    ctx.fillText('ENTRY', 4, entryY - 3);
  }

  // 最新价点
  const lastY = cH - ((last - mn) / range) * (cH - 16) - 6;
  ctx.beginPath();
  ctx.arc(cW - 3, lastY, 2.8, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();

  // % 变化角标
  const pct = ((last / first) - 1) * 100;
  ctx.font = '10px Inter';
  ctx.fillStyle = col;
  ctx.textAlign = 'right';
  ctx.fillText(`${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`, cW - 4, 12);
  ctx.textAlign = 'left';
}

function hideCoinModal() {
  const m = document.getElementById('coinModal');
  if (m) m.style.display = 'none';
  _coinModalSphere = null;
  clearInterval(_coinModalTimer);
  _coinModalTimer = null;
}

window.__showCoinModal = showCoinModal;
window.__hideCoinModal = hideCoinModal;

window.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('coinModal');
  if (!modal) return;
  modal.querySelector('.coin-modal-backdrop')?.addEventListener('click', hideCoinModal);
  modal.querySelector('.coin-modal-close')?.addEventListener('click', hideCoinModal);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideCoinModal(); });
});

// ════════════════════════════════════════════
//  API PANEL · TICKER
// ════════════════════════════════════════════
function updateApiPanel() {
  const lat = Backend.apiLatencies;
  document.getElementById('lat-okx').textContent = lat.okx.toFixed(0) + 'ms';
  document.getElementById('lat-ws').textContent  = lat.ws.toFixed(0) + 'ms';
  document.getElementById('latVal').textContent  = Backend.latency.toFixed(1) + 'ms';
}

function buildTicker() {
  const m = DataB.mock;
  const items = [
    ['BTC',      '$' + Backend.btcPrice.toFixed(0)],
    ['ETH',      '$' + Backend.ethPrice.toFixed(0)],
    ['BTC-1H',   fmtPct(m.btc.h1)],
    ['BTC-24H',  fmtPct(m.btc.h24)],
    ['BUCKET',   m.btc.bucket],
    ['SIZING',   (m.btc.sizing*100).toFixed(0)+'%'],
    ['OPEN',     m.portfolio.open + '/' + m.portfolio.max],
    ['TRIG-24H', m.portfolio.triggers24h],
    ['LATENCY',  Backend.latency.toFixed(1)+'ms'],
    ['DD',       m.account.dd.toFixed(1)+'%'],
  ];
  const str = items.map(([k,v]) => `<span>${k}</span> ${v} &nbsp;·&nbsp; `).join('');
  document.getElementById('tickerInner').innerHTML = str + str;
}
