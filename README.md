3ource
======

This (horrible) project name "3ource" comes from words "Tree source" (also a pun of "three.js sauce").

It was intended to be a Time-based visualization of git repositories renderered in the browser.

It was also inspired by [Gource](https://code.google.com/p/gource/).

## Warning: Work-in-progress

Sneak peak:
[Gitlog viewer](https://zz85.github.io/3ource/src/timeline.html)
[Log graph stepper](https://zz85.github.io/3ource/src/flow.html)
[Three.js WebGL Rendering](https://zz85.github.io/3ource/src/force_directed_webgl.html)
[Canvas grapher rendering](https://zz85.github.io/3ource/src/force_directed.html)

## Usage


```js
node utils/process.js
```
for generating data files of git directory.

go poke into /src

## Components
- git history parser

- git log viewer and intepretor
Loads the git data structure produced by the parser and display both the logs and a pretty git graph. Viewer uses virtual rendering to support huge number of logs

- force directed graph simulation
A simple homebrew force directed simulator.

- force directed graph rendering
Renders with webgl/three.js or canvas.

## History

Xuanji and Chernjie joined me to work on this idea  [SuperHappyDevHouse Singapore](https://www.facebook.com/shdhsg) [at the start](http://www.superhappydevhouse.sg/w/page/65152011/SHDH%203%20Current%20Projects).

We experimented with the Github REST API, and node.js git bindings. I opt instead then to use node.js to exec() git commands that outputs a json format that can be read by browsers more effeciently.

If I were to implement this today, I might also consider
- nodegit [https://github.com/nodegit/nodegit](https://github.com/nodegit/nodegit)
- jsgit [https://github.com/creationix/jsgit](https://github.com/creationix/jsgit)
- grapheen [https://github.com/nashira/grapheen](https://github.com/nashira/grapheen)
- commits-graph [https://github.com/tclh123/commits-graph](https://github.com/tclh123/commits-graph)

Although are also many force-directed js libraries (springy, d3, vivagraph, n-graph arbor, etc), I wrote mine because I wanted to try writing one by my own.