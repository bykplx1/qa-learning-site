export interface SavePromptInput {
  status: 'idle' | 'in-progress' | 'summary' | string;
  signedIn: boolean | null;
  dismissed: boolean;
}

export function shouldShowSavePrompt({ status, signedIn, dismissed }: SavePromptInput): boolean {
  if (status !== 'summary') return false;
  if (signedIn !== false) return false;
  if (dismissed) return false;
  return true;
}

export const SAVE_PROMPT_DISMISSED_KEY = 'quiz_save_prompt_dismissed';
