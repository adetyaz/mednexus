<script lang="ts">
	import type { ComplianceStatus } from '$lib/types/dashboard';
	import { CheckCircle, AlertTriangle, XCircle, FileText, CalendarDays } from '@lucide/svelte';

	export let status: ComplianceStatus;

	function getComplianceColor(compliance: string): string {
		switch (compliance) {
			case 'compliant':
				return 'bg-green-100 text-green-600';
			case 'warning':
				return 'bg-orange-100 text-orange-600';
			case 'violation':
				return 'bg-red-100 text-red-600';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	function getComplianceIcon(compliance: string) {
		switch (compliance) {
			case 'compliant':
				return CheckCircle;
			case 'warning':
				return AlertTriangle;
			case 'violation':
				return XCircle;
			default:
				return CheckCircle;
		}
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getDaysUntilAudit(nextAudit: Date): number {
		const now = new Date();
		const diffTime = nextAudit.getTime() - now.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	}
</script>

<div class="p-0">
	<div class="mb-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-2">Compliance Overview</h3>
		<p class="text-sm text-gray-600">
			Monitor regulatory compliance status across HIPAA and GDPR requirements
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
		<!-- HIPAA Status -->
		<div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-lg flex items-center justify-center {getComplianceColor(
						status.hipaa
					)}"
				>
					<svelte:component this={getComplianceIcon(status.hipaa)} class="w-5 h-5" />
				</div>
				<div>
					<h4 class="text-sm font-semibold text-gray-900">HIPAA</h4>
					<p class="text-xs text-gray-600">Health Insurance Portability and Accountability Act</p>
				</div>
			</div>
			<div
				class="px-3 py-1 rounded-full text-xs font-medium capitalize {getComplianceColor(
					status.hipaa
				)}"
			>
				{status.hipaa}
			</div>
		</div>

		<!-- GDPR Status -->
		<div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-lg flex items-center justify-center {getComplianceColor(
						status.gdpr
					)}"
				>
					<svelte:component this={getComplianceIcon(status.gdpr)} class="w-5 h-5" />
				</div>
				<div>
					<h4 class="text-sm font-semibold text-gray-900">GDPR</h4>
					<p class="text-xs text-gray-600">General Data Protection Regulation</p>
				</div>
			</div>
			<div
				class="px-3 py-1 rounded-full text-xs font-medium capitalize {getComplianceColor(
					status.gdpr
				)}"
			>
				{status.gdpr}
			</div>
		</div>
	</div>

	<div class="bg-gray-50 rounded-lg p-4 mb-6">
		<div class="space-y-3">
			<div class="flex justify-between items-center">
				<span class="text-sm text-gray-600 font-medium">Last Audit</span>
				<span class="text-sm font-semibold text-gray-900">{formatDate(status.lastAudit)}</span>
			</div>
			<div class="flex justify-between items-center">
				<span class="text-sm text-gray-600 font-medium">Next Audit</span>
				<div class="flex items-center gap-2">
					<span class="text-sm font-semibold text-gray-900">{formatDate(status.nextAudit)}</span>
					<span class="text-xs text-gray-500">({getDaysUntilAudit(status.nextAudit)} days)</span>
				</div>
			</div>
		</div>
	</div>

	<div class="flex gap-3">
		<button
			class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
		>
			<FileText class="w-4 h-4" />
			View Compliance Report
		</button>
		<button
			class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
		>
			<CalendarDays class="w-4 h-4" />
			Schedule Audit
		</button>
	</div>
</div>
