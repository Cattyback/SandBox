# Intent

original file:https://docs.google.com/document/d/1OFBZqK2lhAJ3Q_gULIA8n3Zryjvpk7NsVRc2LL8pvPc/edit?usp=sharing
A real-time control room for a friend's crypto-trading bot. The bot automatically opens and closes positions through quantitative calculations. My goal is to design a UI for it so the operator can see what the bot is thinking, what the market is doing, and step in when something goes wrong.

I chose this domain because the bot is real, the operator is real, and "making trading state clear and readable without overwhelming the user" is a problem I actually care about, not a made-up one. Every UI decision in this project is held to one standard: my friend should be able to look at this screen, understand what his bot is doing, and manually flatten all positions and shut down all trades immediately if needed.

## Three Panel Architecture

- **A — Stop**: When the market does something that exceeds the model's predictions, the operator can manually trigger an emergency shutdown of all trades. This is the last line of defense across every position.
- **B — Market & Engine Browser** (Browser + ambient Detail): "What is the bot looking at, and what is it doing?"
- **C — Engine Pulse** (Detail View at the system level): "Is the engine alive? Is it healthy?"

### Panel A
One oversized red button. One click stops the trading engine, flattens all positions, and freezes the entire interface into a halted state. Cross-panel effects: B switches render mode, C's particle colors gradually drain.

### Panel B
Real-time OKX market data, signal table, open positions, trade history, PnL curves. The user scans the collection. Clicking a coin row opens a detail modal.

### Panel C
A Three.js particle cloud. Its density, color, and motion reflect the overall state of the engine. When the kill switch fires, the cloud goes dim and stops moving. The visualization needs to show buys and sells intuitively — a sphere appears when the bot buys and dissolves when it sells, and each sphere can be clicked to view detailed information.

## Data Model

All data comes from the bot's simulated calculations running on real-time OKX feeds. All three panels change as the bot trades.

## Visual Rules

- **Aesthetic**: Inter typeface, black background, white text.
- **Color is reserved for meaning**: cyan = normal, red = critical, orange = warning.
- **Every animation must reflect an actual state change.** No meaningless loops just for atmosphere.
- When Panel A triggers the kill switch, Panel B shows a full breakdown of account balance, position value, and complete trade history. Panel C stops generating new spheres.
