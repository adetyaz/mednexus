export const contractAddresses = {
    researchHub: '0x035F1565aeeB03DF80Dfe65aeBF0d03Bec5bf696',
    clinicalTrialHub: '0x55bA3CCf5Ac075D107e9F1843a5f3abea3C050a2'
};

export const testResearchProjects = [
    {
        id: 1,
        title: 'Cancer Research Project',
        description: 'Testing new cancer treatments',
        expectedResults: 'Improved patient outcomes',
        institutions: ['Johns Hopkins', 'Mayo Clinic']
    },
    {
        id: 2,
        title: 'Heart Disease Study',
        description: 'Cardiovascular research initiative',
        expectedResults: 'Better heart medications',
        institutions: ['Cleveland Clinic']
    }
];

export const testClinicalTrials = [
    {
        id: 1,
        title: 'Drug Trial Phase II',
        description: 'Testing new drug efficacy',
        phase: 'Phase II',
        participants: 100,
        duration: '12 months'
    },
    {
        id: 2,
        title: 'Vaccine Study',
        description: 'New vaccine testing',
        phase: 'Phase III',
        participants: 500,
        duration: '18 months'
    }
];