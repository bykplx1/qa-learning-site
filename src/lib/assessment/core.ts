import type { QuizQuestion } from '../quiz/schema.js';

export type AnswerValue = number | number[] | null;

export function isCorrect(question: QuizQuestion, answer: AnswerValue): boolean {
  if (answer === null) return false;
  const expected = question.answer;
  if (Array.isArray(expected)) {
    if (!Array.isArray(answer)) return false;
    if (expected.length !== answer.length) return false;
    return expected.every((v) => (answer as number[]).includes(v));
  }
  if (Array.isArray(answer)) return false;
  return expected === answer;
}

export function score(
  questions: QuizQuestion[],
  answers: AnswerValue[]
): { correct: number; total: number } {
  const correct = questions.filter((q, i) => isCorrect(q, answers[i])).length;
  return { correct, total: questions.length };
}
