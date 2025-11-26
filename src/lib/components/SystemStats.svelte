<script lang="ts">
	import { SystemStats } from '$lib/stores/SystemStats.svelte';

	let { systemStats, requestMeminfo = () => {} } = $props<{
		systemStats: SystemStats;
		requestMeminfo?: () => void;
	}>();

	function formatRate(bps: number) {
		if (bps < 1024) return `${bps.toFixed(0)} B/s`;
		if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(1)} KB/s`;
		return `${(bps / 1024 / 1024).toFixed(2)} MB/s`;
	}

	function formatBytesMB(mb: number) {
		return mb.toFixed(0) + 'M';
	}

	function formatUptime(seconds: number) {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		if (h > 0) return `${h}h ${m}m`;
		if (m > 0) return `${m}m ${s}s`;
		return `${s}s`;
	}
</script>

<div
	class="w-full bg-[var(--color-bg-surface)]/90 backdrop-blur-md border-t border-[var(--color-border)] text-[var(--color-text-base)] font-mono text-xs py-1 px-4 flex items-center justify-between select-none"
>
	<div class="flex items-center space-x-4">
		<div class="flex items-center space-x-2">
			<span class="text-[var(--color-accent-blue)]">CPU</span>
			<span>{systemStats.cpuLoad.toFixed(1)}%</span>
		</div>
		<div class="flex items-center space-x-2">
			<span class="text-[var(--color-accent-green)]">RAM</span>
			<span
				>{formatBytesMB(systemStats.guestMemAvailMB)}/{formatBytesMB(
					systemStats.guestMemTotalMB
				)}</span
			>
		</div>
		<div class="flex items-center space-x-2">
			<span class="text-[var(--color-accent-yellow)]">UP</span>
			<span>{formatUptime(systemStats.uptime)}</span>
		</div>
	</div>

	<div class="flex items-center space-x-4">
		<div class="flex items-center space-x-2">
			<span class="text-[var(--color-accent-orange)]">NET</span>
			<span class="flex items-center space-x-1">
				<span>↓ {formatRate(systemStats.netRxBps)}</span>
				<span class="text-[var(--color-text-dim)]">|</span>
				<span>↑ {formatRate(systemStats.netTxBps)}</span>
			</span>
		</div>
		<button
			onclick={requestMeminfo}
			class="hover:text-[var(--color-accent-teal)] transition-colors"
			title="Probe Memory"
		>
			[PROBE]
		</button>
	</div>
</div>
