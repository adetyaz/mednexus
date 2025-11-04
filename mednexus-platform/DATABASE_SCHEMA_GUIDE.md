# MedNexus Database Schema Overview

## 📊 Tables Structure

```
medical_institutions (BASE - Already exists)
    ↓
medical_doctors (References institution_id)
    ↓
medical_documents (References institution_id + uploaded_by doctor wallet)
    ↓
document_storage_references (References document_id, tracks 0G Storage)
    ↓
document_access_logs (References document_id, audit trail)
    ↓
document_shares (References document_id, sharing between institutions)
```

## 🔗 Key Relationships

### 1. **medical_institutions** → **medical_doctors**
- One institution has many doctors
- FK: `medical_doctors.institution_id` → `medical_institutions.id`

### 2. **medical_doctors** → **medical_documents**
- One doctor uploads many documents
- FK: `medical_documents.uploaded_by` → `medical_doctors.wallet_address`
- FK: `medical_documents.institution_id` → `medical_institutions.id`

### 3. **medical_documents** → **document_storage_references**
- One document has one 0G Storage reference
- FK: `document_storage_references.document_id` → `medical_documents.id`
- **CRITICAL**: `storage_hash` is the merkle root to retrieve file from 0G network

### 4. **medical_documents** → **document_access_logs**
- One document has many access logs
- FK: `document_access_logs.document_id` → `medical_documents.id`

### 5. **medical_documents** → **document_shares**
- One document can be shared multiple times
- FK: `document_shares.document_id` → `medical_documents.id`

## 🎯 Core Tables Explained

### Table 1: `medical_doctors`
**Purpose**: Store doctor registration data after blockchain staking

**Key Fields**:
- `id`: Primary key (e.g., 'dr-sarah-johnson-mercy')
- `wallet_address`: Doctor's blockchain wallet (UNIQUE)
- `institution_id`: FK to medical_institutions
- `transaction_hash`: Blockchain registration TX
- `stake_amount`: Amount staked (0.0005 A0GI)
- `permissions`: JSON with access rights

**Important**: Only stores doctors who completed blockchain registration

### Table 2: `medical_documents`
**Purpose**: Store document METADATA (not actual file content)

**Key Fields**:
- `id`: Primary key (e.g., 'upload_1730000000000')
- `storage_hash`: **⭐ MERKLE ROOT from 0G Storage (THE KEY REFERENCE)**
- `encryption_key`: Key to decrypt file
- `institution_id`: FK to institution
- `uploaded_by`: Doctor wallet address
- `file_size`: Size in bytes
- `access_level`: 'private', 'departmental', 'institutional', 'shared', 'public'

**CRITICAL**: 
- Actual file is on 0G Storage Network
- `storage_hash` is used to retrieve file from 0G
- Database only stores metadata

### Table 3: `document_storage_references`
**Purpose**: Track 0G Storage upload status and verification

**Key Fields**:
- `document_id`: FK to medical_documents
- `storage_hash`: Same merkle root as in medical_documents
- `transaction_hash`: Blockchain TX for upload
- `storage_status`: 'uploading', 'uploaded', 'verified', 'failed'
- `indexer_url`: Which 0G indexer was used
- `replica_count`: How many copies exist on network

**Use Case**: Advanced tracking of file storage across 0G network

### Table 4: `document_access_logs`
**Purpose**: Audit trail of who accessed which documents

**Key Fields**:
- `document_id`: FK to medical_documents
- `accessed_by`: Doctor wallet address
- `access_type`: 'view', 'download', 'share', 'delete'
- `accessed_at`: Timestamp

**Use Case**: Compliance, security audits, access patterns

### Table 5: `document_shares`
**Purpose**: Track document sharing between institutions

**Key Fields**:
- `document_id`: FK to medical_documents
- `from_institution_id`: Institution sharing document
- `to_institution_id`: Institution receiving document
- `share_status`: 'pending', 'accepted', 'rejected', 'revoked'
- `can_view`, `can_download`, `can_reshare`: Permissions

**Use Case**: Inter-institutional collaboration

