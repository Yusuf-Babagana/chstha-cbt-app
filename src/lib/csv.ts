import { parse } from 'csv-parse/sync';

export type ParsedQuestion = { text: string; options: string[]; correct: number };
export type RowError = { row: number; message: string };

function readCsv(text: string): Record<string, string>[] {
  return parse(text, { columns: (h: string[]) => h.map((x) => x.trim()), skip_empty_lines: true, trim: true, bom: true });
}

/**
 * Question CSV columns: text, option1..optionN (2-6), correct.
 * `correct` is the zero-based index of the right option (0 = option1).
 */
export function parseQuestionsCsv(text: string): { questions: ParsedQuestion[]; errors: RowError[] } {
  const rows = readCsv(text);
  const questions: ParsedQuestion[] = [];
  const errors: RowError[] = [];

  rows.forEach((row, i) => {
    const line = i + 2; // header is line 1
    const qText = (row.text ?? '').trim();
    const options = Object.keys(row)
      .filter((k) => /^option\d+$/i.test(k))
      .sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6)))
      .map((k) => (row[k] ?? '').trim())
      .filter(Boolean);
    const correct = Number(row.correct);

    if (!qText) return errors.push({ row: line, message: 'Question text is empty' });
    if (options.length < 2) return errors.push({ row: line, message: 'At least two options are required' });
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length)
      return errors.push({ row: line, message: `"correct" must be a number from 0 to ${options.length - 1}` });
    questions.push({ text: qText, options, correct });
  });

  return { questions, errors };
}

export type ParsedStudent = { username: string; password: string; fullName: string | null };

/** Student CSV columns: username, password, fullName (optional). */
export function parseStudentsCsv(text: string): { students: ParsedStudent[]; errors: RowError[] } {
  const rows = readCsv(text);
  const students: ParsedStudent[] = [];
  const errors: RowError[] = [];
  const seen = new Set<string>();

  rows.forEach((row, i) => {
    const line = i + 2;
    const username = (row.username ?? '').trim();
    const password = (row.password ?? '').trim();
    if (!username || !password) return errors.push({ row: line, message: 'username and password are required' });
    if (seen.has(username.toLowerCase())) return errors.push({ row: line, message: `Duplicate username "${username}"` });
    seen.add(username.toLowerCase());
    students.push({ username, password, fullName: (row.fullName ?? '').trim() || null });
  });

  return { students, errors };
}
