// Access Control Service
// Comprehensive role-based access control for MedNexus platform

import type {
  UserRole,
  Permission,
  DashboardUser
} from '$lib/types/dashboard';
import { USER_ROLES } from '$lib/types/dashboard';
import { browser } from '$app/environment';

export class AccessControlService {
  private static instance: AccessControlService;
  private currentUser: DashboardUser | null = null;
  private roles: Map<string, UserRole> = new Map();

  private constructor() {
    this.initializeRoles();
  }

  static getInstance(): AccessControlService {
    if (!AccessControlService.instance) {
      AccessControlService.instance = new AccessControlService();
    }
    return AccessControlService.instance;
  }

  private initializeRoles(): void {
    // Initialize predefined roles
    Object.values(USER_ROLES).forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  // User Management
  async setCurrentUser(walletAddress: string): Promise<void> {
    try {
      // In a real implementation, this would fetch user data from blockchain/smart contract
      // For now, we'll simulate user lookup based on wallet address
      const user = await this.fetchUserFromBlockchain(walletAddress);
      this.currentUser = user;

      // Store in localStorage for persistence
      if (browser) {
        localStorage.setItem('mednexus_user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Failed to set current user:', error);
      throw new Error('Unable to authenticate user');
    }
  }

  getCurrentUser(): DashboardUser | null {
    if (!this.currentUser && browser) {
      const stored = localStorage.getItem('mednexus_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    }
    return this.currentUser;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    if (browser) {
      localStorage.removeItem('mednexus_user');
    }
  }

  // Permission Checking
  hasPermission(resource: string, action: string, scope?: string): boolean {
    if (!this.currentUser) return false;

    const userPermissions = this.currentUser.role.permissions;

    return userPermissions.some(permission =>
      permission.resource === resource &&
      permission.action === action &&
      (!scope || permission.scope === scope || this.canAccessScope(permission.scope, scope))
    );
  }

  hasAnyPermission(resource: string, actions: string[]): boolean {
    return actions.some(action => this.hasPermission(resource, action));
  }

  hasAllPermissions(permissions: Array<{resource: string, action: string}>): boolean {
    return permissions.every(({resource, action}) =>
      this.hasPermission(resource, action)
    );
  }

  private canAccessScope(userScope: string, requiredScope: string): boolean {
    const scopeHierarchy: Record<string, number> = {
      'own': 1,
      'department': 2,
      'institution': 3,
      'global': 4
    };

    return scopeHierarchy[userScope] >= scopeHierarchy[requiredScope];
  }

  // Role Management
  getUserRole(): UserRole | null {
    return this.currentUser?.role || null;
  }

  getRoleById(roleId: string): UserRole | undefined {
    return this.roles.get(roleId);
  }

  getAllRoles(): UserRole[] {
    return Array.from(this.roles.values());
  }

  // Advanced Permission Checks
  canManageUser(targetUser: DashboardUser): boolean {
    if (!this.currentUser) return false;

    // Hospital admins can manage all users in their institution
    if (this.currentUser.role.id === 'hospital_admin' &&
        this.currentUser.institutionId === targetUser.institutionId) {
      return true;
    }

    // Department heads can manage users in their department
    if (this.currentUser.role.id === 'department_head' &&
        this.currentUser.departmentId === targetUser.departmentId) {
      return true;
    }

    return false;
  }

  canAccessDocument(documentOwnerId: string, documentDepartmentId?: string): boolean {
    if (!this.currentUser) return false;

    // Users can always access their own documents
    if (this.currentUser.walletAddress === documentOwnerId) {
      return true;
    }

    // Check department access
    if (documentDepartmentId && this.currentUser.departmentId === documentDepartmentId) {
      return this.hasPermission('documents', 'read', 'department');
    }

    // Check institution access
    return this.hasPermission('documents', 'read', 'institution');
  }

  canShareDocument(documentOwnerId: string): boolean {
    if (!this.currentUser) return false;

    // Document owner can always share
    if (this.currentUser.walletAddress === documentOwnerId) {
      return true;
    }

    // Check if user has sharing permissions
    return this.hasPermission('documents', 'share');
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isAdmin(): boolean {
    return this.currentUser?.role.id === 'hospital_admin';
  }

  isDepartmentHead(): boolean {
    return this.currentUser?.role.id === 'department_head';
  }

  isDoctor(): boolean {
    return ['doctor', 'senior_doctor', 'department_head'].includes(this.currentUser?.role.id || '');
  }

  // Mock method - replace with actual blockchain integration
  private async fetchUserFromBlockchain(walletAddress: string): Promise<DashboardUser> {
    // This would typically query a smart contract or user registry
    // For demo purposes, we'll return a mock user based on wallet address

    // Simulate different roles based on wallet address pattern
    let roleId = 'doctor';
    if (walletAddress.endsWith('000')) {
      roleId = 'hospital_admin';
    } else if (walletAddress.endsWith('111')) {
      roleId = 'department_head';
    } else if (walletAddress.endsWith('222')) {
      roleId = 'senior_doctor';
    }

    const role = this.roles.get(roleId)!;

    return {
      walletAddress,
      role,
      institutionId: 'hospital_' + walletAddress.slice(-4),
      departmentId: roleId === 'hospital_admin' ? undefined : 'dept_' + walletAddress.slice(-3),
      profile: {
        name: `Dr. ${walletAddress.slice(-8)}`,
        email: `doctor.${walletAddress.slice(-8)}@mednexus.com`,
        specialty: 'General Medicine',
        licenseNumber: 'MED' + walletAddress.slice(-6).toUpperCase()
      },
      lastLogin: new Date(),
      isActive: true
    };
  }

  // Audit and Compliance
  async logAccess(resource: string, action: string, details?: any): Promise<void> {
    if (!this.currentUser) return;

    const auditEntry = {
      timestamp: new Date(),
      userId: this.currentUser.walletAddress,
      role: this.currentUser.role.name,
      resource,
      action,
      details,
      institutionId: this.currentUser.institutionId
    };

    // In a real implementation, this would be stored on blockchain or secure database
    console.log('Access logged:', auditEntry);

    // Store in localStorage for demo purposes
    if (browser) {
      const auditLog = JSON.parse(localStorage.getItem('mednexus_audit') || '[]');
      auditLog.push(auditEntry);
      localStorage.setItem('mednexus_audit', JSON.stringify(auditLog.slice(-1000))); // Keep last 1000 entries
    }
  }
}

// Export singleton instance
export const accessControl = AccessControlService.getInstance();
