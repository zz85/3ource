3ource
======

This (horrible) project name "3ource" comes from words "Tree source" (also a pun of "three.js sauce").

It was intended to be a Time-based visualization of git repositories renderered in the browser.

It was also inspired by [Gource](https://code.google.com/p/gource/).

## Warning: Work-in-progress

Sneak peak:
- [Gitlog viewer](https://zz85.github.io/3ource/src/timeline.html)
- [Git History Player (WebGL Rendering with Three.js)](https://zz85.github.io/3ource/src/flow_webgl.html)
- [Git History Player (Canvas)](https://zz85.github.io/3ource/src/flow.html)

## Slides
[Slides for presentation](https://slides.com/zz85/git-visualization-js/) at SingaporeJS meetup.


## Usage

Converting Git Data to 3ource JS format.

```js
node utils/process.js
```

or

```sh
npm run transform
```

for generating data files of git directory. If the git repository is huge, transforming may take some time.

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