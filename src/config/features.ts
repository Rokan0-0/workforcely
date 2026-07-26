export interface FeatureFlags {
  workforceMSMode: boolean; // Single primary toggle: ON = WorkforceMS (LMS + HMO + AI), OFF = Full HR Suite
  enableLMS: boolean;
  enableAIAssistant: boolean;
  enableHMO: boolean;
  enableDisciplinary: boolean;
  enablePayroll: boolean;
  enableRecruitment: boolean;
  enableAttendance: boolean;
  enableMemos: boolean;
  enablePerformance: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  workforceMSMode: true, // Default to WorkforceMS Standalone mode
  enableLMS: true,
  enableAIAssistant: true,
  enableHMO: true,
  enableDisciplinary: false,
  enablePayroll: false,
  enableRecruitment: false,
  enableAttendance: false,
  enableMemos: false,
  enablePerformance: false,
};

export const getStoredFeatureFlags = (): FeatureFlags => {
  if (typeof window === 'undefined') return DEFAULT_FEATURE_FLAGS;
  try {
    const stored = localStorage.getItem('workforceMS_feature_flags');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_FEATURE_FLAGS, ...parsed };
    }
  } catch (err) {
    console.error('Failed to read feature flags from localStorage', err);
  }
  return DEFAULT_FEATURE_FLAGS;
};

export const setStoredFeatureFlags = (flags: FeatureFlags): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('workforceMS_feature_flags', JSON.stringify(flags));
  } catch (err) {
    console.error('Failed to write feature flags to localStorage', err);
  }
};
