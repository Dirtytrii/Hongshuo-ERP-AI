import { describe, expect, it } from 'vitest';
import { resolveShowDemoControls } from './demoControls';

describe('resolveShowDemoControls', () => {
  it('shows demo controls in local development by default', () => {
    expect(resolveShowDemoControls({ DEV: true, MODE: 'development' }, 'localhost')).toBe(true);
  });

  it('shows demo controls on Cloudflare Pages preview/demo domains by default', () => {
    expect(resolveShowDemoControls({ MODE: 'production' }, 'hongshuo-erp-ai.pages.dev')).toBe(true);
  });

  it('hides demo controls on custom production domains by default', () => {
    expect(resolveShowDemoControls({ MODE: 'production' }, 'erp.hongshuo.example')).toBe(false);
  });

  it('allows production builds to hide demo controls explicitly', () => {
    expect(
      resolveShowDemoControls({ MODE: 'production', VITE_SHOW_DEMO_CONTROLS: 'false' }, 'hongshuo-erp-ai.pages.dev')
    ).toBe(false);
  });

  it('allows demo deployments to enable controls explicitly on any host', () => {
    expect(resolveShowDemoControls({ MODE: 'production', VITE_SHOW_DEMO_CONTROLS: 'true' }, 'demo.example.com')).toBe(
      true
    );
  });
});
