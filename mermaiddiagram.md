```mermaid
graph TD
    subgraph Data Source
        OKX[OKX API]
    end
 
    subgraph Backend Data
        Backend[Backend\nblock height, volume, EDGE,\nBTC/ETH price, spread, latency]
        Trader[Trader\npositions, balance, drawdown,\nstrategy mode, trade history]
    end
 
    subgraph Panel A — User Control / Kill Switch
        PauseBtn[PAUSE ENGINE]
        StopAll[STOP ALL]
        ResumeBtn[RESUME]
    end
 
    subgraph Panel B — Particle Field / Visualization
        Particles[Three.js Particle Cloud\nspheres spawn on buy, dissolve on sell]
        PnLFloat[Floating PnL Number]
        DipoleToggle[DIPOLE MODEL Toggle]
        BottomStats[ACTIVE / FILLS / AVG HOLD / THRU]
    end
 
    subgraph Panel C — Data Tracking Monitor
        PnLCurve[PnL Curve + ROI + Balance]
        Bayes[Bayesian Model P H|D]
        SpreadZ[Spread Z-Score ±2σ]
        Kelly[Kelly Criterion p q b f* Ev]
        Factors[Strategy Factors\nMOMENTUM / MEAN-REVERT / ORDER FLOW\nVOL REGIME / FUNDING RATE]
        Signals[Live Signals\nBTC ETH PERP\nLONG / SHORT / HOLD]
    end
 
    subgraph Bottom Ticker Bar
        Ticker[Scrolling: BTC ETH SPREAD-Z\nPOSTERIOR KELLY WIN-RATE\nFILLS LATENCY PARTICLES]
    end
 
    OKX -->|price ticks| Backend
    Backend --> Trader
    Backend --> PanelC
    Trader --> PanelA
    Trader --> PanelB
    Trader --> PanelC
 
    PanelC -.-> PnLCurve
    PanelC -.-> Bayes
    PanelC -.-> SpreadZ
    PanelC -.-> Kelly
    PanelC -.-> Factors
    PanelC -.-> Signals
 
    PanelA -.-> PauseBtn
    PanelA -.-> StopAll
    PanelA -.-> ResumeBtn
 
    PanelB -.-> Particles
    PanelB -.-> PnLFloat
    PanelB -.-> DipoleToggle
    PanelB -.-> BottomStats
 
    Backend --> Ticker
 
    StopAll -->|halt event| HaltState{HALT STATE}
    HaltState -->|A: controls greyed out\nonly RESUME active| PanelA
    HaltState -->|B: balance largest on screen\ntrade history + PnL breakdown| PanelB
    HaltState -->|C: all particles vanish\nscreen dims to near black| PanelC
 
    ResumeBtn -->|resume event| Resume{RESUME}
    Resume --> PanelA
    Resume --> PanelB
    Resume --> PanelC
 
    classDef source fill:#1a1a2e,stroke:#00ffcc,color:#00ffcc
    classDef state fill:#0d0d0d,stroke:#ffffff,color:#ffffff
    classDef panelA fill:#1a0000,stroke:#ff4444,color:#ff4444
    classDef panelB fill:#0d0d1a,stroke:#ffffff,color:#ffffff
    classDef panelC fill:#0d1a1a,stroke:#00ffcc,color:#00ffcc
    classDef halt fill:#330000,stroke:#ff0000,color:#ff0000
    classDef resume fill:#001a00,stroke:#00ff00,color:#00ff00
 
    class OKX source
    class Backend,Trader state
    class PauseBtn,StopAll,ResumeBtn panelA
    class Particles,PnLFloat,DipoleToggle,BottomStats panelB
    class PnLCurve,Bayes,SpreadZ,Kelly,Factors,Signals panelC
    class HaltState halt
    class Resume resume
```
