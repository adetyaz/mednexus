/**
 * Clinical Trial Management Service (Wave 4)
 * Handles multi-institutional clinical trial coordination, patient recruitment,
 * protocol management, and ethics approval workflows
 * 
 * Builds on:
 * - Wave 2: Cross-border infrastructure, document storage
 * - Wave 3: AI case matching for patient recruitment
 */

import { browser } from '$app/environment';
import { ethers } from 'ethers';
import type { MedicalCase } from './caseMatchingService';
import { zeroGCaseMatchingService } from './caseMatchingService';
import { patternRecognitionService } from './patternRecognitionService';
import { supabase } from '$lib/supabase';

/**
 * Clinical Trial Structure
 */
export interface ClinicalTrial {
	trialId: string;
	protocolNumber: string; // e.g., NCT04123456
	title: string;
	shortTitle: string;
	phase: 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4';
	status: 'planning' | 'recruiting' | 'active' | 'completed' | 'suspended' | 'terminated';
	
	// Trial details
	sponsor: {
		name: string;
		institutionId: string;
		contactPerson: string;
		email: string;
	};
	principalInvestigator: {
		name: string;
		institution: string;
		credentials: string[];
		walletAddress: string;
	};
	
	// Medical details
	condition: string;
	intervention: {
		type: 'drug' | 'device' | 'procedure' | 'behavioral' | 'other';
		name: string;
		description: string;
	};
	
	// Eligibility criteria
	eligibility: {
		minAge: number;
		maxAge: number;
		gender: 'all' | 'male' | 'female';
		inclusionCriteria: string[];
		exclusionCriteria: string[];
		requiredDiagnoses: string[];
		requiredLabValues?: Record<string, string>;
	};
	
	// Trial design
	design: {
		studyType: 'interventional' | 'observational';
		allocation: 'randomized' | 'non_randomized';
		primaryPurpose: 'treatment' | 'prevention' | 'diagnostic' | 'supportive_care';
		masking: 'none' | 'single' | 'double' | 'triple';
		enrollmentTarget: number;
		numberOfArms: number;
	};
	
	// Participating institutions
	sites: TrialSite[];
	
	// Timeline
	timeline: {
		startDate: Date;
		estimatedCompletionDate: Date;
		primaryCompletionDate: Date;
		actualStartDate?: Date;
		actualCompletionDate?: Date;
	};
	
	// Outcomes
	outcomes: {
		primary: string[];
		secondary: string[];
		safetyMeasures: string[];
	};
	
	// Enrollment
	enrollment: {
		total: number;
		screened: number;
		randomized: number;
		completed: number;
		withdrawn: number;
		currentByCountry: Record<string, number>;
	};
	
	// Blockchain integration
	blockchain: {
		contractAddress?: string;
		protocolHash: string; // Immutable protocol on 0G Storage
		ethicsApprovalHashes: string[]; // Ethics committee approvals
		registrationTxHash?: string;
		verified: boolean;
	};
	
	// Regulatory
	regulatory: {
		irbApproved: boolean;
		fdaApproved?: boolean;
		emaApproved?: boolean;
		localApprovals: Record<string, boolean>;
		dataMonitoringCommittee: boolean;
	};
	
	// Financials
	funding: {
		totalBudget: number;
		currency: string;
		source: string;
		perPatientCost: number;
	};
	
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Trial Site (Institution participating in trial)
 */
export interface TrialSite {
	siteId: string;
	institutionId?: string;
	institutionName: string;
	location: string;
	country: string;
	principalInvestigator: string;
	status: 'pending' | 'active' | 'suspended' | 'closed';
	enrollmentTarget: number;
	currentEnrollment: number;
	contactInfo: {
		coordinatorName?: string;
		email: string;
		phone: string;
		address?: string;
	};
	irbApproval: {
		approved: boolean;
		approvalDate?: string;
		expirationDate?: string;
		irbName?: string;
		protocolNumber?: string;
	};
	lastUpdated: Date;
}

/**
 * Trial Participant (Patient in trial)
 */
export interface TrialParticipant {
	participantId: string; // Anonymized ID
	trialId: string;
	siteId: string;
	
	// Enrollment info
	screeningDate: Date;
	enrollmentDate?: Date;
	randomizationDate?: Date;
	studyArm?: string;
	
	// Demographics (anonymized)
	demographics: {
		ageGroup: string; // e.g., "45-54"
		gender: 'male' | 'female' | 'other';
		ethnicity: string;
		country: string;
	};
	
	// Medical eligibility
	eligibilityAssessment: {
		meetsInclusionCriteria: boolean;
		exclusionViolations: string[];
		screeningScore: number;
		eligibleDate?: Date;
	};
	
	// Consent
	consent: {
		consentDate: Date;
		consentVersion: string;
		consentHash: string; // Blockchain proof
		withdrawalRight: boolean;
	};
	
	// Trial progress
	status: 'screening' | 'enrolled' | 'randomized' | 'active' | 'completed' | 'withdrawn' | 'adverse_event';
	visitSchedule: TrialVisit[];
	adverseEvents: AdverseEvent[];
	
