3ource
======

This (horrible) project name "3ource" comes from words "Tree source" (also a pun of "three.js sauce").

It was intended to be a Time-based visualization of git repositories renderered in the browser.

It was also inspired by [Gource](https://code.google.com/p/gource/).

## Warning: Not Production Quality Yet.

## Usage


```js
node utils/process.js
```
for generating data files of git directory.

go poke into /src

## History

I was joined by Xuanji and Chernjie at [SuperHappyDevHouse Singapore](https://www.facebook.com/shdhsg) [last year](http://www.superhappydevhouse.sg/w/page/65152011/SHDH%203%20Current%20Projects) but unfortunately didn't managed to finish it then.

Some Components
- git history parser
- git log viewer and intepretor
- simulating force directed diagram

Then state of node.js and git wasn't probably the best then, but it got us experimenting with git, node and js. 

We experimented with the Github REST API, and node.js git bindings. I opt instead then to use node.js to exec() git commands that outputs a json format that can be read by browsers more effeciently.

If I were to implement this today, I might also consider
- nodegit [https://github.com/nodegit/nodegit](https://github.com/nodegit/nodegit)
- jsgit [https://github.com/creationix/jsgit](https://github.com/creationix/jsgit)
- grapheen [https://github.com/nashira/grapheen](https://github.com/nashira/grapheen)
- commits-graph [https://github.com/tclh123/commits-graph](https://github.com/tclh123/commits-graph)