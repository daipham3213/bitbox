import { FitAddon } from '@xterm/addon-fit';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { Terminal } from '@xterm/xterm';

const override = () => {
  class BitBoxTerminal extends Terminal {
    constructor(options) {
      const defaultOptions = {
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, monospace',
        theme: {
          background: '#161618',
          foreground: '#f0f0f0',
          cursor: '#f0f0f0',
          selectionBackground: '#44475a',
          black: '#21222C',
          brightBlack: '#6272A4',
        },
        // Tell xterm how many rows/cols (FitAddon will adjust this)
        rows: 30,
        cols: 80,
        allowProposedApi: true,
      };
      super({ ...defaultOptions, ...options });
    }
  }
  window.Terminal = BitBoxTerminal;
};

/**
 *
 * @param {Terminal} terminal
 */
const onSelectionChange = (terminal) => {
  terminal.onSelectionChange(() => {
    const selectedText = terminal.getSelection();
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
    }
  });
  terminal.onData((data) => {
    if (data === '\x03') {
      terminal.clearSelection();
    }
  });
  terminal.onKey((e) => {
    if (e.domEvent.key === 'Escape') {
      terminal.clearSelection();
    }
  });
};

/**
 *
 * @param {Terminal} terminal
 * @returns
 */
const loadAddons = (terminal) => {
  const fitAddon = new FitAddon();
  const unicode11Addon = new Unicode11Addon();
  const clipboardAddon = new ClipboardAddon();

  terminal.loadAddon(fitAddon);
  terminal.loadAddon(unicode11Addon);
  terminal.loadAddon(clipboardAddon);

  document.addEventListener('DOMContentLoaded', () => {
    fitAddon.fit();
  });

  // eslint-disable-next-line no-param-reassign
  terminal.unicode.activeVersion = '11';
  terminal.onSelectionChange(() => onSelectionChange(terminal));
  return {
    fitAddon,
  };
};
export { loadAddons, override };
