// ════════════════════════════════════════════
//  Trader  —  Unified simulation engine (ABC 三模块共享数据源)
//
//  初始资金: $10,000 | 胜率: 60% | 最多同时持仓: 3
//
//  后端接口契约 (接入真实数据时,替换本文件实现,保持同名接口):
//    读状态:  balance, equity, drawdown, positions, equityCurve, bots, halted
//    订阅事件: Trader.on('open'|'close'|'halt'|'resume', fn)
//    控制:    Trader.halt() / resume() / tick()
//
//  事件 payload:
//    open  → {id, sym, side, entry, mark, size, stake, ts}
//    close → {...pos, realizedPnl, wasProfit, closeTs}
// ════════════════════════════════════════════
const Trader = {
  // ── Config ──
  INITIAL_CAPITAL: 10000,
  WIN_RATE: 0.60,
  MAX_OPEN: 3,
  STAKE_PCT: 0.08,     // 每笔下注 8% 账户
  STAKE_CAP:  800,

  // ── Account State ──
  balance:      10000,
  equity:       10000,
  equityCurve:  [10000],
  peakEquity:   10000,
  drawdown:     0,

  // ── Positions ──
  positions:    [],
  closedTrades: [],
  nextId:       1,

  // ── Bots (三机器人对比) — v3 是本 Trader,test/nfi 为影子对比 ──
  bots: {
    v3:   { name: 'v3 live', running: true, winRate: 0.60, balance: 10000, equityCurve: [10000], tradesToday: 0, pnlToday: 0, hb: 0, decisionsToday: 0, rejectsToday: 0 },
    test: { name: 'test',    running: true, winRate: 0.58, balance: 10000, equityCurve: [10000], tradesToday: 0, pnlToday: 0, hb: 0, decisionsToday: 0, rejectsToday: 0 },
    nfi:  { name: 'nfi',     running: true, winRate: 0.54, balance: 10000, equityCurve: [10000], tradesToday: 0, pnlToday: 0, hb: 0, decisionsToday: 0, rejectsToday: 0 },
  },

  halted: false,
  _listeners: {},

  // ── Event bus ──
  on(ev, fn) { (this._listeners[ev] ||= []).push(fn); },
  off(ev, fn) { const l = this._listeners[ev]; if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } },
  emit(ev, data) { const l = this._listeners[ev]; if (l) for (const fn of l) fn(data); },

  // ── Controls ──
  halt() {
    if (this.halted) return;
    this.halted = true;
    // 紧急熔断:按当前 mark 市价强平所有开仓 (emit 'close' per trade)
    for (const pos of [...this.positions]) this._closeTrade(pos, { atMarket: true, reason: 'halt' });
    this.emit('halt');
  },
  resume() { if ( this.halted) { this.halted = false; this.emit('resume'); } },

  // ── Symbol universe (memecoin momentum basket) ──
  _coins: ['WIF','PEPE','BONK','DOGE','SHIB','FLOKI','BRETT','MOG'],
  _basePrices: { WIF: 2.47, PEPE: 1.8e-6, BONK: 3.12e-5, DOGE: 0.412, SHIB: 2.41e-5, FLOKI: 0.194, BRETT: 0.087, MOG: 5.6e-7 },
  _priceHistory: {},
  _HIST_LEN: 120,

  getPriceHistory(sym) { return this._priceHistory[sym] || null; },

  _initHistory(sym) {
    const arr = new Float32Array(this._HIST_LEN);
    let p = this._basePrices[sym];
    arr[this._HIST_LEN - 1] = p;
    for (let i = this._HIST_LEN - 2; i >= 0; i--) {
      p /= (1 + (Math.random() - 0.5) * 0.012);
      arr[i] = p;
    }
    this._priceHistory[sym] = arr;
  },

  _tickPrices() {
    for (const sym of this._coins) {
      if (!this._priceHistory[sym]) this._initHistory(sym);
      const arr = this._priceHistory[sym];
      const last = arr[arr.length - 1];
      for (let i = 0; i < arr.length - 1; i++) arr[i] = arr[i + 1];
      const next = last * (1 + (Math.random() - 0.5) * 0.010);
      arr[arr.length - 1] = next;
      this._basePrices[sym] = next;
    }
  },

  _pickCoin() {
    const taken = new Set(this.positions.map(p => p.sym));
    const pool  = this._coins.filter(c => !taken.has(c));
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  },

  _openTrade() {
    if (this.positions.length >= this.MAX_OPEN) return;
    if (this.balance < 200) return;
    const sym = this._pickCoin();
    if (!sym) return;
    const entry = this._basePrices[sym];
    const stake = Math.min(this.balance * this.STAKE_PCT, this.STAKE_CAP);
    const pos = {
      id: this.nextId++,
      sym, side: 'LONG',
      entry, mark: entry,
      size: stake / entry, stake,
      pnl: 0, pnlPct: 0,
      openTs: Date.now(),
      willWin: Math.random() < this.WIN_RATE,  // 预决定输赢,保证整体 60% 胜率
    };
    this.positions.push(pos);
    this.emit('open', pos);
  },

  _closeTrade(pos, { atMarket = false, reason = 'signal' } = {}) {
    const idx = this.positions.indexOf(pos);
    if (idx < 0) return;
    let realized;
    if (atMarket) {
      // 紧急熔断:按当前 mark 结算 (pos.pnl 已实时跟踪 mark-entry 差)
      realized = pos.pnl;
    } else {
      // 正常平仓:按预定 willWin 结算 (维持 60% 胜率)
      const gainPct = pos.willWin
        ? (0.008 + Math.random() * 0.032)       // +0.8% ~ +4%
        : -(0.005 + Math.random() * 0.020);     // -0.5% ~ -2.5%
      realized = pos.stake * gainPct;
    }
    this.balance += realized;
    this.positions.splice(idx, 1);
    const record = { ...pos, closeTs: Date.now(), realizedPnl: realized, wasProfit: realized > 0, closeReason: reason };
    this.closedTrades.push(record);
    if (this.closedTrades.length > 200) this.closedTrades.shift();
    this.emit('close', record);
  },

  _driftMarks() {
    for (const p of this.positions) {
      // 拉向胜/负目标 + 少量噪声
      const target = p.willWin ? p.entry * 1.03 : p.entry * 0.98;
      const pull   = (target - p.mark) * 0.04;
      const noise  = (Math.random() - 0.5) * p.entry * 0.003;
      p.mark = p.mark + pull + noise;
      p.pnl    = (p.mark - p.entry) * p.size;
      p.pnlPct = ((p.mark / p.entry) - 1) * 100;
    }
  },

  _updateEquity() {
    const unrealized = this.positions.reduce((s, p) => s + p.pnl, 0);
    this.equity = this.balance + unrealized;
    this.equityCurve.push(this.equity);
    if (this.equityCurve.length > 500) this.equityCurve.shift();
    if (this.equity > this.peakEquity) this.peakEquity = this.equity;
    this.drawdown = Math.max(0, (this.peakEquity - this.equity) / this.peakEquity * 100);
  },

  _tickSecondaryBot(bot) {
    const roll  = Math.random();
    const delta = roll < bot.winRate
      ? bot.balance * (0.002 + Math.random() * 0.010)
      : -bot.balance * (0.001 + Math.random() * 0.008);
    bot.balance += delta;
    bot.equityCurve.push(bot.balance);
    if (bot.equityCurve.length > 500) bot.equityCurve.shift();
    if (Math.random() < 0.35) {
      bot.tradesToday++;
      bot.pnlToday += Math.round(delta);
    }
    bot.decisionsToday += (Math.random() * 3) | 0;
    bot.rejectsToday   += (Math.random() * 2) | 0;
    bot.hb = Math.floor(Math.random() * 4);
  },

  tick() {
    this._tickPrices();
    this._driftMarks();

    if (!this.halted) {
      // 关仓概率随持仓时长上升 (0~10s 内从 0% 增至 50%/tick)
      for (const pos of [...this.positions]) {
        const age = Date.now() - pos.openTs;
        const pClose = Math.min(0.5, age / 20000);
        if (Math.random() < pClose) this._closeTrade(pos);
      }
      // 开新仓
      if (Math.random() < 0.5 && this.positions.length < this.MAX_OPEN) {
        this._openTrade();
      }
    }

    this._updateEquity();

    // 镜像到 v3 bot 卡片 (v3 = 本 Trader 本体)
    this.bots.v3.balance      = this.balance;
    this.bots.v3.equityCurve  = this.equityCurve;
    this.bots.v3.tradesToday  = this.closedTrades.length;
    this.bots.v3.pnlToday     = Math.round(this.balance - this.INITIAL_CAPITAL);
    this.bots.v3.hb           = Math.floor(Math.random() * 3);

    // 影子对比 bot
    if (!this.halted) {
      this._tickSecondaryBot(this.bots.test);
      this._tickSecondaryBot(this.bots.nfi);
    }
  },
};

window.Trader = Trader;
