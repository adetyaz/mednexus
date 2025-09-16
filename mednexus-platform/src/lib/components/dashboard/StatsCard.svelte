<script lang="ts">
	import {
		FileText,
		Upload,
		Share,
		Clock,
		Users,
		Building2,
		User,
		ShieldCheck,
		TrendingUp,
		TrendingDown,
		AlertTriangle,
		MinusIcon
	} from '@lucide/svelte';

	export let title: string;
	export let value: string;
	export let change: string;
	export let changeType: 'positive' | 'negative' | 'neutral' | 'warning' = 'neutral';
	export let icon: string;

	function getIconComponent(iconName: string) {
		const icons: Record<string, any> = {
			document: FileText,
			upload: Upload,
			share: Share,
			clock: Clock,
			users: Users,
			building: Building2,
			user: User,
			shield: ShieldCheck
		};
		return icons[iconName] || FileText;
	}

	function getChangeIcon() {
		switch (changeType) {
			case 'positive':
				return TrendingUp;
			case 'negative':
				return TrendingDown;
			case 'warning':
				return AlertTriangle;
			default:
				return MinusIcon;
		}
	}

	function getChangeColor(): string {
		switch (changeType) {
			case 'positive':
				return 'text-green-600';
			case 'negative':
				return 'text-red-600';
			case 'warning':
				return 'text-yellow-600';
			default:
				return 'text-gray-600';
		}
	}
</script>

<div
	class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
>
	<div class="flex items-center gap-4">
		<div
			class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0"
		>
			<svelte:component this={getIconComponent(icon)} class="w-6 h-6 text-white" />
		</div>
		<div class="flex-1">
			<h3 class="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">{title}</h3>
			<p class="text-2xl font-bold text-gray-900 leading-none mb-2">{value}</p>
			<div class="flex items-center gap-1 text-sm font-medium {getChangeColor()}">
				<svelte:component this={getChangeIcon()} class="w-3 h-3 flex-shrink-0" />
				<span>{change}</span>
			</div>
		</div>
	</div>
</div>

<style>
	@media (max-width: 768px) {
		:global(.stats-card) {
			padding: 1rem;
		}

		:global(.card-content) {
			flex-direction: column;
			text-align: center;
			gap: 0.75rem;
		}

		:global(.icon-container) {
			width: 40px;
			height: 40px;
		}

		:global(.value) {
			font-size: 1.5rem;
		}
	}
</style>
