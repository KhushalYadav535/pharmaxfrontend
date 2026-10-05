// Dynamic Medical Specialty & Category Mapping Engine for Biocros Detailing

export interface DetailingCategory {
  id?: string;
  name: string;
  code: string;
  description?: string;
  productNames: string[];
  doctorKeywords: string[];
  color?: string;
  isActive?: boolean;
}

export const DEFAULT_CATEGORIES: DetailingCategory[] = [
  {
    id: 'cat-gyno',
    name: 'Gynecology & Obstetrics',
    code: 'GYNECOLOGY',
    description: 'Maternal health, reproductive support, prenatal care, and gynecological formulations.',
    productNames: [
      'ARGICROS PINK SACHET',
      'ARGICROS BLUE SACHET',
      'BIOFIT PLUS F',
      'HEMOVAC SYRUP',
      'HEMOVAC TABLET',
      'CALCICAL TABLET',
      'VEEPROS D3 CAPSULE',
      'VEEPROS SACHET',
      'VEEPROS D3 NANOSHOTS',
      'ALKATAGE 200 ml',
      'PNCROS DRS CAPSULE',
      'BIOSPORE SACHET'
    ],
    doctorKeywords: ['gyno', 'gynecology', 'gynaecology', 'obstetrics', 'obg', 'ob-gyn', 'consultant gynecologist', 'women health'],
    color: '#EC4899',
  },
  {
    id: 'cat-genmed',
    name: 'General Medicine',
    code: 'GENERAL_MEDICINE',
    description: 'Internal medicine, adult general healthcare, anti-infectives, and chronic therapeutics.',
    productNames: [
      'PNCROS 40',
      'PNCROS DRS CAPSULE',
      'BENZYLAC TABLET',
      'BENZYLAC SYRUP',
      'BIOFIT PLUS M',
      'BIOFIT PLUS F',
      'BIOSPORE TABLET',
      'BIOSPORE SACHET',
      'BIOSPORE 4 TABLET',
      'BIOSPORE 4 SACHET',
      'BRENZ POWDER',
      'CALCICAL TABLET',
      'HEMOVAC SYRUP',
      'HEMOVAC TABLET',
      'MONTECROS L',
      'RINOVAC TABLET',
      'RINOVAC SUSPENSION',
      'VEEPROS D3 CAPSULE',
      'VEEPROS D3 NANOSHOTS',
      'ALKATAGE 200 ml'
    ],
    doctorKeywords: ['general medicine', 'internal medicine', 'general physician', 'consultant physician', 'consultant specialist', 'general practitioner', 'physician', 'family medicine'],
    color: '#2563EB',
  },
  {
    id: 'cat-pediatric',
    name: 'Pediatrics',
    code: 'PEDIATRICS',
    description: 'Child health, pediatric antibiotics, drops, respiratory, and pediatric suspensions.',
    productNames: [
      'RINOVAC DROP',
      'RINOVAC SUSPENSION',
      'BENZYLAC SYRUP',
      'BIOSPORE SACHET',
      'BIOSPORE 4 SACHET',
      'BRENZ POWDER',
      'MONTECROS L',
      'VEEPROS D3 NANOSHOTS',
      'HEMOVAC SYRUP'
    ],
    doctorKeywords: ['pediatrics', 'pediatrician', 'paediatrics', 'paediatrician', 'child specialist', 'child'],
    color: '#F59E0B',
  },
  {
    id: 'cat-gastro',
    name: 'Gastroenterology',
    code: 'GASTROENTEROLOGY',
    description: 'Digestive tract health, probiotics, acid reflux, and enteric stabilization.',
    productNames: [
      'BIOSPORE SACHET',
      'BIOSPORE TABLET',
      'BIOSPORE 4 SACHET',
      'BIOSPORE 4 TABLET',
      'PNCROS 40',
      'PNCROS DRS CAPSULE',
      'ALKATAGE 200 ml',
      'BRENZ POWDER'
    ],
    doctorKeywords: ['gastroenterology', 'gastro', 'gastroenterologist', 'hepatology'],
    color: '#9333EA',
  },
  {
    id: 'cat-ent',
    name: 'ENT & Respiratory',
    code: 'ENT',
    description: 'Ear, nose, throat, anti-allergic, and respiratory therapies.',
    productNames: [
      'MONTECROS L',
      'RINOVAC TABLET',
      'RINOVAC SUSPENSION',
      'RINOVAC DROP',
      'BENZYLAC TABLET',
      'BENZYLAC SYRUP'
    ],
    doctorKeywords: ['ent', 'ent specialist', 'otolaryngology', 'otorhinolaryngology', 'pulmonology', 'chest physician'],
    color: '#059669',
  },
  {
    id: 'cat-ortho',
    name: 'Orthopedics',
    code: 'ORTHOPEDICS',
    description: 'Bone density, calcium metabolism, joint health, and high-dose vitamin D3.',
    productNames: [
      'CALCICAL TABLET',
      'VEEPROS D3 CAPSULE',
      'VEEPROS SACHET',
      'VEEPROS D3 NANOSHOTS',
      'BENZYLAC TABLET'
    ],
    doctorKeywords: ['orthopedics', 'orthopaedics', 'orthopedic surgeon', 'ortho', 'bone', 'joint', 'general surgery', 'consultant surgeon'],
    color: '#EA580C',
  },
  {
    id: 'cat-cardio',
    name: 'Cardiology',
    code: 'CARDIOLOGY',
    description: 'Cardiovascular therapeutics, arterial wellness, and metabolic support.',
    productNames: [
      'ARGICROS PINK SACHET',
      'BIOFIT PLUS M',
      'VEEPROS D3 CAPSULE'
    ],
    doctorKeywords: ['cardiology', 'cardiologist', 'heart', 'cardiac'],
    color: '#E11D48',
  },
  {
    id: 'cat-derma',
    name: 'Dermatology',
    code: 'DERMATOLOGY',
    description: 'Skin health, anti-fungal, micro-nutritional, and restorative formulations.',
    productNames: [
      'BENZYLAC TABLET',
      'BIOFIT PLUS F',
      'VEEPROS D3 CAPSULE',
      'BIOSPORE TABLET'
    ],
    doctorKeywords: ['dermatology', 'dermatologist', 'skin', 'cosmetologist'],
    color: '#D97706',
  }
];

