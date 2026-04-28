// ════════════════════════════════════════════
//  A  —  用户操作区 (User Operations)
//   KILL SWITCH: 停止所有自动交易,同时 sell 掉所有活跃持仓
// ════════════════════════════════════════════
const DataA = { halted: false };

function renderA() { /* no-op */ }

window.addEventListener('DOMContentLoaded', () => {
  const btn    = document.getElementById('killBtn');
  const status = document.getElementById('killStatus');
  if (!btn || !status) return;

  const mainEl = btn.querySelector('.kill-main');
  const subEl  = btn.querySelector('.kill-sub');

  btn.addEventListener('click', () => {
    DataA.halted = !DataA.halted;
    if (DataA.halted) {
      btn.classList.add('on');
      mainEl.textContent  = 'RESUME';
      subEl.textContent   = 'CLICK TO RESUME';
      status.textContent  = '● HALTED';
      status.classList.add('stopped');
      window.Trader?.halt();
    } else {
      btn.classList.remove('on');
      mainEl.textContent  = 'STOP ALL';
      subEl.textContent   = 'KILL SWITCH';
      status.textContent  = '● TRADING · LIVE';
      status.classList.remove('stopped');
      window.Trader?.resume();
    }
  });
});
