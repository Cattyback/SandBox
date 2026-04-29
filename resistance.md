# Resistance

##original file: https://docs.google.com/document/d/14LSmE1XKg4zP9mKG064AYQdxZTF2p6zFv1QJWmZcFsQ/edit?usp=sharing
## Resistance Record 1: Particle Flower

**What the AI produced:** I asked the AI to use particles to create a flower shape where the petals randomly shimmer and morph. The AI generated a parametric petal system with flickering animations and constant shape shifting. The result was a glowing, pulsating flower made of particles.

**Why I rejected it:** It looks flashy but represents absolutely nothing. The flickering and morphing are just idle animations with zero connection to trading status. My visual rule is movement equals data. Anything moving on the screen must reflect a real change in status. Putting a glowing flower on a trading control room screen is decoration, not information. Plus, it completely clashes with the terminal aesthetic.

**What I did instead:** I went back to the attractor particle cloud where density, color, and movement are all driven by the engine status. Particles are generated when the bot buys and dissipate when it sells. Every single action on the screen maps to a real event.

## Resistance Record 2: Color Scheme and Fonts

**What the AI produced:** The AI built the interface using a cyan and red color scheme on a black background with small monospaced fonts used everywhere. It looked like a typical hacker terminal with green tones and neon highlights. It was a stereotypical tech design that looked high end but the colors didn't actually mean anything.

**Why I rejected it:** The cyan and red combo created way too much visual noise. When everything is glowing, nothing stands out and the design hierarchy becomes unclear. Small cyan text is hard to read on a black background. The monospaced font made dense data blocks look like raw logs instead of organized information, making it very hard to actually read the data.

**What I did instead:** I switched to a black and white base palette and used Inter as the main font. I strictly reserved color for meaning. Cyan means normal status, red means critical alerts, and orange means warnings. White text on a black background is the default neutral state. This way, when red appears, it actually matters. Since Inter is the favorite default font for UX designers, switching to it made every data module look clearer and more professional without losing that dense, no nonsense feel.

## Resistance Record 3: Emergency Stop State

**What the AI produced:** After the emergency stop was triggered, the AI implementation showed scattered fragments of information in Panel B. There were small blocks of text showing various data points without any clear hierarchy. Panel C just stopped the particle animation but kept the same brightness, making it look like it was frozen or stuck rather than shut down.

**Why I rejected it:** My friend specifically told me that he needs to see the wallet balance immediately after stopping, and the logic is very clear. When an operator has to stop things manually, their first question is always how much money do I have left right now. Scattered info forces the user to scan and search during the most stressful moments. The balance must be the largest and most obvious number on the screen, not buried under other data. Also, Panel C just freezing in place looks like a bug rather than a system response. The stop state should make the whole screen tell you that it has stopped.

**What I did instead:** I redesigned the stop state. Panel B now immediately displays the account balance as the largest and most eye-catching element, with position value and full trade history arranged in a clear hierarchy below it. For Panel C, I didn't just stop it, I dimmed it way down. The particle cloud fades and darkens, making the shutdown impossible to ignore. The whole screen switches from an active state to a drained state. You don't need to read a single word to know the system is stopped.
