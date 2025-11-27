<script lang="ts" xmlns="">
	import { onDestroy, onMount } from 'svelte';
	import SystemStats from '$lib/components/SystemStats.svelte';
	import TerminalView from '$lib/components/TerminalView.svelte';
	import Folder from '$lib/components/Folder.svelte';

	import { V86Controller } from '$lib/stores/V86Controller.svelte.js';
	import { SystemStats as SystemStatsClass } from '$lib/stores/SystemStats.svelte';

	let terminalComponent: TerminalView;
	const systemStats = new SystemStatsClass();

	const memorySize = 128 * 1024 * 1024; // 128MB

	const emulator = new V86Controller({
		memorySizeBytes: memorySize,
		wasmPath: 'v86/v86.wasm',
		biosPath: 'bios/seabios.bin',
		vgaBiosPath: 'bios/vgabios.bin',
		bzImagePath: 'bitbox-bzimage.bin',
		relayUrl: 'https://wsnic.port0.org/',
		autostart: true,
		cmdline: 'tsc=reliable mitigations=off random.trust_cpu=on console=hvc0'
	});

	let showToast = $state(false);
	let toastMessage = $state('');
	let isDragging = $state(false);

	function terminalWrite(data: Uint8Array<ArrayBuffer>) {
		terminalComponent?.write(data);
	}

	function requestMeminfo() {
		// Logic for requesting meminfo can be added to V86Controller if needed
	}

	function handleSelection() {
		toastMessage = 'Copied to clipboard!';
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 2000);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		// Handle file drop logic here (e.g., upload to v86)
		toastMessage = 'File upload not implemented yet';
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 2000);
	}

	onMount(() => {
		emulator.init(terminalWrite, systemStats);
	});

	onDestroy(() => {
		emulator.destroy();
	});
</script>

<div
	class="flex flex-col h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-base)] font-mono overflow-hidden items-center justify-center relative"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="application"
>
	<!-- Main Container (Responsive) -->
	<div
		class="flex flex-col w-full h-full md:w-[900px] md:h-[600px] bg-[var(--color-bg-surface)] md:rounded-lg md:shadow-2xl md:border md:border-[var(--color-border)] overflow-hidden relative"
	>
		<!-- Top Bar / Window Decoration -->
		<div
			class="h-8 bg-[var(--color-bg-surface-dim)] border-b border-[var(--color-border)] flex items-center justify-between px-4 select-none shrink-0"
		>
			<div class="flex items-center space-x-2">
				<div class="w-3 h-3 rounded-full bg-[var(--color-accent-red)]"></div>
				<div class="w-3 h-3 rounded-full bg-[var(--color-accent-yellow)]"></div>
				<div class="w-3 h-3 rounded-full bg-[var(--color-accent-green)]"></div>
			</div>
			<div class="text-xs text-[var(--color-text-muted)] font-bold tracking-wider">
				BITBOX-V86 // TERMINAL
			</div>
			<div class="flex items-center space-x-3">
				<div class="text-xs text-[var(--color-text-subtle)] mr-2">{emulator.statusText}</div>
				<!-- Folder Button -->
				<button
					class="group relative p-1 rounded hover:bg-[var(--color-border)] transition-colors text-[var(--color-accent-blue)] hover:text-[var(--color-text-base)] hover:shadow-[var(--shadow-glow-blue)] cursor-pointer"
				>
					<Folder />
					<!-- Tooltip -->
					<div
						class="absolute top-full right-0 mt-2 px-2 py-1 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded text-[10px] text-[var(--color-text-base)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50"
					>
						Send Files
					</div>
				</button>
			</div>
		</div>

		<!-- Terminal Area -->
		<div class="flex-1 relative bg-[var(--color-bg-surface)]/50 min-h-0 p-1">
			<TerminalView
				bind:this={terminalComponent}
				onInput={(d) => emulator.sendInput(d)}
				onSelection={handleSelection}
			/>

			{#if emulator.loading}
				<div
					class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--color-bg-overlay-dark)] backdrop-blur-sm"
				>
					<div class="mb-6 text-2xl font-bold text-[var(--color-text-base)] tracking-widest">
						INITIALIZING SYSTEM
					</div>
					<div class="w-64 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
						<div
							class="h-full bg-[var(--color-accent-blue)] transition-all duration-300 ease-out"
							style={`width:${emulator.progress}%`}
						></div>
					</div>
					<div class="mt-4 text-xs text-[var(--color-text-muted)] font-mono">
						{emulator.statusText}
					</div>
				</div>
			{/if}

			<!-- Drag & Drop Overlay -->
			{#if isDragging}
				<div
					class="absolute inset-0 z-20 flex items-center justify-center bg-[var(--color-bg-overlay)] backdrop-blur-md border-2 border-dashed border-[var(--color-accent-blue)] m-4 rounded-lg pointer-events-none"
				>
					<div
						class="text-[var(--color-accent-blue)] text-xl font-bold tracking-widest animate-pulse"
					>
						DROP FILES TO UPLOAD
					</div>
				</div>
			{/if}
		</div>

		<!-- Bottom Status Bar -->
		<SystemStats {systemStats} {requestMeminfo} />
	</div>

	<!-- Toast Notification -->
	{#if showToast}
		<div
			class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-accent-blue)] rounded shadow-[var(--shadow-glow-blue-lg)] text-[var(--color-text-base)] text-sm font-mono z-50 animate-fade-in-up"
		>
			{toastMessage}
		</div>
	{/if}
</div>
