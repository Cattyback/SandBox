// ════════════════════════════════════════════
//  Backend  —  OKX v5 public WebSocket feed (BTC/ETH tickers)
//  REST: https://www.okx.com/api/v5/  (未使用, tickers 已能通过 WS 获取)
//  WS:   wss://ws.okx.com:8443/ws/v5/public
//
//  实时字段:  btcPrice / ethPrice / spread / spreadZ / latency / apiLatencies.okx / .ws
//  保留本地模拟:  bayesPosterior / kellyF / ev (策略派生量, OKX 不提供)
//  断线兜底:  停流 >5s 时退回随机游走, UI 不会冻结
// ════════════════════════════════════════════
const Backend = {
  btcPrice: 94200,
  ethPrice: 3240,
  btcVol24h: 0,        // OKX volCcy24h (USD)
  btcBid: 0,
  btcAsk: 0,
  spread: 0,           // USD (ask - bid for BTC-USDT)
  spreadZ: 0,          // rolling z-score
  bayesPosterior: 0.531,
  kellyF: 0.041,
  ev: 0.018,
  winRate: 0.604,
  totalPnL: 74523,
  tradesHr: 48,
  latency: 3.2,
  fillCount: 0,
  activeParticles: 0,
  apiLatencies: { okx: 12, ws: 3, bayes: 1, kelly: 0, poly: 28 },

  _ws: null,
  _wsConnected: false,
  _wsLastMsgAt: 0,
  _spreadBuf: [],

  connectOKX() {
    try {
      const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public');
      this._ws = ws;
      ws.onopen = () => {
        this._wsConnected = true;
        ws.send(JSON.stringify({
          op: 'subscribe',
          args: [
            { channel: 'tickers', instId: 'BTC-USDT' },
            { channel: 'tickers', instId: 'ETH-USDT' },
          ],
        }));
      };
      ws.onmessage = (e) => this._onWsMsg(e.data);
      ws.onclose = () => {
        this._wsConnected = false;
        setTimeout(() => this.connectOKX(), 3000);
      };
      ws.onerror = () => { /* onclose 会跟进重连 */ };
    } catch {
      setTimeout(() => this.connectOKX(), 3000);
    }
  },

  _onWsMsg(raw) {
    if (raw === 'pong') return;
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg.data) return;
    this._wsLastMsgAt = Date.now();
    for (const t of msg.data) this._applyTicker(t);
  },

  _applyTicker(t) {
    const last = parseFloat(t.last);
    const bid  = parseFloat(t.bidPx);
    const ask  = parseFloat(t.askPx);
    if (t.instId === 'BTC-USDT') {
      this.btcPrice = last;
      this.btcBid = bid; this.btcAsk = ask;
      this.btcVol24h = parseFloat(t.volCcy24h);
      this.spread = ask - bid;
      // 60-sample rolling mean/std → z-score
      this._spreadBuf.push(this.spread);
      if (this._spreadBuf.length > 60) this._spreadBuf.shift();
      const n = this._spreadBuf.length;
      let m = 0; for (let i = 0; i < n; i++) m += this._spreadBuf[i];
      m /= n;
      let v = 0; for (let i = 0; i < n; i++) { const d = this._spreadBuf[i] - m; v += d * d; }
      const s = Math.sqrt(v / n) || 1;
      this.spreadZ = (this.spread - m) / s;
    } else if (t.instId === 'ETH-USDT') {
      this.ethPrice = last;
    }
    this.latency = Math.max(0, Date.now() - parseInt(t.ts));
  },

  tick() {
    // Bayes / Kelly / EV 为策略派生量, 保留随机游走
    this.bayesPosterior = Math.min(0.72, Math.max(0.48, this.bayesPosterior + (Math.random()-0.5)*0.008));
    this.kellyF = Math.min(0.09, Math.max(0.01, this.kellyF + (Math.random()-0.5)*0.003));
    this.ev = this.kellyF * 0.45;

    this.apiLatencies.okx   = Math.max(1, this.latency);
    this.apiLatencies.ws    = this._wsConnected
      ? Math.max(0, Math.min(999, Date.now() - this._wsLastMsgAt))
      : 999;
    this.apiLatencies.bayes = Math.random() * 2;
    this.apiLatencies.kelly = 0;
    this.apiLatencies.poly  = 20 + Math.random() * 20;

    // 断线或停流 >5s → 兜底随机游走, 避免 UI 冻结
    if (!this._wsConnected || (Date.now() - this._wsLastMsgAt) > 5000) {
      this.btcPrice += (Math.random() - 0.499) * 8;
      this.ethPrice += (Math.random() - 0.499) * 1.2;
      this.spread   = (Math.random() - 0.48) * 40;
      this.spreadZ  = this.spread / 8.5;
    }
  }
};

// 心跳 —— OKX 空闲 30s 会断线
setInterval(() => {
  if (Backend._ws && Backend._wsConnected) {
    try { Backend._ws.send('ping'); } catch {}
  }
}, 25000);

Backend.connectOKX();
