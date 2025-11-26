import { V86 } from '$lib/v86';
import type { SystemStats } from '$lib/stores/SystemStats.svelte';

export class V86Controller {
	v86: V86 | null = null;
	loading = $state(true);
	progress = $state(0);
	statusText = $state('Initializing...');

	private memorySize: number;
	private options: any;
	private systemStats: SystemStats | null = null;

	private startTime = 0;
	private lastInstructionCounter = 0;
	private lastPollTime = 0;

	constructor(options: any) {
		this.options = options;
		this.memorySize = options.memorySizeBytes || 128 * 1024 * 1024;
	}

	init(terminalWrite: (data: Uint8Array) => void, stats: SystemStats) {
		this.systemStats = stats;
		this.v86 = new V86({
			memory_size: this.memorySize,
			vga_memory_size: 16 * 1024 * 1024,
			wasm_path: this.options.wasmPath || 'v86/v86.wasm',
			bios: { url: this.options.biosPath || 'bios/seabios.bin' },
			vga_bios: { url: this.options.vgaBiosPath || 'bios/vgabios.bin' },
			bzimage: this.options.bzImagePath
				? { url: this.options.bzImagePath, async: true }
				: undefined,
			autostart: this.options.autostart ?? true,
			disable_keyboard: true,
			disable_mouse: true,
			disable_speaker: true,
			virtio_console: true,
			net_device: {
				relay_url: this.options.relayUrl || 'https://wsnic.port0.org/',
				type: 'virtio'
			},
			cmdline: this.options.cmdline || 'tsc=reliable mitigations=off random.trust_cpu=on'
		});

		(window as any).v86 = this.v86;

		this.v86.add_listener('serial0-output-byte', (e: unknown) => {
			terminalWrite(Uint8Array.of(e as number));
		});

		this.v86.add_listener('download-progress', (e: unknown) => {
			const progressEvent = e as any;
			if (progressEvent.total) {
				this.progress = (progressEvent.loaded / progressEvent.total) * 100;
				this.statusText = `Downloading resources... ${Math.round(this.progress)}%`;
			}
		});

		this.v86.add_listener('emulator-ready', () => {
			this.statusText = 'Booting...';
			setTimeout(() => {
				this.loading = false;
			}, 1500);

			this.startTime = Date.now();
			this.lastInstructionCounter = 0;
			this.lastPollTime = Date.now();

			setInterval(() => {
				this.updateStats();
			}, 1000);
		});
	}

	private updateStats() {
		if (!this.v86 || !this.systemStats) return;

		const now = Date.now();
		const currentInstructions = this.v86.get_instruction_counter();

		// Uptime
		this.systemStats.uptime = Math.floor((now - this.startTime) / 1000);

		// CPU Load (approximate based on instructions per second)
		// Assuming ~500M IPS is "100%" for a WASM core
		const timeDelta = (now - this.lastPollTime) / 1000;
		if (timeDelta > 0) {
			const instructionsDelta = currentInstructions - this.lastInstructionCounter;
			const ips = instructionsDelta / timeDelta;
			this.systemStats.cpuLoad = Math.min(100, (ips / 500_000_000) * 100);
		}

		this.lastInstructionCounter = currentInstructions;
		this.lastPollTime = now;
	}

	destroy() {
		if (this.v86) {
			this.v86.destroy();
			this.v86 = null;
		}
	}

	sendInput(data: string) {
		this.v86?.serial0_send(data);
	}
}
