import { loadAddons, override } from './terminal';
import registerUploadFilesModal from './upload-files';

override();

const terminalElement = document.getElementById('terminal');
const serial = document.getElementById('serial');
const state = document.getElementById('emulator-state');

terminalElement.style.display = 'none';
serial.style.display = 'block';

let progressTicks = 0;
window.started = false;

const emulator = new window.V86({
  wasm_path: '/v86/v86.wasm',
  screen_container: serial,
  serial_container_xtermjs: terminalElement,
  memory_size: import.meta.env.VITE_EMULATOR_RAM * 1024 ** 2,
  vga_memory_size: import.meta.env.VITE_EMULATOR_VGA * 1024 ** 2,
  bios: { url: '/bios/seabios.bin' },
  vga_bios: { url: '/bios/vgabios.bin' },
  cdrom: {
    url: import.meta.env.VITE_ROOTFS_ISO,
    async: false,
  },
  filesystem: {
    basefs: '/contents.json',
  },
  autostart: true,
  disable_keyboard: true,
  disable_speaker: true,
  network_relay_url: import.meta.env.VITE_NETWORK_RELAY,
  cmdline: 'tsc=reliable mitigations=off random.trust_cpu=on',
});

if (import.meta.env.DEV) {
  window.emulator = emulator;
}

emulator.add_listener('serial0-output-byte', (byte) => {
  const char = String.fromCharCode(byte);

  if (char === '$' || char === '#' || char === ':') {
    if (!window.started) {
      window.started = true;
      terminalElement.style.display = 'block';
      serial.style.display = 'none';
      state.textContent = '';

      loadAddons(emulator.serial_adapter.term);
      registerUploadFilesModal({ emulator });
      terminalElement.focus();
    }
  }
});

const showProgress = (e) => {
  const el = state;
  el.style.display = 'block';

  if (e.file_name.endsWith('.wasm')) {
    const parts = e.file_name.split('/');
    el.textContent = `Fetching ${parts[parts.length - 1]} ...`;
    return;
  }

  if (e.file_index === e.file_count - 1 && e.loaded >= e.total - 2048) {
    // last file is (almost) loaded
    el.textContent = 'Done downloading. Starting now ...';
    return;
  }

  let line = 'Downloading images ';

  if (typeof e.file_index === 'number' && e.file_count) {
    line += `[${e.file_index + 1}/${e.file_count}] `;
  }

  if (e.total && typeof e.loaded === 'number') {
    let per100 = Math.floor((e.loaded / e.total) * 100);
    per100 = Math.min(100, Math.max(0, per100));

    const per50 = Math.floor(per100 / 2);

    line += `${per100}% [`;
    line += '#'.repeat(per50);
    line += `${' '.repeat(50 - per50)}]`;
  } else {
    // eslint-disable-next-line no-plusplus
    line += '.'.repeat(progressTicks++ % 50);
  }

  el.textContent = line;
};

emulator.add_listener('download-progress', showProgress);