// Fallback for legacy constants if imported
export const SPECIALTY_CATEGORIES: Record<string, any> = {
  ALL: { key: 'ALL', label: 'All Products', shortLabel: 'All', badgeBg: '#F1F5F9', badgeText: '#334155', badgeBorder: '#CBD5E1' },
  GYNECOLOGY: { key: 'GYNECOLOGY', label: 'Gynecology & Obstetrics', shortLabel: 'Gyno', badgeBg: '#FDF2F8', badgeText: '#BE185D', badgeBorder: '#FBCFE8' },
  GENERAL_MEDICINE: { key: 'GENERAL_MEDICINE', label: 'General Medicine', shortLabel: 'Gen Med', badgeBg: '#EFF6FF', badgeText: '#1D4ED8', badgeBorder: '#BFDBFE' },
  PEDIATRICS: { key: 'PEDIATRICS', label: 'Pediatrics', shortLabel: 'Pediatric', badgeBg: '#FEF3C7', badgeText: '#B45309', badgeBorder: '#FDE68A' },
  GASTROENTEROLOGY: { key: 'GASTROENTEROLOGY', label: 'Gastroenterology', shortLabel: 'Gastro', badgeBg: '#FAF5FF', badgeText: '#7E22CE', badgeBorder: '#E9D5FF' },
  ENT: { key: 'ENT', label: 'ENT & Respiratory', shortLabel: 'ENT', badgeBg: '#ECFDF5', badgeText: '#047857', badgeBorder: '#A7F3D0' },
  ORTHOPEDICS: { key: 'ORTHOPEDICS', label: 'Orthopedics', shortLabel: 'Ortho', badgeBg: '#FFF7ED', badgeText: '#C2410C', badgeBorder: '#FED7AA' },
  CARDIOLOGY: { key: 'CARDIOLOGY', label: 'Cardiology', shortLabel: 'Cardio', badgeBg: '#FFF1F2', badgeText: '#BE123C', badgeBorder: '#FECDD3' },
  DERMATOLOGY: { key: 'DERMATOLOGY', label: 'Dermatology', shortLabel: 'Derma', badgeBg: '#FEFCE8', badgeText: '#A16207', badgeBorder: '#FEF08A' },
};