	// Data privacy
	dataHash: string; // Encrypted patient data on 0G Storage
	accessLog: string[]; // Who accessed data
}

/**
 * Trial Visit
 */
export interface TrialVisit {
	visitId: string;
	visitNumber: number;
	visitDate: Date;
	visitType: 'screening' | 'baseline' | 'treatment' | 'follow_up' | 'end_of_study';
	completed: boolean;
	assessments: {
		name: string;
		result: string;
		normalRange?: string;
	}[];
	adverseEvents: string[];
	notes: string;
}

/**
 * Adverse Event Tracking
 */
export interface AdverseEvent {
	eventId: string;
	participantId: string;
	trialId: string;
	
	event: {
		description: string;
		severity: 'mild' | 'moderate' | 'severe' | 'life_threatening' | 'fatal';
		category: string;
		onset: Date;
		resolution?: Date;
		ongoing: boolean;
	};
	
	causality: {
		relatedToIntervention: boolean;
		relatedToDisease: boolean;
		relatedToOther: boolean;
		investigatorAssessment: string;
	};
	
	actions: {
		interventionModified: boolean;
		treatmentRequired: boolean;
		hospitalizationRequired: boolean;
		studyDiscontinuation: boolean;
	};
	
	reporting: {
		reportedDate: Date;
		reportedTo: string[];
		serious: boolean;
		unexpected: boolean;
		regulatoryReportRequired: boolean;
	};
	
	blockchainProof: string; // Immutable record on blockchain
}

/**
 * Patient Recruitment Matching
 */
export interface RecruitmentMatch {
	matchId: string;
	trialId: string;
	caseId: string;
	patientId: string;
	institutionId: string;
	
	matchScore: number; // 0-100
	eligibilityCriteria: {
		criterion: string;
		met: boolean;
		value: string;
	}[];
	
	aiAnalysis: {
		confidence: number;
		reasonsForMatch: string[];
		potentialConcerns: string[];
		recommendedNextSteps: string[];
	};
	
	status: 'potential' | 'contacted' | 'screening' | 'enrolled' | 'declined' | 'ineligible';
	matchDate: Date;
	contactAttempts: number;
	lastContactDate?: Date;
}

/**
 * Ethics Approval Record
 */
export interface EthicsApproval {
	approvalId: string;
	trialId: string;
	committee: {
		name: string;
		institution: string;
		country: string;
		registrationNumber: string;
	};
	
	approval: {
		approved: boolean;
		approvalDate?: Date;
		approvalNumber?: string;
		expiryDate?: Date;
		conditionalApproval: boolean;
		conditions: string[];
	};
	
	documents: {
		applicationHash: string;
		protocolHash: string;
		consentFormHash: string;
		approvalLetterHash: string;
	};
	
	blockchainVerification: {
		txHash: string;
		verified: boolean;
		verificationDate: Date;
	};
}

/**
 * Research Protocol
 */
export interface ResearchProtocol {
	protocolId: string;
	version: string;
	title: string;
	abstract: string;
	
	methodology: {
		studyDesign: string;
		population: string;
		interventions: string[];
		comparators: string[];
		outcomes: string[];
		statisticalAnalysis: string;
		sampleSize: number;
		powerAnalysis: string;
	};
	
	collaboratingInstitutions: string[];
	leadInstitution: string;
	
	timeline: {
		protocolDevelopment: Date;
		ethicsSubmission: Date;
		enrollmentStart: Date;
		dataCollection: Date;
		analysis: Date;
		publication: Date;
	};
	
	dataSharing: {
		dataAvailable: boolean;
		dataType: string[];
		accessCriteria: string;
		embargoEndDate?: Date;
	};
	
	blockchain: {
		protocolHash: string;
		timestamped: Date;
		immutable: boolean;
	};
}

/**
 * Clinical Trial Management Service
 */
class ClinicalTrialService {
	private trials: Map<string, ClinicalTrial> = new Map();
	private participants: Map<string, TrialParticipant> = new Map();
	private recruitmentMatches: Map<string, RecruitmentMatch[]> = new Map();
	private ethicsApprovals: Map<string, EthicsApproval[]> = new Map();

	constructor() {
		// Mock data removed - using Supabase database
		// if (browser) {
		// 	this.loadMockData();
		// }
	}

