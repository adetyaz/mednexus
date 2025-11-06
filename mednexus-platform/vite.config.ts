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
	],
	build: {
		rollupOptions: {
			external: (id) => {
				// External Node.js modules that shouldn't be bundled
				if (id === 'child_process' || id === 'fs' || id === 'fs/promises' || id === 'path') {
					return true;
				}
				return false;
			}
		}
	},
	// Prevent server-only 0G packages from being optimized/bundled into the browser build
	optimizeDeps: {
		exclude: ['@0glabs/0g-ts-sdk', '@0glabs/0g-serving-broker']
	},
	ssr: {
		// treat 0G packages as external during SSR so Vite doesn't try to bundle their Node-only modules for the browser
		external: ['@0glabs/0g-ts-sdk', '@0glabs/0g-serving-broker'],
		noExternal: []
	},
	define: {
		global: 'globalThis',
	}
});
