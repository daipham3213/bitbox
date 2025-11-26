export class SystemStats {
	netRxBps = $state(0);
	netTxBps = $state(0);
	netRxTotal = $state(0);
	netTxTotal = $state(0);
	wasmHeapMB = $state(0);
	ramConfiguredMB = $state(0);
	guestMemTotalMB = $state(0);
	guestMemAvailMB = $state(0);
	guestMemUsedPct = $state(0);
	lastMeminfoTimestamp = $state(0);
	uptime = $state(0);
	cpuLoad = $state(0);

	private WINDOW_SECONDS = 5;
	private rxBuckets: number[] = Array(5).fill(0);
	private txBuckets: number[] = Array(5).fill(0);
	private currentSecondIndex = 0;
	private bucketStart = Date.now();

	constructor() {
		setInterval(() => this.advanceBuckets(), 500);
	}

	private advanceBuckets() {
		const now = Date.now();
		const elapsed = now - this.bucketStart;
		if (elapsed >= 1000) {
			const steps = Math.floor(elapsed / 1000);
			for (let i = 0; i < steps; i++) {
				this.currentSecondIndex = (this.currentSecondIndex + 1) % this.WINDOW_SECONDS;
				this.rxBuckets[this.currentSecondIndex] = 0;
				this.txBuckets[this.currentSecondIndex] = 0;
			}
			this.bucketStart = now;
			this.recomputeBps();
		}
	}

	private recomputeBps() {
		const rxSum = this.rxBuckets.reduce((a, b) => a + b, 0);
		const txSum = this.txBuckets.reduce((a, b) => a + b, 0);
		this.netRxBps = rxSum / this.WINDOW_SECONDS;
		this.netTxBps = txSum / this.WINDOW_SECONDS;
	}

	recordNetwork(rxBytes?: number, txBytes?: number) {
		this.advanceBuckets();
		if (rxBytes) {
			this.rxBuckets[this.currentSecondIndex] += rxBytes;
			this.netRxTotal += rxBytes;
		}
		if (txBytes) {
			this.txBuckets[this.currentSecondIndex] += txBytes;
			this.netTxTotal += txBytes;
		}
		this.recomputeBps();
	}

	updateWasmMemory(wasmBytes: number, ramConfiguredBytes: number) {
		this.wasmHeapMB = wasmBytes / (1024 * 1024);
		this.ramConfiguredMB = ramConfiguredBytes / (1024 * 1024);
	}

	updateGuestMem(memTotalKB: number, memAvailKB: number) {
		const usedPct = memTotalKB > 0 ? (1 - memAvailKB / memTotalKB) * 100 : 0;
		this.guestMemTotalMB = memTotalKB / 1024;
		this.guestMemAvailMB = memAvailKB / 1024;
		this.guestMemUsedPct = usedPct;
		this.lastMeminfoTimestamp = Date.now();
	}

	fallbackGuestMemFromWasm() {
		if (this.guestMemTotalMB === 0 && this.ramConfiguredMB) {
			this.guestMemTotalMB = this.ramConfiguredMB;
			this.guestMemAvailMB = this.ramConfiguredMB;
			this.guestMemUsedPct = 0;
		}
	}
}
