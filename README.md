# Timey wimey extension repo

This repo is split into two parts for the convenience of vscode's webview api and `vsce` package support.

1. The frontend uses `pnpm` as a package manager. You can `pnpm build` to build the frontend into a single minified html file and automatically export it to the `extension/` folder
1. The extension folder holds the rest of the extension and uses `npm` as a package manager. You can use `npm run compile` to compile and export the frontend and then compile the extension itself
