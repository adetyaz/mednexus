<script lang="ts">
	import type { Department } from '$lib/services/medicalInstitutionService';
	import { supabase } from '$lib/supabase';
	import { Plus, X, Save, Trash2, Edit } from '@lucide/svelte';

	let {
		departments = [],
		institutionId,
		isOpen = $bindable(false),
		ondepartmentadded,
		ondepartmentupdated,
		onclose
	} = $props<{
		departments: Department[];
		institutionId: string; // This is the institution.id from the database
		isOpen?: boolean;
		ondepartmentadded?: () => void;
		ondepartmentupdated?: (department: Department) => void;
		onclose?: () => void;
	}>();
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);

	// Form state for adding new department
	let newDepartment = $state({
		name: '',
		headOfDepartment: '',
		specialties: ['']
	});

	// Edit mode
	let editingDepartment = $state<Department | null>(null);
	let editForm = $state({
		name: '',
		headOfDepartment: '',
		specialties: ['']
	});

	function openAddDepartment() {
		newDepartment = {
			name: '',
			headOfDepartment: '',
			specialties: ['']
		};
		error = null;
		success = null;
	}

	function addSpecialty() {
		newDepartment.specialties = [...newDepartment.specialties, ''];
	}

	function removeSpecialty(index: number) {
		newDepartment.specialties = newDepartment.specialties.filter((_, i) => i !== index);
	}

	function addEditSpecialty() {
		editForm.specialties = [...editForm.specialties, ''];
	}

	function removeEditSpecialty(index: number) {
		editForm.specialties = editForm.specialties.filter((_, i) => i !== index);
	}

	async function saveDepartment() {
		try {
			isLoading = true;
			error = null;

			// Filter out empty specialties
			const validSpecialties = newDepartment.specialties.filter((s) => s.trim() !== '');

			if (!newDepartment.name.trim()) {
				throw new Error('Department name is required');
			}

			if (validSpecialties.length === 0) {
				throw new Error('At least one specialty is required');
			}

			// Get current institution data
			const { data: institution, error: fetchError } = await (supabase as any)
				.from('medical_institutions')
				.select('departments')
				.eq('id', institutionId)
				.single();

			if (fetchError) {
				throw new Error('Failed to fetch institution data');
			}

			// Parse existing departments
			let currentDepartments = institution.departments || [];
			if (typeof currentDepartments === 'string') {
				try {
					currentDepartments = JSON.parse(currentDepartments);
				} catch {
					currentDepartments = [];
				}
			}

			// Add new department
			const newDept = {
				id: `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				name: newDepartment.name.trim(),
				headOfDepartment: newDepartment.headOfDepartment.trim() || undefined,
				specialties: validSpecialties
			};

			currentDepartments.push(newDept);

			// Update institution with new departments
			const { error: updateError } = await (supabase as any)
				.from('medical_institutions')
				.update({ departments: currentDepartments })
				.eq('id', institutionId);

			if (updateError) {
				throw new Error('Failed to save department');
			}

			success = 'Department added successfully!';
			ondepartmentadded?.();

			// Reset form
			openAddDepartment();

			// Clear success message after 3 seconds
			setTimeout(() => {
				success = null;
			}, 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add department';
		} finally {
			isLoading = false;
		}
	}

	function startEdit(department: Department) {
		editingDepartment = department;
		editForm = {
			name: department.name,
			headOfDepartment: department.headOfDepartment || '',
			specialties: [...department.specialties]
		};
	}

	function cancelEdit() {
		editingDepartment = null;
		editForm = {
			name: '',
			headOfDepartment: '',
			specialties: ['']
		};
	}

	async function saveEdit() {
		if (!editingDepartment) return;

		try {
			isLoading = true;
			error = null;

			// Filter out empty specialties
			const validSpecialties = editForm.specialties.filter((s) => s.trim() !== '');

			if (!editForm.name.trim()) {
				throw new Error('Department name is required');
			}

			if (validSpecialties.length === 0) {
				throw new Error('At least one specialty is required');
			}

			// Update the department (you'll need to implement updateDepartment in the service)
			// For now, we'll just update locally
			const updatedDepartment: Department = {
				...editingDepartment,
				name: editForm.name.trim(),
				headOfDepartment: editForm.headOfDepartment.trim() || undefined,
				specialties: validSpecialties
			};

			ondepartmentupdated?.(updatedDepartment);
			success = 'Department updated successfully!';
			cancelEdit();

			// Clear success message after 3 seconds
			setTimeout(() => {
				success = null;
			}, 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update department';
		} finally {
			isLoading = false;
		}
	}

	function closeModal() {
		isOpen = false;
		onclose?.();
	}
</script>

{#if isOpen}
	<!-- Modal Backdrop -->
	<div
		class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Modal Content -->
		<div
			class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between p-6 border-b">
				<h2 class="text-2xl font-bold text-gray-900">Manage Departments</h2>
				<button onclick={closeModal} class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
				<!-- Success/Error Messages -->
				{#if success}
					<div class="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
						{success}
					</div>
				{/if}

				{#if error}
					<div class="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
						{error}
					</div>
				{/if}

				<!-- Add New Department Section -->
				<div class="mb-8">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Add New Department</h3>

					<div class="bg-gray-50 p-4 rounded-lg space-y-4">
						<!-- Department Name -->
						<div>
							<label for="dept-name" class="block text-sm font-medium text-gray-700 mb-1">
								Department Name *
							</label>
							<input
								id="dept-name"
								type="text"
								bind:value={newDepartment.name}
								placeholder="e.g., Cardiology, Emergency Medicine"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<!-- Head of Department -->
						<div>
							<label for="dept-head" class="block text-sm font-medium text-gray-700 mb-1">
								Head of Department
							</label>
							<input
								id="dept-head"
								type="text"
								bind:value={newDepartment.headOfDepartment}
								placeholder="Dr. John Smith (optional)"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<!-- Specialties -->
						<div>
							<label for="specialties" class="block text-sm font-medium text-gray-700 mb-1">
								Specialties *
							</label>
							<div class="space-y-2">
								{#each newDepartment.specialties as specialty, index}
									<div class="flex gap-2">
										<input
											type="text"
											bind:value={newDepartment.specialties[index]}
											placeholder="e.g., Interventional Cardiology"
											class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
										{#if newDepartment.specialties.length > 1}
											<button
												onclick={() => removeSpecialty(index)}
												class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											>
												<Trash2 class="w-4 h-4" />
											</button>
										{/if}
									</div>
								{/each}
								<button
									onclick={addSpecialty}
									class="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
								>
									<Plus class="w-4 h-4" />
									Add Specialty
								</button>
							</div>
						</div>

						<!-- Save Button -->
						<div class="flex justify-end">
							<button
								onclick={saveDepartment}
								disabled={isLoading}
								class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{#if isLoading}
									<div
										class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
									></div>
								{:else}
									<Save class="w-4 h-4" />
								{/if}
								Save Department
							</button>
						</div>
					</div>
				</div>

				<!-- Existing Departments List -->
				<div>
					<h3 class="text-lg font-semibold text-gray-900 mb-4">
						Existing Departments ({departments.length})
					</h3>

					{#if departments.length === 0}
						<div class="text-center py-8 text-gray-500">
							<p>No departments added yet. Create your first department above.</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each departments as department}
								<div class="border border-gray-200 rounded-lg p-4">
									{#if editingDepartment?.departmentId === department.departmentId}
										<!-- Edit Mode -->
										<div class="space-y-4">
											<div>
												<label
													for="edit-dept-name"
													class="block text-sm font-medium text-gray-700 mb-1"
												>
													Department Name *
												</label>
												<input
													id="edit-dept-name"
													type="text"
													bind:value={editForm.name}
													class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
												/>
											</div>

											<div>
												<label
													for="edit-dept-head"
													class="block text-sm font-medium text-gray-700 mb-1"
												>
													Head of Department
												</label>
												<input
													id="edit-dept-head"
													type="text"
													bind:value={editForm.headOfDepartment}
													class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
												/>
											</div>

											<div>
												<label
													for="edit-specialties"
													class="block text-sm font-medium text-gray-700 mb-1"
												>
													Specialties *
												</label>
												<div class="space-y-2">
													{#each editForm.specialties as specialty, index}
														<div class="flex gap-2">
															<input
																type="text"
																bind:value={editForm.specialties[index]}
																class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
															/>
															{#if editForm.specialties.length > 1}
																<button
																	onclick={() => removeEditSpecialty(index)}
																	class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
																>
																	<Trash2 class="w-4 h-4" />
																</button>
															{/if}
														</div>
													{/each}
													<button
														onclick={addEditSpecialty}
														class="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
													>
														<Plus class="w-4 h-4" />
														Add Specialty
													</button>
												</div>
											</div>

											<div class="flex justify-end gap-2">
												<button
													onclick={cancelEdit}
													class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
												>
													Cancel
												</button>
												<button
													onclick={saveEdit}
													disabled={isLoading}
													class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
												>
													{#if isLoading}
														<div
															class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
														></div>
													{:else}
														<Save class="w-4 h-4" />
													{/if}
													Save Changes
												</button>
											</div>
										</div>
									{:else}
										<!-- View Mode -->
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<h4 class="text-lg font-semibold text-gray-900 mb-2">
													{department.name}
												</h4>

												{#if department.headOfDepartment}
													<p class="text-sm text-gray-600 mb-2">
														<span class="font-medium">Head:</span>
														{department.headOfDepartment}
													</p>
												{/if}

												<p class="text-sm text-gray-600 mb-2">
													<span class="font-medium">Doctors:</span>
													{department.doctorCount}
												</p>

												<div class="mb-2">
													<span class="text-sm font-medium text-gray-700">Specialties:</span>
													<div class="flex flex-wrap gap-1 mt-1">
														{#each department.specialties as specialty}
															<span
																class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
															>
																{specialty}
															</span>
														{/each}
													</div>
												</div>
											</div>

											<button
												onclick={() => startEdit(department)}
												class="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
											>
												<Edit class="w-4 h-4" />
												Edit
											</button>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