/**
 * Normalizes any free-form Doctor Specialty or Category string into a matching Detailing Category Code.
 * Matches against dynamic categories array if provided, otherwise matches default categories.
 */
export function normalizeDoctorSpecialty(
  specialty?: string,
  category?: string,
  categories: DetailingCategory[] = DEFAULT_CATEGORIES
): string {
  const text = `${specialty || ''} ${category || ''}`.trim().toLowerCase();
  if (!text) return 'ALL';

  for (const cat of categories) {
    if (!cat.code || cat.code === 'ALL') continue;
    // Check direct name match
    if (text.includes(cat.name.toLowerCase()) || text.includes(cat.code.toLowerCase())) {
      return cat.code;
    }
    // Check keywords
    if (cat.doctorKeywords && Array.isArray(cat.doctorKeywords)) {
      for (const kw of cat.doctorKeywords) {
        if (text.includes(kw.toLowerCase())) {
          return cat.code;
        }
      }
    }
  }

  return 'ALL';
}

/**
 * Checks whether a product name matches a given category code in the dynamic categories list.
 */
export function isProductInSpecialty(
  productName: string,
  categoryCode: string,
  categories: DetailingCategory[] = DEFAULT_CATEGORIES
): boolean {
  if (!categoryCode || categoryCode === 'ALL') return true;
  if (!productName) return false;

  const cleanName = productName.trim().toUpperCase();
  const cat = categories.find(c => c.code === categoryCode || c.id === categoryCode);
  if (!cat || !cat.productNames || cat.productNames.length === 0) return false;

  return cat.productNames.some(p => {
    const cp = p.trim().toUpperCase();
    return cleanName === cp || cleanName.includes(cp) || cp.includes(cleanName);
  });
}

/**
 * Filters a list of content slides by dynamic category and/or doctor-specific product selection.
 */
export function filterContentBySpecialty(
  contents: any[],
  categoryCode: string,
  docProducts?: string[],
  categories: DetailingCategory[] = DEFAULT_CATEGORIES
): any[] {
  if (!contents || contents.length === 0) return [];

  // 1. If doctor has specific pre-selected products, prioritize them if matching slides exist
  if (docProducts && docProducts.length > 0) {
    const selectedNormalized = docProducts.map(p => p.trim().toUpperCase());
    const matched = contents.filter(c => {
      const pName = (c.productName || c.title || '').toUpperCase();
      return selectedNormalized.some(sel => pName.includes(sel) || sel.includes(pName));
    });
    if (matched.length > 0 && categoryCode === 'DOCTOR_FOCUS') {
      return matched;
    }
  }

  // 2. If ALL, return all active contents
  if (!categoryCode || categoryCode === 'ALL') {
    return contents;
  }

  // 3. Filter by category's mapped products
  const filtered = contents.filter(c => {
    const pName = c.productName || c.title || '';
    return isProductInSpecialty(pName, categoryCode, categories);
  });

  // If no items match, gracefully fallback to all content so MR never sees a blank screen
  return filtered.length > 0 ? filtered : contents;
}

/**
 * Computes product slide count per dynamic category for quick badge counters.
 */
export function getSpecialtySlideCounts(
  contents: any[],
  categories: DetailingCategory[] = DEFAULT_CATEGORIES
): Record<string, number> {
  const counts: Record<string, number> = { ALL: contents.length };

  for (const cat of categories) {
    counts[cat.code] = contents.filter(c =>
      isProductInSpecialty(c.productName || c.title || '', cat.code, categories)
    ).length;
  }

  return counts;
}
