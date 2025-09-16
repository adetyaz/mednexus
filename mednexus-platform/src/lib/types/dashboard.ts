// Dashboard Types and Interfaces
// Proper naming for role-based access control and dashboard structures

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  level: number; // Higher number = more permissions
}

export interface Permission {
  id: string;
  name: string;
  resource: string; // e.g., 'documents', 'patients', 'staff'
  action: string; // e.g., 'read', 'write', 'delete', 'share'
  scope: 'own' | 'department' | 'institution' | 'global';
}

export interface DashboardUser {
  walletAddress: string;
  role: UserRole;
  institutionId: string;
  departmentId?: string;
  profile: {
    name: string;
    email: string;
    specialty?: string;
    licenseNumber: string;
  };
  lastLogin: Date;
  isActive: boolean;
}

export interface DashboardStats {
  totalDocuments: number;
  documentsThisMonth: number;
  sharedDocuments: number;
  pendingApprovals: number;
  storageUsed: string;
  storageLimit: string;
}

export interface DoctorDashboardData {
  user: DashboardUser;
  stats: DashboardStats;
  recentDocuments: DocumentSummary[];
  pendingTasks: Task[];
  consultations: Consultation[];
  departmentActivity: Activity[];
}

export interface HospitalDashboardData {
  user: DashboardUser;
  stats: HospitalStats;
  departments: DepartmentSummary[];
  staff: StaffSummary[];
  recentActivity: Activity[];
  complianceStatus: ComplianceStatus;
}

export interface DocumentSummary {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  status: 'active' | 'shared' | 'archived';
  size: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Consultation {
  id: string;
  patientId: string;
  specialty: string;
  status: 'requested' | 'active' | 'completed';
  requestedDate: Date;
  doctorName: string;
}

export interface Activity {
  id: string;
  type: 'upload' | 'share' | 'access' | 'consultation';
  description: string;
  timestamp: Date;
  user: string;
}

export interface HospitalStats extends DashboardStats {
  totalStaff: number;
  activeDepartments: number;
  totalPatients: number;
  complianceScore: number;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  staffCount: number;
  documentCount: number;
  activeConsultations: number;
  headDoctor: string;
}

export interface StaffSummary {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  lastActivity: Date;
}

export interface ComplianceStatus {
  hipaa: 'compliant' | 'warning' | 'violation';
  gdpr: 'compliant' | 'warning' | 'violation';
  lastAudit: Date;
  nextAudit: Date;
}

// Predefined roles with proper permissions
export const USER_ROLES: Record<string, UserRole> = {
  hospital_admin: {
    id: 'hospital_admin',
    name: 'Hospital Administrator',
    description: 'Full access to hospital management and all departments',
    level: 100,
    permissions: [
      { id: 'manage_staff', name: 'Manage Staff', resource: 'staff', action: 'write', scope: 'institution' },
      { id: 'manage_departments', name: 'Manage Departments', resource: 'departments', action: 'write', scope: 'institution' },
      { id: 'view_all_documents', name: 'View All Documents', resource: 'documents', action: 'read', scope: 'institution' },
      { id: 'manage_compliance', name: 'Manage Compliance', resource: 'compliance', action: 'write', scope: 'institution' },
      { id: 'approve_documents', name: 'Approve Documents', resource: 'documents', action: 'approve', scope: 'institution' }
    ]
  },

  department_head: {
    id: 'department_head',
    name: 'Department Head',
    description: 'Manage department operations and staff',
    level: 80,
    permissions: [
      { id: 'manage_dept_staff', name: 'Manage Department Staff', resource: 'staff', action: 'write', scope: 'department' },
      { id: 'view_dept_documents', name: 'View Department Documents', resource: 'documents', action: 'read', scope: 'department' },
      { id: 'approve_dept_docs', name: 'Approve Department Documents', resource: 'documents', action: 'approve', scope: 'department' },
      { id: 'manage_consultations', name: 'Manage Consultations', resource: 'consultations', action: 'write', scope: 'department' }
    ]
  },

  senior_doctor: {
    id: 'senior_doctor',
    name: 'Senior Doctor',
    description: 'Senior medical professional with extended permissions',
    level: 60,
    permissions: [
      { id: 'view_patient_records', name: 'View Patient Records', resource: 'patients', action: 'read', scope: 'own' },
      { id: 'upload_documents', name: 'Upload Documents', resource: 'documents', action: 'write', scope: 'own' },
      { id: 'share_documents', name: 'Share Documents', resource: 'documents', action: 'share', scope: 'department' },
      { id: 'request_consultations', name: 'Request Consultations', resource: 'consultations', action: 'write', scope: 'department' }
    ]
  },

  doctor: {
    id: 'doctor',
    name: 'Doctor',
    description: 'Standard medical professional',
    level: 40,
    permissions: [
      { id: 'view_own_records', name: 'View Own Records', resource: 'patients', action: 'read', scope: 'own' },
      { id: 'upload_own_docs', name: 'Upload Own Documents', resource: 'documents', action: 'write', scope: 'own' },
      { id: 'view_shared_docs', name: 'View Shared Documents', resource: 'documents', action: 'read', scope: 'department' }
    ]
  },

  nurse: {
    id: 'nurse',
    name: 'Nurse',
    description: 'Nursing staff with limited access',
    level: 20,
    permissions: [
      { id: 'view_assigned_patients', name: 'View Assigned Patients', resource: 'patients', action: 'read', scope: 'own' },
      { id: 'update_patient_notes', name: 'Update Patient Notes', resource: 'documents', action: 'write', scope: 'own' }
    ]
  },

  admin_staff: {
    id: 'admin_staff',
    name: 'Administrative Staff',
    description: 'Administrative personnel',
    level: 30,
    permissions: [
      { id: 'manage_appointments', name: 'Manage Appointments', resource: 'appointments', action: 'write', scope: 'department' },
      { id: 'view_dept_schedule', name: 'View Department Schedule', resource: 'schedule', action: 'read', scope: 'department' }
    ]
  }
};
