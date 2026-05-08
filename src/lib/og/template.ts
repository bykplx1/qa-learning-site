export interface OgInput {
  title: string;
  category: string;
}

const PAPER = '#FBF7F2';
const INK = '#2A2724';
const INK_3 = '#6B655F';
const ACCENT = '#E5704A';
const RULE = '#E8E1D7';

type El = { type: string; props: Record<string, unknown> };

function el(type: string, props: Record<string, unknown>, ...children: unknown[]): El {
  if (children.length === 0) return { type, props: { ...props } };
  return { type, props: { ...props, children: children.length === 1 ? children[0] : children } };
}

export function renderOgTemplate(input: OgInput): El {
  return el(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: PAPER,
        padding: '80px',
        fontFamily: 'Inter',
        color: INK,
        position: 'relative',
      },
    },
    el('div', {
      style: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '12px',
        height: '100%',
        backgroundColor: ACCENT,
      },
    }),
    el(
      'div',
      {
        style: {
          display: 'flex',
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: INK_3,
        },
      },
      input.category,
    ),
    el(
      'div',
      {
        style: {
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          fontSize: '76px',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginTop: '40px',
          marginBottom: '40px',
        },
      },
      input.title,
    ),
    el(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          paddingTop: '32px',
          borderTop: `2px solid ${RULE}`,
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '-0.01em',
        },
      },
      el('div', {
        style: {
          width: '20px',
          height: '20px',
          backgroundColor: ACCENT,
          marginRight: '14px',
          transform: 'rotate(45deg)',
        },
      }),
      el('div', { style: { display: 'flex' } }, 'QA Learning'),
    ),
  );
}
