// =====================================================
// Institution Registration Helpers
// Auto-generates IDs like 'st-marys-london' from names
// =====================================================

/**
 * Generate institution ID from name using derived rune pattern
 * @param name - Institution name like "St. Mary's Hospital London"
 * @returns Generated ID like "st-marys-hospital-london"
 */
export function generateInstitutionId(name: string): string {
    return name
        .toLowerCase()                    // "St. Mary's Hospital London" -> "st. mary's hospital london"
        .replace(/'/g, '')               // Remove apostrophes: "st. marys hospital london"
        .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-')            // Replace whitespace with hyphens: "st-marys-hospital-london"
        .replace(/-+/g, '-')             // Remove duplicate hyphens
        .replace(/^-|-$/g, '');          // Remove leading/trailing hyphens
}

/**
 * Extract license prefix for verification matching
 * @param licenseNumber - License like "UK-NHS-007842"
 * @returns Prefix like "UK-NHS"
 */
export function extractLicensePrefix(licenseNumber: string): string {
    if (!licenseNumber) return '';
    
    // Pattern: UK-NHS-007842 -> UK-NHS
    const match = licenseNumber.match(/^([A-Z]{2,3}-[A-Z]{2,4})-/);
    if (match) {
        return match[1];
    }
    
    // Fallback: just take first part before hyphen
    const parts = licenseNumber.split('-');
    return parts[0] || '';
}

/**
 * Validate license format based on country patterns
 * @param licenseNumber - License to validate
 * @param country - Country name
 * @returns True if format looks valid
 */
export function validateLicenseFormat(licenseNumber: string, country: string): boolean {
    if (!licenseNumber) return false;
    
    const countryPatterns: Record<string, RegExp> = {
        'United Kingdom': /^UK-[A-Z]{2,4}-\d+$/,
        'United States': /^US-[A-Z]{2,4}-\d+$/,
        'Canada': /^CA-[A-Z]{2,4}-\d+$/,
        'Australia': /^AU-[A-Z]{2,4}-\d+$/,
        'Germany': /^DE-[A-Z]{2,4}-\d+$/,
        'Japan': /^JP-[A-Z]{2,4}-\d+$/
    };
    
    const pattern = countryPatterns[country];
    return pattern ? pattern.test(licenseNumber) : true; // Allow unknown countries
}

/**
 * Get expected license prefix for a country
 * @param country - Country name
 * @returns Expected prefix like "UK-NHS"
 */
export function getExpectedLicensePrefix(country: string): string {
    const countryPrefixes: Record<string, string> = {
        'United Kingdom': 'UK-NHS',
        'United States': 'US-STATE',
        'Canada': 'CA-HOSP',
        'Australia': 'AU-HOSP',
        'Germany': 'DE-HOSP',
        'Japan': 'JP-HOSP'
    };
    
    return countryPrefixes[country] || 'XX-HOSP';
}

// Test the functions with demo data (development only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.log('🧪 Testing ID generation:');
    console.log(generateInstitutionId("St. Mary's Hospital London")); // "st-marys-hospital-london"
    console.log(generateInstitutionId('Mercy General Hospital')); // "mercy-general-hospital"
    console.log(generateInstitutionId('Toronto General Hospital')); // "toronto-general-hospital"
    
    console.log('🧪 Testing license prefix extraction:');
    console.log(extractLicensePrefix('UK-NHS-007842')); // "UK-NHS"
    console.log(extractLicensePrefix('CA-HOSP-092847')); // "CA-HOSP"
    console.log(extractLicensePrefix('US-STATE-123456')); // "US-STATE"
}