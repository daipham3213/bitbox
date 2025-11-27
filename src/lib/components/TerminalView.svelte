<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	import { Terminal } from '@xterm/xterm';
	import { ClipboardAddon } from '@xterm/addon-clipboard';
	import { FitAddon } from '@xterm/addon-fit';
	import { WebglAddon } from '@xterm/addon-webgl';

	let {
		autofocus = true,
		onInput,
		onSelection,
		terminalRef
	} = $props<{
		autofocus?: boolean;
		onInput?: (data: string) => void;
		onSelection?: (text: string) => void;
		terminalRef?: (t: Terminal) => void;
	}>();

	let container: HTMLDivElement;
	let terminal: Terminal;
	let fitAddon = new FitAddon();
	let webglAddon = new WebglAddon();
	let clipboardAddon = new ClipboardAddon();

	const handleResize = () => {
		try {
			fitAddon.fit();
		} catch {
			/* ignore */
		}
	};

	onMount(() => {
		const bg = getComputedStyle(document.documentElement)
			.getPropertyValue('--color-bg-base')
			.trim();
		terminal = new Terminal({
			cursorBlink: true,
			fontFamily: 'Fira Code, monospace',
			fontSize: 14,
			theme: { background: bg || '#111111' },
			allowProposedApi: true,
			allowTransparency: true
		});
		terminal.loadAddon(webglAddon);
		terminal.loadAddon(fitAddon);
		terminal.loadAddon(clipboardAddon);
		terminal.open(container);
		fitAddon.fit();

		terminal.onData((d) => onInput?.(d));
		terminal.onSelectionChange(() => {
			const selected = terminal.getSelection();
			if (selected) {
				navigator.clipboard.writeText(selected);
				onSelection?.(selected);
			}
		});

		terminalRef?.(terminal);

		window.addEventListener('resize', handleResize);
		if (autofocus) terminal.focus();
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	onDestroy(() => {
		terminal?.dispose();
	});

	export function write(data: string | Uint8Array<ArrayBuffer>) {
		terminal?.write(data);
	}
</script>

<div bind:this={container} class="h-full w-full"></div>

<style>
    /* xterm attaches its own .xterm element dynamically */
    :global(.xterm) {
        height: 100%;
    }
</style>
