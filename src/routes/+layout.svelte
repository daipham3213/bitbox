<script lang="ts">
	import '@xterm/xterm/css/xterm.css';

	import './layout.css';
	import './theme.css';
	import favicon from '$lib/assets/favico.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
