import { describe, it, expect } from 'vitest';
import { shouldShowSavePrompt } from './save-prompt';

describe('shouldShowSavePrompt', () => {
  it('hides when quiz is not on summary screen', () => {
    expect(shouldShowSavePrompt({ status: 'in-progress', signedIn: false, dismissed: false })).toBe(false);
    expect(shouldShowSavePrompt({ status: 'idle', signedIn: false, dismissed: false })).toBe(false);
  });

  it('hides when the user is signed in', () => {
    expect(shouldShowSavePrompt({ status: 'summary', signedIn: true, dismissed: false })).toBe(false);
  });

  it('hides while session state is still loading (signedIn === null)', () => {
    expect(shouldShowSavePrompt({ status: 'summary', signedIn: null, dismissed: false })).toBe(false);
  });

  it('hides after the user dismisses it', () => {
    expect(shouldShowSavePrompt({ status: 'summary', signedIn: false, dismissed: true })).toBe(false);
  });

  it('shows for an anonymous learner on the summary screen', () => {
    expect(shouldShowSavePrompt({ status: 'summary', signedIn: false, dismissed: false })).toBe(true);
  });
});
