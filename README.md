# 2048 AI

AI for the game [2048](https://github.com/gabrielecirulli/2048).

See it in action [here](http://rrotaru.github.io/2048-AI/). (Hit the auto-run button to let the AI attempt to solve it by itself)

The algorithm uses a Markov Chain Monte Carlo (MCMC) approach. The evaluation function tries to efficiently calculate utility in order to reduce the number of Monte Carlo simulations necessary for path prediction using Markov Chaining. Incredibly, results show a strong success rate with only *seven* simulations per state and a depth of looking *two* moves ahead through Markov Chaining.
Running this AI will be slow due to the overhead associated with generating each state simulation in JavaScript, but a port of this code to C would boost performance dramatically.

This AI is forked from ov3y's AI, simplified, and implemented with a different algorithm using different heuristics as part of a project on Artificial Intelligence. 
I also drew inspiration from nneonneo's AI for 2048.
