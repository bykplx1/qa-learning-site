import { useState, useCallback } from 'react';

export interface RubricCriterion {
  key: string;
  label: string;
  description: string;
}

export const DEFAULT_RUBRIC: RubricCriterion[] = [
  {
    key: 'clarity',
    label: 'Clarity',
    description: 'Could a complete beginner follow your explanation without confusion?',
  },
  {
    key: 'accuracy',
    label: 'Accuracy',
    description: 'Are the core facts and relationships correct?',
  },
  {
    key: 'analogy',
    label: 'Analogy / example',
    description: 'Did you ground the concept in a concrete example or analogy?',
  },
  {
    key: 'gaps',
    label: 'Gap awareness',
    description: 'Did you notice and flag anything you were uncertain about?',
  },
];

interface Props {
  conceptSlug: string;
  wordTarget: number;
  rubric?: RubricCriterion[];
  showGapPrompt?: boolean;
}

type Phase = 'writing' | 'scoring' | 'saved' | 'error';

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function FeynmanEditor({
  conceptSlug,
  wordTarget,
  rubric = DEFAULT_RUBRIC,
  showGapPrompt = false,
}: Props) {
  const [body, setBody] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<Phase>('writing');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [gapQuestions, setGapQuestions] = useState<string[] | null>(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapRefused, setGapRefused] = useState(false);

  const wc = wordCount(body);
  const targetMet = wc >= wordTarget;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!targetMet) return;
      setPhase('scoring');
    },
    [targetMet],
  );

  const handleGapPrompt = useCallback(async () => {
    setGapLoading(true);
    setGapRefused(false);
    try {
      const res = await fetch('/api/explain/gap-prompt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ explanation: body }),
      });
      if (!res.ok) {
        setGapRefused(true);
        return;
      }
      const data = (await res.json()) as
        | { questions: string[] }
        | { refused: true; reason: string };
      if ('refused' in data && data.refused) {
        setGapRefused(true);
      } else if ('questions' in data) {
        setGapQuestions(data.questions);
      }
    } catch {
      setGapRefused(true);
    } finally {
      setGapLoading(false);
    }
  }, [body]);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg(null);
      try {
        const res = await fetch('/api/explain/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ conceptSlug, bodyMd: body, rubricScores: scores }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { id: string };
        setSavedId(data.id);
        setPhase('saved');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
        setPhase('scoring');
      }
    },
    [conceptSlug, body, scores],
  );

  if (phase === 'saved') {
    return (
      <div
        data-testid="feynman-saved"
        style={{
          padding: '28px 24px',
          background: 'var(--pass-soft)',
          borderRadius: 10,
          border: '1px solid var(--pass)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 22,
            color: 'var(--pass-strong)',
            margin: '0 0 8px',
          }}
        >
          Explanation saved
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink-2)',
            fontFamily: 'var(--mono)',
            margin: 0,
          }}
        >
          id: {savedId}
        </p>

        {showGapPrompt && !gapQuestions && !gapRefused && (
          <button
            type="button"
            onClick={handleGapPrompt}
            disabled={gapLoading}
            className="btn btn--secondary"
            data-testid="gap-prompt-btn"
            style={{ marginTop: 16 }}
          >
            {gapLoading ? 'Loading…' : 'Get follow-up questions'}
          </button>
        )}

        {gapRefused && (
          <p
            data-testid="gap-prompt-refused"
            style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}
          >
            Couldn't generate questions right now.
          </p>
        )}

        {gapQuestions && gapQuestions.length > 0 && (
          <div
            data-testid="gap-prompt-questions"
            style={{ marginTop: 18, textAlign: 'left' }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              Follow-up questions:
            </p>
            <ol style={{ paddingLeft: 20, margin: 0, display: 'grid', gap: 6 }}>
              {gapQuestions.map((q, i) => (
                <li key={i} style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  {q}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'scoring') {
    return (
      <form onSubmit={handleSave} data-testid="feynman-rubric">
        <div
          style={{
            padding: '16px 18px',
            background: 'var(--paper-2)',
            borderRadius: 8,
            border: '1px solid var(--rule)',
            marginBottom: 20,
          }}
        >
          <span className="eyebrow">your explanation · {wc} words</span>
          <p
            style={{
              marginTop: 10,
              fontSize: 14,
              color: 'var(--ink-2)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}
          >
            {body}
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 20,
              fontWeight: 400,
              margin: '0 0 4px',
              color: 'var(--ink)',
            }}
          >
            Self-score your explanation
          </h3>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 16px', fontFamily: 'var(--mono)' }}>
            Be honest — this is private. 1 = needs work, 5 = nailed it.
          </p>

          <div style={{ display: 'grid', gap: 14 }}>
            {rubric.map((criterion) => (
              <div key={criterion.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label
                    htmlFor={`rubric-${criterion.key}`}
                    style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}
                  >
                    {criterion.label}
                  </label>
                  <span
                    style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}
                  >
                    {scores[criterion.key] ?? '—'} / 5
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 8px', lineHeight: 1.4 }}>
                  {criterion.description}
                </p>
                <div
                  style={{ display: 'flex', gap: 8 }}
                  role="group"
                  aria-label={`${criterion.label} score`}
                  data-testid={`rubric-score-${criterion.key}`}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScores((prev) => ({ ...prev, [criterion.key]: n }))}
                      aria-pressed={scores[criterion.key] === n}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid var(--rule)',
                        background:
                          scores[criterion.key] === n ? 'var(--accent)' : 'var(--paper-2)',
                        color: scores[criterion.key] === n ? 'white' : 'var(--ink-2)',
                        fontFamily: 'var(--mono)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 120ms ease, color 120ms ease',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            style={{
              marginBottom: 14,
              color: 'var(--error)',
              fontSize: 13,
              fontFamily: 'var(--mono)',
            }}
          >
            {errorMsg}
          </div>
        )}

        <button type="submit" className="btn btn--primary" data-testid="feynman-save">
          Save scores
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-testid="feynman-form">
      <div style={{ marginBottom: 12 }}>
        <label
          htmlFor="feynman-body"
          style={{ fontSize: 13, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}
        >
          Write your explanation below. Aim for ~{wordTarget} words.
        </label>
        <textarea
          id="feynman-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="Explain this concept in plain language, as if teaching someone who has never heard of it…"
          className="textarea"
          data-testid="feynman-textarea"
          style={{ width: '100%' }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 12,
            fontFamily: 'var(--mono)',
            color: targetMet ? 'var(--pass-strong)' : 'var(--ink-3)',
          }}
          aria-live="polite"
          data-testid="feynman-wordcount"
        >
          <span>
            {wc} / {wordTarget} words
          </span>
          {targetMet && <span>Target reached</span>}
        </div>
      </div>

      <button
        type="submit"
        className="btn btn--primary"
        disabled={!targetMet}
        data-testid="feynman-submit"
      >
        Submit explanation
      </button>
    </form>
  );
}