	/**
	 * Create a new clinical trial
	 */
	async createTrial(trialData: Partial<ClinicalTrial>): Promise<ClinicalTrial> {
		if (!trialData.protocolNumber || !trialData.title || !trialData.condition) {
			throw new Error('Protocol number, title, and condition are required');
		}

		const trialId = `trial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		const trial: ClinicalTrial = { 
			trialId,
			protocolNumber: trialData.protocolNumber,
			title: trialData.title,
			shortTitle: trialData.shortTitle || trialData.title.substring(0, 100),
			phase: trialData.phase || 'phase_2',
			status: 'planning',
			sponsor: trialData.sponsor || {
				name: trialData.principalInvestigator?.institution || 'Research Institute',
				institutionId: 'unknown',
				contactPerson: trialData.principalInvestigator?.name || 'Unknown',
				email: 'contact@example.com'
			},
			principalInvestigator: trialData.principalInvestigator || {
				name: 'Dr. Investigator',
				institution: 'Unknown Institution',
				credentials: ['MD', 'PhD'],
				walletAddress: '0x0000000000000000000000000000000000000000'
			},
			condition: trialData.condition,
			intervention: trialData.intervention || {
				type: 'drug',
				name: 'Investigational Drug',
				description: 'A novel therapeutic agent'
			},
			eligibility: trialData.eligibility || {
				minAge: 18,
				maxAge: 75,
				gender: 'all',
				inclusionCriteria: ['Confirmed diagnosis'],
				exclusionCriteria: ['Pregnancy', 'Severe comorbidities'],
				requiredDiagnoses: [trialData.condition]
			},
			design: trialData.design || {
				studyType: 'interventional',
				allocation: 'randomized',
				primaryPurpose: 'treatment',
				masking: 'double',
				enrollmentTarget: trialData.sites?.reduce((sum, site) => sum + site.enrollmentTarget, 0) || 300,
				numberOfArms: 2
			},
			sites: trialData.sites || [],
			timeline: trialData.timeline || {
				startDate: new Date(),
				estimatedCompletionDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years
				primaryCompletionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
			},
			outcomes: trialData.outcomes || {
				primary: [trialData.objectives || 'Primary endpoint'],
				secondary: ['Secondary endpoint'],
				safetyMeasures: ['Adverse events monitoring']
			},
			enrollment: {
				total: 0,
				screened: 0,
				randomized: 0,
				completed: 0,
				withdrawn: 0,
				currentByCountry: {}
			},
			blockchain: {
				protocolHash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(trialData))),
				ethicsApprovalHashes: [],
				verified: false
			},
			regulatory: trialData.regulatory || {
				irbApproved: false,
				dataMonitoringCommittee: true,
				localApprovals: {}
			},
			funding: trialData.funding || {
				totalBudget: 5000000,
				currency: 'USD',
				source: 'Grant',
				perPatientCost: 15000
			},
			createdAt: new Date(),
			updatedAt: new Date()
		};

	// Removed: Mock Map storage - using database only
	// this.trials.set(trialId, trial);		// Store in Supabase database
		try {
			const { error: trialError } = await supabase.from('clinical_trials').insert({
				trial_id: trialId,
				protocol_number: trial.protocolNumber,
				title: trial.title,
				short_title: trial.shortTitle,
				phase: trial.phase,
				status: trial.status,
				condition: trial.condition,
				intervention: trial.intervention,
				objectives: trialData.objectives || null,
				principal_investigator: trial.principalInvestigator,
				sponsor: trial.sponsor,
				eligibility: trial.eligibility,
				design: trial.design,
				timeline: trial.timeline,
				outcomes: trial.outcomes,
				enrollment: trial.enrollment,
				blockchain: trial.blockchain,
				regulatory: trial.regulatory,
				funding: trial.funding
			});

			if (trialError) {
				console.error('Failed to insert trial into database:', trialError);
				throw new Error(`Database error: ${trialError.message}`);
			}

			// Insert trial sites
			if (trial.sites && trial.sites.length > 0) {
				const sitesData = trial.sites.map(site => ({
					site_id: site.siteId,
					trial_id: trialId,
					institution_id: site.institutionId,
					institution_name: site.institutionName,
					location: site.location,
					country: site.country,
					principal_investigator: site.principalInvestigator,
					status: site.status,
					enrollment_target: site.enrollmentTarget,
					current_enrollment: site.currentEnrollment,
					contact_info: site.contactInfo,
					irb_approval: site.irbApproval
				}));

				const { error: sitesError } = await supabase.from('trial_sites').insert(sitesData);

				if (sitesError) {
					console.error('Failed to insert trial sites:', sitesError);
					// Don't fail the whole operation, just log the error
				}
			}

			console.log(`✅ Clinical trial created: ${trial.protocolNumber} - ${trial.title}`);
		} catch (error) {
			console.error('Database storage failed:', error);
			throw new Error('Failed to save trial to database');
		}

		return trial;
	}

	/**
	 * Find eligible patients for a clinical trial using AI matching
	 */
	async findEligiblePatients(
		trialId: string,
		maxResults: number = 50
	): Promise<RecruitmentMatch[]> {
		const trial = await this.getTrial(trialId);
		if (!trial) {
			throw new Error('Trial not found');
		}

		console.log(`🔍 Searching for patients eligible for trial: ${trial.title}`);

		// Build search criteria from eligibility requirements
		const searchCriteria = {
			diagnoses: trial.eligibility.requiredDiagnoses,
			ageRange: {
				min: trial.eligibility.minAge,
				max: trial.eligibility.maxAge
			},
			gender: trial.eligibility.gender,
			specialty: this.getSpecialtyFromCondition(trial.condition)
		};

		// Use case matching service to find similar cases
		// In production, this would search global medical database
		const matches: RecruitmentMatch[] = [];

		// For demo, generate mock matches
		for (let i = 0; i < Math.min(maxResults, 20); i++) {
			const matchScore = 70 + Math.random() * 30; // 70-100 score
			
			const match: RecruitmentMatch = {
				matchId: `match_${trialId}_${i}_${Date.now()}`,
				trialId,
				caseId: `case_${i}`,
				patientId: `patient_${i}`,
				institutionId: `institution_${i % 5}`,
				matchScore: Math.round(matchScore),
				eligibilityCriteria: this.evaluateEligibility(trial.eligibility, matchScore),
				aiAnalysis: {
					confidence: matchScore / 100,
					reasonsForMatch: [
						'Meets primary diagnosis criteria',
						'Age within eligible range',
						'No exclusion criteria violations',
						'Geographic accessibility'
					],
					potentialConcerns: matchScore < 85 ? ['Requires detailed screening', 'Comorbidity review needed'] : [],
					recommendedNextSteps: [
						'Contact patient for screening visit',
						'Review complete medical history',
						'Obtain informed consent'
					]
				},
				status: 'potential',
				matchDate: new Date(),
				contactAttempts: 0
			};

			matches.push(match);
		}

		// Store matches
		this.recruitmentMatches.set(trialId, matches);

		console.log(`✅ Found ${matches.length} eligible patients for trial ${trial.protocolNumber}`);

		return matches.sort((a, b) => b.matchScore - a.matchScore);
	}

	/**
	 * Enroll patient in clinical trial
	 */
	async enrollPatient(
		trialId: string,
		matchId: string,
		consentData: { consentVersion: string; consentHash: string }
	): Promise<TrialParticipant> {
		const trial = await this.getTrial(trialId);
		if (!trial) {
			throw new Error('Trial not found');
		}

		const matches = this.recruitmentMatches.get(trialId) || [];
		const match = matches.find(m => m.matchId === matchId);
		if (!match) {
			throw new Error('Recruitment match not found');
		}

		// Create participant record
		const participantId = `participant_${trialId}_${Date.now()}`;
		
		const participant: TrialParticipant = {
			participantId,
			trialId,
			siteId: trial.sites[0]?.siteId || 'site_unknown',
			screeningDate: new Date(),
			enrollmentDate: new Date(),
			demographics: {
				ageGroup: this.getAgeGroup(45), // From match data
				gender: 'other',
				ethnicity: 'Unknown',
				country: 'Unknown'
			},
			eligibilityAssessment: {
				meetsInclusionCriteria: true,
				exclusionViolations: [],
				screeningScore: match.matchScore,
				eligibleDate: new Date()
			},
			consent: {
				consentDate: new Date(),
				consentVersion: consentData.consentVersion,
				consentHash: consentData.consentHash,
				withdrawalRight: true
			},
			status: 'enrolled',
			visitSchedule: this.generateVisitSchedule(trial),
			adverseEvents: [],
			dataHash: ethers.keccak256(ethers.toUtf8Bytes(`participant_data_${participantId}`)),
			accessLog: []
		};

		this.participants.set(participantId, participant);

		// Update trial enrollment in database
		trial.enrollment.total++;
		trial.enrollment.screened++;
		trial.enrollment.randomized++;
		
		await supabase
			.from('clinical_trials')
			.update({ enrollment: trial.enrollment })
			.eq('trial_id', trialId);

		// Update match status
		match.status = 'enrolled';
		
		console.log(`✅ Patient enrolled in trial: ${trial.protocolNumber}`);

		return participant;
	}

	/**
	 * Record adverse event
	 */
	async recordAdverseEvent(
		participantId: string,
		eventData: Partial<AdverseEvent>
	): Promise<AdverseEvent> {
		const participant = this.participants.get(participantId);
		if (!participant) {
			throw new Error('Participant not found');
		}

		const adverseEvent: AdverseEvent = {
			eventId: `ae_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			participantId,
			trialId: participant.trialId,
			event: {
				description: eventData.event?.description || 'Adverse event',
				severity: eventData.event?.severity || 'mild',
				category: eventData.event?.category || 'General',
				onset: eventData.event?.onset || new Date(),
				ongoing: eventData.event?.ongoing ?? true
			},
			causality: eventData.causality || {
				relatedToIntervention: false,
				relatedToDisease: false,
				relatedToOther: false,
				investigatorAssessment: 'Under review'
			},
			actions: eventData.actions || {
				interventionModified: false,
				treatmentRequired: false,
				hospitalizationRequired: false,
				studyDiscontinuation: false
			},
			reporting: {
				reportedDate: new Date(),
				reportedTo: ['Principal Investigator', 'IRB'],
				serious: eventData.event?.severity === 'severe' || eventData.event?.severity === 'life_threatening',
				unexpected: false,
				regulatoryReportRequired: false
			},
			blockchainProof: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(eventData)))
		};

		participant.adverseEvents.push(adverseEvent);
		this.participants.set(participantId, participant);

		console.log(`⚠️ Adverse event recorded: ${adverseEvent.eventId}`);

		return adverseEvent;
	}

	/**
	 * Get all trials
	 */
	async getAllTrials(): Promise<ClinicalTrial[]> {
		try {
			const { data: trialsData, error: trialsError } = await supabase
				.from('clinical_trials')
				.select('*')
				.order('created_at', { ascending: false });

			if (trialsError) {
				console.error('Failed to fetch trials:', trialsError);
				return [];
			}

			if (!trialsData || trialsData.length === 0) {
				return [];
			}

			// Fetch all sites for all trials
			const trialIds = trialsData.map((t: any) => t.trial_id);
			const { data: sitesData, error: sitesError } = await supabase
				.from('trial_sites')
				.select('*')
				.in('trial_id', trialIds);

			if (sitesError) {
				console.error('Failed to fetch trial sites:', sitesError);
			}

			// Map sites to trials
			const sitesByTrial = new Map<string, TrialSite[]>();
			if (sitesData) {
				for (const site of sitesData as any[]) {
					if (!sitesByTrial.has(site.trial_id)) {
						sitesByTrial.set(site.trial_id, []);
					}
					sitesByTrial.get(site.trial_id)!.push({
						siteId: site.site_id,
						institutionId: site.institution_id,
						institutionName: site.institution_name,
						location: site.location,
						country: site.country,
						principalInvestigator: site.principal_investigator,
						status: site.status,
						enrollmentTarget: site.enrollment_target,
						currentEnrollment: site.current_enrollment,
						contactInfo: site.contact_info,
						irbApproval: site.irb_approval,
						lastUpdated: new Date(site.last_updated)
					});
				}
			}

			// Convert database records to ClinicalTrial objects
			const trials: ClinicalTrial[] = trialsData.map((t: any) => ({
				trialId: t.trial_id,
				protocolNumber: t.protocol_number,
				title: t.title,
				shortTitle: t.short_title,
				phase: t.phase,
				status: t.status,
				sponsor: t.sponsor,
				principalInvestigator: t.principal_investigator,
				condition: t.condition,
				intervention: t.intervention,
				eligibility: t.eligibility,
				design: t.design,
				sites: sitesByTrial.get(t.trial_id) || [],
				timeline: {
					startDate: new Date(t.timeline.startDate),
					estimatedCompletionDate: new Date(t.timeline.estimatedCompletionDate),
					primaryCompletionDate: new Date(t.timeline.primaryCompletionDate),
					actualStartDate: t.timeline.actualStartDate ? new Date(t.timeline.actualStartDate) : undefined,
					actualCompletionDate: t.timeline.actualCompletionDate ? new Date(t.timeline.actualCompletionDate) : undefined
				},
				outcomes: t.outcomes,
				enrollment: t.enrollment,
				blockchain: t.blockchain,
				regulatory: t.regulatory,
				funding: t.funding,
				createdAt: new Date(t.created_at),
				updatedAt: new Date(t.updated_at)
			}));

			return trials;
		} catch (error) {
			console.error('Error fetching trials:', error);
			return [];
		}
	}

	/**
	 * Get trial by ID
	 */
	async getTrial(trialId: string): Promise<ClinicalTrial | null> {
		const { data, error } = await supabase
			.from('clinical_trials')
			.select('*, trial_sites(*)')
			.eq('trial_id', trialId)
			.single();

		if (error || !data) return null;

		const dbData = data as any;
		const sites = dbData.trial_sites?.map((s: any) => ({
			siteId: s.site_id,
			institutionId: s.institution_id,
			institutionName: s.institution_name,
			location: s.location,
			country: s.country,
			principalInvestigator: s.principal_investigator,
			status: s.status,
			enrollmentTarget: s.enrollment_target,
			currentEnrollment: s.current_enrollment,
			contactInfo: s.contact_info,
			irbApproval: s.irb_approval,
			lastUpdated: new Date(s.last_updated)
		})) || [];

		return {
			trialId: dbData.trial_id,
			protocolNumber: dbData.protocol_number,
			title: dbData.title,
			shortTitle: dbData.short_title,
			phase: dbData.phase,
			status: dbData.status,
			sponsor: dbData.sponsor,
			principalInvestigator: dbData.principal_investigator,
			condition: dbData.condition,
			intervention: dbData.intervention,
			eligibility: dbData.eligibility,
			design: dbData.design,
			sites,
			timeline: {
				startDate: new Date(dbData.timeline.startDate),
				estimatedCompletionDate: new Date(dbData.timeline.estimatedCompletionDate),
				primaryCompletionDate: new Date(dbData.timeline.primaryCompletionDate),
				actualStartDate: dbData.timeline.actualStartDate ? new Date(dbData.timeline.actualStartDate) : undefined,
				actualCompletionDate: dbData.timeline.actualCompletionDate ? new Date(dbData.timeline.actualCompletionDate) : undefined
			},
			outcomes: dbData.outcomes,
			enrollment: dbData.enrollment,
			blockchain: dbData.blockchain,
			regulatory: dbData.regulatory,
			funding: dbData.funding,
			createdAt: new Date(dbData.created_at),
			updatedAt: new Date(dbData.updated_at)
		};
	}

	/**
	 * Get trials by status
	 */
	async getTrialsByStatus(status: ClinicalTrial['status']): Promise<ClinicalTrial[]> {
		const trials = await this.getAllTrials();
		return trials.filter(t => t.status === status);
	}

	/**
	 * Get trial participants
	 */
	getTrialParticipants(trialId: string): TrialParticipant[] {
		return Array.from(this.participants.values()).filter(p => p.trialId === trialId);
	}

	/**
	 * Get recruitment matches for trial
	 */
	getRecruitmentMatches(trialId: string): RecruitmentMatch[] {
		return this.recruitmentMatches.get(trialId) || [];
	}

	// Helper methods

	private getSpecialtyFromCondition(condition: string): string {
		const specialtyMap: Record<string, string> = {
			'cancer': 'Oncology',
			'heart': 'Cardiology',
			'diabetes': 'Endocrinology',
			'alzheimer': 'Neurology',
			'lung': 'Pulmonology'
		};

		for (const [key, specialty] of Object.entries(specialtyMap)) {
			if (condition.toLowerCase().includes(key)) {
				return specialty;
			}
		}

		return 'Internal Medicine';
	}

	private evaluateEligibility(
		eligibility: ClinicalTrial['eligibility'],
		matchScore: number
	): RecruitmentMatch['eligibilityCriteria'] {
		const criteria: RecruitmentMatch['eligibilityCriteria'] = [];

		criteria.push({
			criterion: `Age: ${eligibility.minAge}-${eligibility.maxAge}`,
			met: matchScore > 60,
			value: '45 years'
		});

		criteria.push({
			criterion: 'Required diagnosis',
			met: matchScore > 70,
			value: 'Confirmed'
		});

		criteria.push({
			criterion: 'No exclusion criteria',
			met: matchScore > 80,
			value: 'Verified'
		});

		return criteria;
	}

	private getAgeGroup(age: number): string {
		if (age < 18) return '<18';
		if (age < 30) return '18-29';
		if (age < 45) return '30-44';
		if (age < 60) return '45-59';
		if (age < 75) return '60-74';
		return '75+';
	}

	private generateVisitSchedule(trial: ClinicalTrial): TrialVisit[] {
		const visits: TrialVisit[] = [];
		const visitTypes: TrialVisit['visitType'][] = ['screening', 'baseline', 'treatment', 'follow_up', 'end_of_study'];

		visitTypes.forEach((type, index) => {
			visits.push({
				visitId: `visit_${index + 1}`,
				visitNumber: index + 1,
				visitDate: new Date(Date.now() + index * 30 * 24 * 60 * 60 * 1000), // Monthly visits
				visitType: type,
				completed: false,
				assessments: [],
				adverseEvents: [],
				notes: ''
			});
		});

		return visits;
	}

	/**
	 * Load mock clinical trial data
	 */
	private loadMockData() {
		// Create sample trials based on real-world scenarios
		const mockTrials: Partial<ClinicalTrial>[] = [
			{
				protocolNumber: 'NCT04891234',
				title: 'Phase 3 Study of Novel Immunotherapy in Advanced Non-Small Cell Lung Cancer',
				shortTitle: 'NSCLC Immunotherapy Trial',
				phase: 'phase_3',
				status: 'recruiting',
				condition: 'Non-Small Cell Lung Cancer (Stage III-IV)',
				intervention: {
					type: 'drug',
					name: 'MedNex-401 (Anti-PD-L1 Antibody)',
					description: 'Novel checkpoint inhibitor targeting PD-L1 pathway'
				},
				sponsor: {
					name: 'MedNexus Research Institute',
					institutionId: 'mercy-general-sf',
					contactPerson: 'Dr. Sarah Chen',
					email: 'schen@mednexus.org'
				},
				principalInvestigator: {
					name: 'Dr. Sarah Chen',
					institution: 'Mercy General Hospital',
					credentials: ['MD', 'PhD', 'FASCO'],
					walletAddress: '0x1234567890123456789012345678901234567890'
				},
				eligibility: {
					minAge: 18,
					maxAge: 80,
					gender: 'all',
					inclusionCriteria: [
						'Histologically confirmed NSCLC',
						'Stage III or IV disease',
						'ECOG performance status 0-2',
						'Adequate organ function',
						'Life expectancy ≥ 3 months'
					],
					exclusionCriteria: [
						'Prior immunotherapy',
						'Active autoimmune disease',
						'Pregnancy or breastfeeding',
						'Active CNS metastases',
						'Severe cardiovascular disease'
					],
					requiredDiagnoses: ['Non-Small Cell Lung Cancer'],
					requiredLabValues: {
						'Absolute Neutrophil Count': '≥1500/μL',
						'Platelet Count': '≥100,000/μL',
						'Creatinine': '≤1.5x ULN'
					}
				},
				design: {
					studyType: 'interventional',
					allocation: 'randomized',
					primaryPurpose: 'treatment',
					masking: 'double',
					enrollmentTarget: 450,
					numberOfArms: 2
				},
				sites: [
					{
						siteId: 'site_001',
						institutionId: 'mercy-general-sf',
						institutionName: 'Mercy General Hospital',
						country: 'United States',
						principalInvestigator: 'Dr. Sarah Chen',
						status: 'active',
						enrollmentTarget: 100,
						currentEnrollment: 34,
						irbApprovalDate: new Date('2024-06-15'),
						irbApprovalNumber: 'IRB-2024-0456',
						contactInfo: {
							coordinatorName: 'Emily Rodriguez',
							email: 'erodriguez@mercygeneral.org',
							phone: '+1-415-555-0123'
						}
					},
					{
						siteId: 'site_002',
						institutionId: 'johns-hopkins',
						institutionName: 'Johns Hopkins Hospital',
						country: 'United States',
						principalInvestigator: 'Dr. Michael Kim',
						status: 'active',
						enrollmentTarget: 150,
						currentEnrollment: 87,
						irbApprovalDate: new Date('2024-06-20'),
						irbApprovalNumber: 'IRB-2024-0789',
						contactInfo: {
							coordinatorName: 'Jessica Wang',
							email: 'jwang@jhu.edu',
							phone: '+1-410-555-0234'
						}
					},
					{
						siteId: 'site_003',
						institutionId: 'charite-berlin',
						institutionName: 'Charité Universitätsmedizin Berlin',
						country: 'Germany',
						principalInvestigator: 'Prof. Dr. Klaus Mueller',
						status: 'active',
						enrollmentTarget: 120,
						currentEnrollment: 52,
						irbApprovalDate: new Date('2024-07-10'),
						irbApprovalNumber: 'EC-2024-1234',
						contactInfo: {
							coordinatorName: 'Anna Schmidt',
							email: 'aschmidt@charite.de',
							phone: '+49-30-555-0345'
						}
					}
				],
				timeline: {
					startDate: new Date('2024-06-01'),
					estimatedCompletionDate: new Date('2027-06-01'),
					primaryCompletionDate: new Date('2026-12-01')
				},
				outcomes: {
					primary: [
						'Overall Survival (OS)',
						'Progression-Free Survival (PFS)'
					],
					secondary: [
						'Objective Response Rate (ORR)',
						'Duration of Response',
						'Time to Progression',
						'Quality of Life (EORTC QLQ-C30)'
					],
					safetyMeasures: [
						'Adverse Events (CTCAE v5.0)',
						'Immune-related Adverse Events',
						'Laboratory Abnormalities',
						'Treatment Discontinuations'
					]
				},
				enrollment: {
					total: 173,
					screened: 195,
					randomized: 173,
					completed: 12,
					withdrawn: 8,
					currentByCountry: {
						'United States': 121,
						'Germany': 52
					}
				},
				regulatory: {
					irbApproved: true,
					fdaApproved: true,
					emaApproved: true,
					localApprovals: {
						'United States': true,
						'Germany': true,
						'United Kingdom': true
					},
					dataMonitoringCommittee: true
				},
				funding: {
					totalBudget: 28500000,
					currency: 'USD',
					source: 'NIH Grant + Pharmaceutical Sponsor',
					perPatientCost: 63000
				}
			},
			{
				protocolNumber: 'NCT04892567',
				title: 'Randomized Trial of Gene Therapy for Spinal Muscular Atrophy',
				shortTitle: 'SMA Gene Therapy',
				phase: 'phase_2',
				status: 'recruiting',
				condition: 'Spinal Muscular Atrophy Type 2',
				intervention: {
					type: 'drug',
					name: 'AAV9-SMN Gene Therapy',
					description: 'Adeno-associated virus vector delivering SMN1 gene'
				},
				sponsor: {
					name: "Boston Children's Hospital",
					institutionId: 'boston-childrens',
					contactPerson: 'Dr. Jennifer Park',
					email: 'jpark@childrens.harvard.edu'
				},
				principalInvestigator: {
					name: 'Dr. Jennifer Park',
					institution: "Boston Children's Hospital",
					credentials: ['MD', 'PhD'],
					walletAddress: '0x2345678901234567890123456789012345678901'
				},
				eligibility: {
					minAge: 2,
					maxAge: 10,
					gender: 'all',
					inclusionCriteria: [
						'Confirmed SMA Type 2 diagnosis',
						'Bi-allelic SMN1 deletion',
						'3 copies of SMN2',
						'Baseline HFMSE score 10-45',
						'No prior gene therapy'
					],
					exclusionCriteria: [
						'Anti-AAV9 antibodies >1:50',
						'Significant cardiac involvement',
						'Active respiratory infection',
						'Hepatic dysfunction',
						'Participation in other interventional trials'
					],
					requiredDiagnoses: ['Spinal Muscular Atrophy'],
					requiredLabValues: {
						'Anti-AAV9 Antibodies': '<1:50 titer',
						'ALT/AST': '<2x ULN',
						'Platelet Count': '>100,000/μL'
					}
				},
				design: {
					studyType: 'interventional',
					allocation: 'randomized',
					primaryPurpose: 'treatment',
					masking: 'single',
					enrollmentTarget: 50,
					numberOfArms: 2
				},
				sites: [
					{
						siteId: 'site_001',
						institutionId: 'boston-childrens',
						institutionName: "Boston Children's Hospital",
						country: 'United States',
						principalInvestigator: 'Dr. Jennifer Park',
						status: 'active',
						enrollmentTarget: 25,
						currentEnrollment: 14,
						irbApprovalDate: new Date('2024-05-01'),
						irbApprovalNumber: 'IRB-2024-0234',
						contactInfo: {
							coordinatorName: 'Lisa Thompson',
							email: 'lthompson@childrens.harvard.edu',
							phone: '+1-617-555-0456'
						}
					},
					{
						siteId: 'site_002',
						institutionId: 'great-ormond',
						institutionName: 'Great Ormond Street Hospital',
						country: 'United Kingdom',
						principalInvestigator: 'Dr. Emma Wilson',
						status: 'active',
						enrollmentTarget: 25,
						currentEnrollment: 11,
						irbApprovalDate: new Date('2024-05-15'),
						irbApprovalNumber: 'REC-2024-0567',
						contactInfo: {
							coordinatorName: 'Sarah Davies',
							email: 'sdavies@gosh.nhs.uk',
							phone: '+44-20-555-0678'
						}
					}
				],
				timeline: {
					startDate: new Date('2024-05-01'),
					estimatedCompletionDate: new Date('2026-12-01'),
					primaryCompletionDate: new Date('2026-06-01')
				},
				outcomes: {
					primary: [
						'Change in HFMSE Score at 12 months'
					],
					secondary: [
						'Change in CHOP-INTEND Score',
						'Change in RULM',
						'Motor Milestone Achievement',
						'Pulmonary Function Tests'
					],
					safetyMeasures: [
						'Adverse Events',
						'Hepatotoxicity Monitoring',
						'Thrombocytopenia',
						'Immune Response to AAV9'
					]
				},
				enrollment: {
					total: 25,
					screened: 45,
					randomized: 25,
					completed: 8,
					withdrawn: 2,
					currentByCountry: {
						'United States': 14,
						'United Kingdom': 11
					}
				},
				regulatory: {
					irbApproved: true,
					fdaApproved: true,
					emaApproved: false,
					localApprovals: {
						'United States': true,
						'United Kingdom': true
					},
					dataMonitoringCommittee: true
				},
				funding: {
					totalBudget: 15000000,
					currency: 'USD',
					source: 'FDA Orphan Drug Grant',
					perPatientCost: 300000
				}
			},
			{
				protocolNumber: 'NCT04893789',
				title: 'Digital Therapeutics for Type 2 Diabetes Management: AI-Powered Intervention',
				shortTitle: 'AI Diabetes Management',
				phase: 'phase_3',
				status: 'recruiting',
				condition: 'Type 2 Diabetes Mellitus',
				intervention: {
					type: 'device',
					name: 'MedNexus DiabetesAI Platform',
					description: 'AI-powered digital therapeutic with continuous glucose monitoring integration'
				},
				sponsor: {
					name: 'MedNexus Digital Health',
					institutionId: 'stanford-med',
					contactPerson: 'Dr. Raj Patel',
					email: 'rpatel@stanford.edu'
				},
				principalInvestigator: {
					name: 'Dr. Raj Patel',
					institution: 'Stanford Medical Center',
					credentials: ['MD', 'MPH'],
					walletAddress: '0x3456789012345678901234567890123456789012'
				},
				eligibility: {
					minAge: 18,
					maxAge: 70,
					gender: 'all',
					inclusionCriteria: [
						'Type 2 diabetes diagnosis ≥1 year',
						'HbA1c 7.5-11.0%',
						'On stable oral anti-diabetic medication',
						'Smartphone ownership',
						'Willing to wear CGM device'
					],
					exclusionCriteria: [
						'Type 1 diabetes',
						'Insulin therapy required',
						'Severe diabetic complications',
						'Active eating disorder',
						'Cognitive impairment'
					],
					requiredDiagnoses: ['Type 2 Diabetes Mellitus'],
					requiredLabValues: {
						'HbA1c': '7.5-11.0%',
						'Creatinine': '<2.0 mg/dL',
						'ALT': '<3x ULN'
					}
				},
				design: {
					studyType: 'interventional',
					allocation: 'randomized',
					primaryPurpose: 'treatment',
					masking: 'none',
					enrollmentTarget: 600,
					numberOfArms: 2
				},
				sites: [
					{
						siteId: 'site_001',
						institutionId: 'stanford-med',
						institutionName: 'Stanford Medical Center',
						country: 'United States',
						principalInvestigator: 'Dr. Raj Patel',
						status: 'active',
						enrollmentTarget: 200,
						currentEnrollment: 156,
						irbApprovalDate: new Date('2024-03-01'),
						irbApprovalNumber: 'IRB-2024-0012',
						contactInfo: {
							coordinatorName: 'Maria Gonzalez',
							email: 'mgonzalez@stanford.edu',
							phone: '+1-650-555-0789'
						}
					},
					{
						siteId: 'site_002',
						institutionId: 'mayo-clinic',
						institutionName: 'Mayo Clinic',
						country: 'United States',
						principalInvestigator: 'Dr. Lisa Anderson',
						status: 'active',
						enrollmentTarget: 200,
						currentEnrollment: 143,
						irbApprovalDate: new Date('2024-03-15'),
						irbApprovalNumber: 'IRB-2024-0089',
						contactInfo: {
							coordinatorName: 'John Miller',
							email: 'jmiller@mayo.edu',
							phone: '+1-507-555-0890'
						}
					},
					{
						siteId: 'site_003',
						institutionId: 'karolinska',
						institutionName: 'Karolinska University Hospital',
						country: 'Sweden',
						principalInvestigator: 'Dr. Anders Bergström',
						status: 'active',
						enrollmentTarget: 200,
						currentEnrollment: 118,
						irbApprovalDate: new Date('2024-04-01'),
						irbApprovalNumber: 'EPN-2024-0345',
						contactInfo: {
							coordinatorName: 'Helena Johansson',
							email: 'hjohansson@karolinska.se',
							phone: '+46-8-555-0901'
						}
					}
				],
				timeline: {
					startDate: new Date('2024-03-01'),
					estimatedCompletionDate: new Date('2025-09-01'),
					primaryCompletionDate: new Date('2025-06-01')
				},
				outcomes: {
					primary: [
						'Change in HbA1c from baseline to 6 months'
					],
					secondary: [
						'Time in Range (70-180 mg/dL)',
						'Weight Change',
						'Medication Adherence',
						'Quality of Life (DQOL)',
						'User Engagement Metrics'
					],
					safetyMeasures: [
						'Hypoglycemic Events',
						'Diabetic Ketoacidosis',
						'Adverse Device Effects',
						'Psychiatric Events'
					]
				},
				enrollment: {
					total: 417,
					screened: 523,
					randomized: 417,
					completed: 234,
					withdrawn: 23,
					currentByCountry: {
						'United States': 299,
						'Sweden': 118
					}
				},
				regulatory: {
					irbApproved: true,
					fdaApproved: false, // Digital therapeutic, FDA 510(k) pending
					emaApproved: false,
					localApprovals: {
						'United States': true,
						'Sweden': true
					},
					dataMonitoringCommittee: true
				},
				funding: {
					totalBudget: 12000000,
					currency: 'USD',
					source: 'NIH SBIR Grant + Private Investment',
					perPatientCost: 20000
				}
			}
		];

		// Create trials from mock data
		mockTrials.forEach(trialData => {
			this.createTrial(trialData);
		});

		console.log(`✅ Loaded ${mockTrials.length} mock clinical trials`);
	}
}

// Export singleton instance
export const clinicalTrialService = new ClinicalTrialService();
