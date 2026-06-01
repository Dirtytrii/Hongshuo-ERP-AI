type AppRuntimeEnv = {
  DEV?: boolean;
  MODE?: string;
  VITE_SHOW_DEMO_CONTROLS?: string;
};

type AppImportMeta = ImportMeta & {
  env?: AppRuntimeEnv;
};

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSY_VALUES = new Set(['0', 'false', 'no', 'off']);

function normalizeFlag(value?: string): boolean | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (TRUTHY_VALUES.has(normalized)) return true;
  if (FALSY_VALUES.has(normalized)) return false;
  return null;
}

function isDemoHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.pages.dev');
}

export function resolveShowDemoControls(
  env: AppRuntimeEnv = (import.meta as AppImportMeta).env ?? {},
  hostname = typeof window === 'undefined' ? '' : window.location.hostname
): boolean {
  const explicitFlag = normalizeFlag(env.VITE_SHOW_DEMO_CONTROLS);
  if (explicitFlag !== null) return explicitFlag;

  return Boolean(env.DEV || env.MODE === 'development' || isDemoHost(hostname));
}

export const SHOW_DEMO_CONTROLS = resolveShowDemoControls();