## 🔐 How 0G Storage Integration Works

### Upload Flow:
```
1. Doctor uploads file via UI
   ↓
2. File sent to server endpoint /api/upload-to-0g
   ↓
3. Server uses 0G SDK to upload to 0G network
   ↓
4. 0G network returns MERKLE ROOT (storage_hash)
   ↓
5. Save to database:
   - medical_documents.storage_hash = merkle root
   - document_storage_references with full details
   ↓
6. File now retrievable from ANY 0G node using storage_hash
```

### Download Flow:
```
1. Query database for storage_hash
   SELECT storage_hash, encryption_key FROM medical_documents WHERE id = 'upload_123';
   ↓
2. Use storage_hash to retrieve file from 0G network
   ↓
3. Decrypt using encryption_key
   ↓
4. Return file to user
   ↓
5. Log access in document_access_logs
```

## 📝 Common Queries

### Get doctor's documents:
```sql
SELECT * FROM medical_documents 
WHERE uploaded_by = '0x123abc...'
ORDER BY upload_date DESC;
```

### Get department documents:
```sql
SELECT * FROM medical_documents 
WHERE institution_id = 'mercy-general-hospital-usa'
AND department_id = 'Cardiology'
AND access_level IN ('departmental', 'institutional', 'public');
```

### Get 0G storage hash for download:
```sql
SELECT storage_hash, encryption_key 
FROM medical_documents 
WHERE id = 'upload_1730000000000';
```

### Track document access:
```sql
INSERT INTO document_access_logs (
    document_id, 
    accessed_by, 
    access_type,
    doctor_name
) VALUES (
    'upload_123', 
    '0x123abc...', 
    'download',
    'Dr. Sarah Johnson'
);
```

### Get institution statistics:
```sql
SELECT * FROM institution_document_stats 
WHERE institution_id = 'mercy-general-hospital-usa';
```

## 🚀 Implementation Checklist

- [ ] Run `supabase-complete-schema.sql` to create all tables
- [ ] Verify `medical_institutions` table exists first
- [ ] Update `ogStorage.ts` to save to `medical_documents` table
- [ ] Update `institutionalDocumentService.ts` to use database instead of localStorage
- [ ] Implement document download using `storage_hash` from database
- [ ] Add document access logging
- [ ] Test document sharing between institutions

## 🔑 Key Takeaways

1. **Only institutions exists in DB initially** ✅
2. **Doctors added after blockchain registration**
3. **Document files NEVER stored in database**
4. **Only metadata + storage_hash stored**
5. **storage_hash = merkle root = key to retrieve from 0G network**
6. **Anyone with storage_hash can access file from 0G decentralized network**

## 🎨 Entity Relationship Diagram

```
┌─────────────────────────┐
│  medical_institutions   │ (BASE - Already exists)
│  - id (PK)             │
│  - name                │
│  - wallet_address      │
└───────────┬─────────────┘
            │
            │ 1:N
            ▼
┌─────────────────────────┐
│   medical_doctors       │
│  - id (PK)             │
│  - wallet_address      │
│  - institution_id (FK) │◄────┐
└───────────┬─────────────┘     │
            │                   │
            │ 1:N               │
            ▼                   │
┌─────────────────────────┐    │
│  medical_documents      │    │
│  - id (PK)             │    │
│  - storage_hash ⭐      │    │ (FK references)
│  - uploaded_by (FK)    │────┘
│  - institution_id (FK) │────┐
└───────────┬─────────────┘    │
            │                  │
     ┌──────┼──────┬───────────┘
     │      │      │
     │ 1:N  │ 1:N  │ 1:N
     ▼      ▼      ▼
┌────────┐ ┌─────────┐ ┌──────────┐
│storage │ │access   │ │document  │
│refs    │ │logs     │ │shares    │
└────────┘ └─────────┘ └──────────┘
```

## 💡 Next Steps

1. Run the schema in Supabase dashboard
2. Update TypeScript types to match new schema
3. Modify services to use database queries instead of localStorage
4. Implement proper error handling for database operations
5. Add RLS policies for production security
