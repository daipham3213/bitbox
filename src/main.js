import { loadAddons, override } from './terminal';
import { $, formatTimestamp, humanFileSize } from './utils';

const state = {
  started: false,
  terminal: $('terminal'),
  terminal_display_mode: $('terminal').style.display,
  serial: $('serial'),
  emulator_uptime: $('emulator-uptime'),
  emulator_state: $('emulator-state'),
  emulator_state_progress: $('emulator-state-progress'),
  send_file_button: $('emulator-9p-files-send-btn'),
  network_up: $('emulator-nw-up'),
  network_down: $('emulator-nw-down'),
  emulator: null,
  last_tick: 0,
  running_time: 0,
  interval: null,
  bytes_transmitted: [0, 0],
  bytes_received: [0, 0],
};

const onBooting = (e) => {
  if (e.file_name.endsWith('.wasm')) {
    const parts = e.file_name.split('/');
    state.emulator_state.textContent = `fetching ${parts[parts.length - 1]} ...`;
    return;
  }

  if (e.file_index === e.file_count - 1 && e.loaded >= e.total - 2048) {
    // last file is (almost) loaded
    state.emulator_state.textContent = 'booting...';
    return;
  }

  let line = 'downloading image';

  if (typeof e.file_index === 'number' && e.file_count) {
    line += `[${e.file_index + 1}/${e.file_count}] `;
  }

  if (e.total && typeof e.loaded === 'number') {
    const per100 = Math.floor((e.loaded / e.total) * 100);
    if (state.emulator_state_progress) {
      state.emulator_state_progress.style.width = `${Math.min(100, Math.max(0, per100))}%`;
    }
  }

  state.emulator_state.textContent = line;
};

const onUpdateEmulatorInfo = () => {
  // update emulator info on DOM

  // network info
  const trafficIn = state.bytes_received[0] - state.bytes_received[1];
  const trafficOut = state.bytes_transmitted[0] - state.bytes_transmitted[1];
  state.network_up.textContent = `▲ ${humanFileSize(trafficOut, true, 2)}/s`;
  state.network_down.textContent = `▼ ${humanFileSize(trafficIn, true, 2)}/s`;
};

const onSerialOutput = (byte) => {
  const chr = String.fromCharCode(byte);
  if ((chr < ' ' && chr !== '\n' && chr !== '\t') || chr > '~') {
    return;
  }
  if (!state.started) {
    state.started = true;
    state.terminal.style.display = state.terminal_display_mode;
    state.serial.style.display = 'none';

    document
      .querySelectorAll('.is-stats-hidden')
      .forEach((el) => el.classList.remove('is-stats-hidden'));

    document
      .querySelectorAll('#progress-bar')
      .forEach((el) => el.classList.add('is-hidden'));

    loadAddons(state.emulator.serial_adapter.term);

    state.terminal.focus();
    // unregister callback
    state.emulator.remove_listener('serial0-output-byte', onSerialOutput);
  }
};

const onStarted = () => {
  const now = Date.now();
  const deltaTime = now - state.last_tick;

  // capture emulator states
  // uptime
  if (deltaTime) {
    state.running_time += deltaTime;
    state.last_tick = now;
    state.emulator_uptime.textContent = `🟢 ${formatTimestamp((state.running_time / 1000) | 0)}`;
  }

  // network traffic
  state.bytes_received = [state.bytes_received[0], state.bytes_received[0]];
  state.bytes_transmitted = [
    state.bytes_transmitted[0],
    state.bytes_transmitted[0],
  ];
};

const onInitFilesystem = () => {
  console.log('9p filesystem initialized');
  state.send_file_button.addEventListener('change', (event) => {
    Array.from(event.target.files).forEach((file) => {
      const loader = new FileReader();
      loader.onload = (f) => {
        const buffer = f.target.result;
        const path = `/daiplg/${file.name}`;
        return state.emulator.create_file(path, new Uint8Array(buffer));
      };
      loader.readAsArrayBuffer(file);
    });
    event.target.blur();
  });
};

const entry = () => {
  // override terminal defaults
  override();

  // hide terminal and show serial by default
  state.terminal.style.display = 'none';
  state.serial.style.display = 'block';

  // initialize emulator
  const emulator = new window.V86({
    wasm_path: '/v86/v86.wasm',
    acpi: false,
    screen_container: state.serial,
    serial_container_xtermjs: state.terminal,
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
      baseurl: '/flat/',
    },
    autostart: true,
    disable_keyboard: true,
    disable_speaker: true,
    net_device: {
      relay_url: import.meta.env.VITE_NETWORK_RELAY,
      type: 'virtio',
    },
    cmdline: 'tsc=reliable mitigations=off random.trust_cpu=on',
  });

  state.emulator = emulator;
  if (import.meta.env.DEV) {
    window.emulator = emulator;
    window.state = state;
  }

  emulator.add_listener('download-progress', onBooting);
  emulator.add_listener('serial0-output-byte', onSerialOutput);

  emulator.add_listener('emulator-started', () => {
    state.last_tick = Date.now();
    state.interval = setInterval(onStarted, 1000);

    // ensure that current captured state is different from previous
    setTimeout(() => {
      setInterval(onUpdateEmulatorInfo, 1000);
    }, 500);
  });

  emulator.add_listener('eth-receive-end', (args) => {
    state.bytes_received[0] += args[0];
  });
  emulator.add_listener('eth-transmit-end', (args) => {
    state.bytes_transmitted[0] += args[0];
  });

  emulator.add_listener('9p-attach', onInitFilesystem);
};

entry();
