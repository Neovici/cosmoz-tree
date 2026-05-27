# cosmoz-tree

[![Build Status](https://github.com/Neovici/cosmoz-tree/workflows/Github%20CI/badge.svg)](https://github.com/Neovici/cosmoz-tree/actions?workflow=Github+CI)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/Neovici/cosmoz-tree)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## &lt;cosmoz-tree&gt;

Element and helper classes to manage tree data structure.

## Install the Polymer-CLI

First, make sure you have the
[Polymer CLI](https://www.npmjs.com/package/polymer-cli) installed. Then run
`polymer serve` to serve your application locally.

## Viewing Your Application

```
$ polymer serve
```

## Building Your Application

```
$ polymer build
```

This will create a `build/` folder with `bundled/` and `unbundled/` sub-folders
containing a bundled (Vulcanized) and unbundled builds, both run through HTML,
CSS, and JS optimizers.

You can serve the built versions by giving `polymer serve` a folder to serve
from:

```
$ polymer serve build/bundled
```

## Running Tests

```
$ polymer test
```

Your application is already set up to be tested via [web-component-tester](https://github.com/Polymer/web-component-tester). Run `polymer test` to run
your application's test suite locally.

## Running Performance Tests (Local Only)

The repository includes a local-only Node performance suite for large immutable trees.

```
$ npm run test:perf
```

By default it runs with tree sizes `10k`, `100k`, and `500k` nodes and prints human-readable benchmark lines.

Example output:

```
PERF_RESULT api=getNodeByProperty(id) size=10000 coldMs=4.8123 warmMedianMs=0.0008 warmP95Ms=0.0053 speedup=6163.2x
```

To output JSON rows and summary instead, run:

```
$ npm run test:perf:json
```

This suite is reporting-only and not intended for CI thresholds, since local hardware and runtime conditions vary.
