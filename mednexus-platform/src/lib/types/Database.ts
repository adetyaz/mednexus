// Database types for Supabase medical_institutions table
export interface Database {
	public: {
		Tables: {
			medical_institutions: {
				Row: {
					id: string;
					name: string;
					country: string;
					address: string | null;
					license_number: string;
					license_prefix: string | null;
					accreditation: string | null;
					phone: string | null;
					email: string | null;
					emergency_contact: string | null;
					wallet_address: string | null;
					transaction_hash: string | null;
					blockchain_registered: boolean;
					verified_by: string | null;
					verification_date: string | null;
					departments: string | null;
					region: string;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					name: string;
					country: string;
					address?: string | null;
					license_number: string;
					license_prefix?: string | null;
					accreditation?: string | null;
					phone?: string | null;
					email?: string | null;
					emergency_contact?: string | null;
					wallet_address?: string | null;
					transaction_hash?: string | null;
					blockchain_registered?: boolean;
					verified_by?: string | null;
					verification_date?: string | null;
					departments?: string | null;
					region: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					country?: string;
					address?: string | null;
					license_number?: string;
					license_prefix?: string | null;
					accreditation?: string | null;
					phone?: string | null;
					email?: string | null;
					emergency_contact?: string | null;
					wallet_address?: string | null;
					transaction_hash?: string | null;
					blockchain_registered?: boolean;
					verified_by?: string | null;
					verification_date?: string | null;
					departments?: string | null;
					region?: string;
					created_at?: string;
					updated_at?: string;
				};
			};
		};
	};
}