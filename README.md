# BitBox - Run VM in your browser

BitBox is linux shell in your browser by the power of WASM and [v86](https://github.com/copy/v86). It is a simple
application that allows you to run a linux shell in your browser. It is useful for running simple commands and testing
out things.

The VM image is based on [buildroot](https://buildroot.org/) - a minimal linux image with busybox and a few other
utilities. You can find my configuration for buildroot in
the [bitbox-buildroot](https://github.com/daipham3213/bitbox-buildroot)
repository.

## Libraries and tools used

- [v86](https://github.com/copy/v86)
- [xterm.js](https://github.com/xtermjs/xterm.js)
- [tailwindcss](https://tailwindcss.com/)
- [bun](https://bun.sh)
- [vite](https://vitejs.dev/)

# Requirements

- [bun](https://bun.sh)

# How to run

1. Clone this repository
    ```bash
    git clone
    ```
2. Install dependencies
    ```bash
    bun install
    ```
3. Run the server
    ```bash
    bun run dev
    ```
4. After that, a new tab will be opened in your browser with the application running.
5. Enjoy!

# Limitations

- It's a bit slow. It is fine for running simple programs but as soon as you try to run anything that requires cpu it
  will slow down immensely because the cpu is emulated by v86.
- No reliable package manager.

# Internet

- This VM uses copy's proxy for internet which is rate limited and does not support https
- Try not to use it. Instead, consider either manually uploading files or using your own proxy.
