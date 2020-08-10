1. Install [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
	- This requires a `Rustup` installation which can be downloaded [here](https://www.rust-lang.org/tools/install).
2. Build the sources in the project's root directory: 

```
wasm-pack build --target web
```

3. Start a local HTTP server of your choice such as Python3's http.server:

```
python3 -m http.server
```

Alternatively, the analyses may be performed on our server which can be found [here](https://trudi.weizenbaum-institut.de/stellar_analysis.html).

The analyses performed here are powered by the [fbas_analyzer](https://github.com/wiberlin/fbas_analyzer) tool/library.
