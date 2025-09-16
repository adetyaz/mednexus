# Medical Document Storage Architecture Redesign

## Problem Statement
Current system treats each wallet as an individual document library, but medical institutions need:
- Hospital-level document organization
- Doctor verification and institutional affiliation
- Proper access control between institutions
- Shared institutional knowledge base

## Proposed Architecture

### 1. Hospital/Institution Registration
```typescript
interface MedicalInstitution {
  institutionId: string;        // Unique institution identifier
  name: string;                 // "Johns Hopkins Hospital"
  address: string;              // Physical address
  licenseNumber: string;        // Medical institution license
  verificationStatus: 'pending' | 'verified' | 'rejected';
  adminWallet: string;          // Institution administrator wallet
  contactInfo: ContactInfo;
  departments: Department[];
  registrationDate: string;
  verifiedBy?: string;          // Verification authority
}

interface Department {
  departmentId: string;
  name: string;                 // "Cardiology", "Radiology", etc.
  headOfDepartment?: string;    // Doctor wallet address
  specialties: string[];
}
```

### 2. Doctor Verification System
```typescript
interface VerifiedDoctor {
  doctorWallet: string;         // Doctor's wallet address
  institutionId: string;        // Hospital they belong to
  medicalLicense: string;       // Medical license number
  name: string;
  specialty: string;
  department: string;
  verificationStatus: 'pending' | 'verified' | 'suspended';
  verificationDate?: string;
  verifiedBy?: string;          // Who verified them
  permissions: DoctorPermissions;
}

interface DoctorPermissions {
  canUpload: boolean;
  canShare: boolean;
  canViewAllDepartments: boolean;
  canManageUsers: boolean;      // For department heads
  accessLevel: 'doctor' | 'department_head' | 'admin';
}
```

### 3. Institution-Level Document Library
```typescript
interface InstitutionDocumentLibrary {
  institutionId: string;
  departments: {
    [departmentId: string]: {
      institutionalDocs: DocumentReference[];
      researchDocs: DocumentReference[];
      clinicalDocs: DocumentReference[];
      privateDocs: DocumentReference[];    // Department-specific
    }
  };
  sharedWithInstitutions: {
    [otherInstitutionId: string]: DocumentReference[];
  };
  publicDocuments: DocumentReference[];  // Available to all verified doctors
  lastUpdated: string;
}
```

### 4. Access Control Matrix
```
Document Visibility:
┌─────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│                 │ Same Dept    │ Same Hospital│ Other Hospital│ Public      │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Private Docs    │ ✅ All       │ ❌ None      │ ❌ None      │ ❌ None     │
│ Departmental    │ ✅ All       │ ✅ All       │ ❌ None      │ ❌ None     │
│ Institutional   │ ✅ All       │ ✅ All       │ ❌ None      │ ❌ None     │
│ Shared Docs     │ ✅ All       │ ✅ All       │ ✅ Specified │ ❌ None     │
│ Public Research │ ✅ All       │ ✅ All       │ ✅ All       │ ✅ All      │
└─────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### 5. Document Classification
```typescript
interface MedicalDocument extends DocumentReference {
  institutionId: string;
  departmentId?: string;
  uploadedBy: string;          // Doctor wallet
  accessLevel: 'private' | 'departmental' | 'institutional' | 'shared' | 'public';
  sharedWith?: string[];       // Institution IDs for shared documents
  approvalStatus?: 'pending' | 'approved' | 'rejected'; // For institutional docs
  approvedBy?: string;         // Department head or admin wallet
}
```

## Implementation Plan

### Phase 1: Institution Management
1. Create institution registration system
2. Admin interface for institution verification
3. Institution profile management

### Phase 2: Doctor Verification
1. Doctor registration with institution linking
2. Medical license verification system
3. Department assignment

### Phase 3: Document Library Redesign
1. Migrate from wallet-based to institution-based storage
2. Implement proper access control
3. Department-level organization

### Phase 4: Sharing & Collaboration
1. Inter-institutional sharing system
2. Public medical research repository
3. Approval workflows for institutional documents

## User Flows

### Hospital Administrator Flow:
1. Register hospital with verification documents
2. Wait for verification approval
3. Add departments and specialties
4. Invite doctors to join institution
5. Manage institutional document library

### Doctor Registration Flow:
1. Connect wallet
2. Select institution from verified list
3. Provide medical license and credentials
4. Wait for institution admin approval
5. Access institution's document library

### Document Management Flow:
1. Doctor uploads document
2. Selects access level (private/departmental/institutional)
3. If institutional → requires department head approval
4. Document appears in appropriate library sections
5. Other doctors access based on permissions

## Security Considerations
- Multi-signature approval for institutional documents
- Audit trail for all document access
- Regular verification renewal requirements
- Encrypted storage with institution-level keys
- Compliance with medical privacy regulations

## Migration Strategy
1. **Preserve existing data**: Convert current wallet libraries to "unverified individual" status
2. **Gradual migration**: Allow users to register with institutions over time
3. **Backward compatibility**: Support both individual and institutional modes initially
4. **Data migration tools**: Help transfer documents to institutional libraries
