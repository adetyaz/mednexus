# MedNexus — Global Medical Intelligence Ecosystem

## Executive Summary

MedNexus is a decentralized data and compute platform built on the 0G modular stack that enables secure, auditable, and privacy-preserving AI workflows for regulated and data-rich industries. We enable users to create, own, and monetize Intelligent Non-Fungible Tokens (INFTs) — live, executable AI models — and to run verifiable computations on encrypted datasets without exposing raw personal data. The product focuses on a no-code visual builder for domain experts and an economically sustainable marketplace for INFTs and datasets.

## Target Users

- Clinicians and hospitals seeking privacy-preserving analytics and model access.
- Researchers and pharma companies needing diverse datasets for model training and inference.
- Data owners (patients, institutions) who want control and monetization of their data.
- Enterprises in supply chain, manufacturing, and urban planning that need verifiable, auditable AI workflows.

## The Problem

Valuable datasets are siloed and centrally controlled. Data owners lack control and fair compensation. Centralized AI solutions force costly data movement and create auditability gaps. Regulated industries (healthcare, finance) require provable privacy-preserving computations and clear consent records.

## The Solution

MedNexus co-locates model artifacts and data with on-chain anchoring and verifiable compute using 0G Storage, 0G Compute, 0G Data Availability (DA), and the 0G EVM-compatible chain. Key elements:

- INFTs: executable tokens that represent AI models (model URI, runtime requirements, versioning, revenue split).
- In-place encrypted compute: models run close to stored, encrypted data; only aggregated/non-identifying outputs are returned where required.
- Consent-first access control: on-chain grants and revocation for time-limited, purpose-limited dataset usage.
- Auditability: DA anchors and compact proofs let auditors verify computations without raw data exposure.

## 0G Chain Integration Highlights

- 0G Storage: chunked, client-side encrypted storage for datasets and model artifacts. Manifests and content hashes are anchored on-chain.
- 0G Compute: distributed GPU providers execute inference/training jobs, return signed execution receipts and result URIs.
- 0G DA: stores compact proofs and commitments for auditing and federated training checkpoints.
- 0G Chain (EVM-compatible): stores minimal anchors (manifest hashes, policy URIs), runs INFTRegistry, DatasetRegistry, AccessControl, PaymentSplitter contracts.

## Product Overview

Value flow (stakeholders):

- Farmer / Data Owner (Data Owner) —> registers dataset, sets access & pricing
- INFT Creator —> mints model INFT, sets runtime & revenue split
- Researcher / Consumer —> licenses INFT or dataset, submits job via visual builder
- Platform —> orchestrates compute jobs, verifies receipts, and distributes payments

Core features:

- Frictionless onboarding: social login and smart accounts to remove early crypto friction
- No-code visual builder (Svelte Flow) for composing dataset -> model -> results workflows
- INFT marketplace: list, discover, license, and monitor model usage
- Decentralized data marketplace: list encrypted datasets with provenance and pricing
- Gasless and progressive UX via Paymaster/smart account abstraction
- Auditor dashboard: DA-backed proofs and execution histories for compliance

## Core Innovation: INFT Tokenization Model

MedNexus uses a dual model that separates datasets (data manifests) from model assets (INFTs) and ties executions together via verifiable receipts and payment splitting.

1. INFT (ERC-721 extension): represents an executable AI model. Metadata includes modelUri, manifestHash, runtimeSpec, input/output schemas, and revenue_split.
2. Dataset manifest (off-chain in 0G Storage): canonical JSON with chunk URIs, encryption metadata, provenance, and manifestHash anchored on-chain.
3. Execution receipts: signed provider attestations with executionHash, resultUri, start/end timestamps, anchored to DA and optionally referenced on-chain.

This model enables verifiable monetization and traceable audit trails while keeping large content off-chain.

## Innovation & Impact

MedNexus unlocks data liquidity and decouples ownership from usage. It provides a path for regulated industries to adopt AI without centralized data exposure. By enabling INFT creators to monetize models and data owners to earn from usage, the platform creates positive incentives for data sharing with privacy protections.

## Detailed User Flows (high level)

1. Data Owner: upload -> encrypt -> manifest -> register on-chain -> set terms
2. Creator: upload model artifacts -> mint INFT with manifest -> set runtime & revenue split
3. Researcher: license/check access -> submit job via visual builder -> escrow payment -> compute runs -> receipt verification -> release funds
4. Patient consent: grant/revoke via mobile UI -> AccessControl enforces revocations in real time

## Technical & Implementation Notes

- Minimal on-chain footprint: store only hashes, URIs, and policy pointers.
- Client-side encryption: mandatory for regulated datasets; support KMS/threshold key modes for enterprise workflows.
- Use 0G SDKs (TypeScript): Storage and Compute starter kits to implement upload, job submit, and receipt verification flows.
- Smart contract toolchain: Hardhat/Foundry for development and tests; keep contracts small and well-audited.

## Roadmap (MVP waves)

- Wave 1: Foundation — SvelteKit skeleton, social login + smart accounts, dataset uploader with client-side encryption, DatasetRegistry contract.
- Wave 2: Visual builder & execution — Svelte Flow integration, compute gateway, signed execution receipts, basic PaymentSplitter.
- Wave 3: Marketplace & governance — INFT marketplace, licensing flows, access revocation, reputation metrics.
- Wave 4: Auditing & enterprise — DA-driven auditor dashboard, enterprise KMS, SLAs.
- Wave 5: Scale & ecosystem — federated training, DAO governance, cross-chain bridges.

## Acceptance Criteria (MVP)

- Wave 1: encrypted dataset upload + on-chain manifestAnchor; mint INFT referencing artifact manifest.
- Wave 2: visual builder can submit a job that runs on 0G Compute and returns a verifiable execution receipt anchored in DA.
- Wave 3: full marketplace flow with escrow, licensing, and automatic payment splits.

## References & Links

- 0G docs & SDKs: https://0g.ai/ and https://github.com/0glabs
- Project notes: `context.txt` in this repo (contains starter links and buildathon notes)

---

## Next Steps

For detailed technical implementation guides and API references, explore the comprehensive documentation sections covering:

- Medical Intelligence INFTs integration
- 0G Chain infrastructure setup
- Healthcare compliance frameworks
- AI model deployment strategies
