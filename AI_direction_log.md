# AI Direction Log

#original file with photos:https://docs.google.com/document/d/1Sv7TgM5nDyBi-Bj_qgbmscdKmmd_bHqVOHU-c6f0RHA/edit?usp=sharing 

### Record 1: Particle Visuals

**My Instructions:** I provided the AI with a reference image and requested it to generate a similar particle-based visual. I added specific details to the prompt, such as using Three.js to achieve a "particle nebula" effect. The instructions specified that the overall shape should remain within the frame and the overall brightness should be low.

**AI Output:** Based on the image analysis and my prompt, the AI generated a nebula-like entity composed of particles that continuously shifts and morphs in shape.

**My Decision:** I retained most of the output. I removed some of the branching lines that initially appeared too rigid and overly decorative. I also lowered the brightness three consecutive times to give it a more "high-tech" feel.

### Record 2: Three-Panel Layout & Backend Architecture

**My Instructions:** I used text to describe a complete layout consisting of three columns from left to right, labeled A, B, and C.

- **Panel A (Left):** User control area, including an emergency stop switch.
- **Panel B (Middle):** Real-time market information.
- **Panel C (Right):** The particle simulation, where small spheres appear and vanish whenever the bot executes a trade.

I also instructed the AI to decouple the backend so that a real trading bot could be integrated later. For now, I had it simulate an automated OKX trading bot to drive the main loop of the three panels.

**AI Output:** The AI generated the complete three-panel structure, a Backend/Trader/Data state model, a masterTick loop with a 1600ms interval, and an event-based cross-panel communication system. Each panel reads data from its respective slice of the shared state.

**My Decision:** I kept nearly all of this output. The architecture aligned perfectly with my description, and the panel zoning matched my intent. I only made visual adjustments—font sizes, spacing density, and the color system—to align with my desired "terminal aesthetic." This serves as the structural backbone of the project; the AI executed it precisely because I provided a very specific specification.

### Record 3: Particle Flower Experiment

**My Instructions:** This was a branch of the first record. I wanted to push the particle visualization further, asking the AI to use the original particles to form the shape of a flower, with petals randomly shimmering and deforming to achieve a more high-impact visual effect.

**AI Output:** The AI generated a particle system where points were distributed along parametric petal curves, featuring random flickering animations and continuous morphing between petal states. The result was a glowing, pulsating flower made of particles. It was visually striking, but it had zero correlation with any trading data, and the logic did not improve even after several prompt adjustments.

**My Decision:** I completely rejected this version and reverted to the previous attractor particle cloud. While the flower looked cool, it violated my core visual rule: Movement = Data. The flickering and morphing were purely decorative and held no connection to the engine's state. It also failed UX logic—a glowing flower is not something a trader expects to see. This was the most definitive "resistance" in the project. Being "aesthetic" is not enough; every visual element must earn its place by representing a real state.
