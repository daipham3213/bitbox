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
        allowProposedApi: true,
        theme: {
          background: '#282C34', // Main terminal background
          foreground: '#ABB2BF', // Default text color
          cursor: '#ABB2BF', // Cursor color
          selectionBackground: '#61AFEF', // Highlight selection
          blue: '#61AFEF', // For prompts if needed
          green: '#98C379', // For prompts if needed
          yellow: '#E5C07B', // For commands if needed
        },
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

  fitAddon.fit();
  window.addEventListener('resize', () => {
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
