import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	plugins: [
		tailwindcss(), 
		sveltekit(),
		nodePolyfills({
			include: ['crypto', 'buffer', 'stream', 'util', 'events']
		})
	]
});
