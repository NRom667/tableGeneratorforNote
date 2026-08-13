export type InputFormat = 'markdown' | 'tsv';

export interface ConversionResult {
  format: InputFormat;
  rows: string[][];
  expression: string;
  code: string;
  warnings: string[];
}

export class TableParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TableParseError';
  }
}

export function detectFormat(input: string): InputFormat {
  return input.includes('\t') ? 'tsv' : 'markdown';
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\\([\\`*{}\[\]()#+\-.!_|>])/g, '$1')
    .trim();
}

function splitMarkdownRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];

    if (character === '\\' && next === '|') {
      current += '\\|';
      index += 1;
      continue;
    }

    if (character === '|') {
      cells.push(current);
      current = '';
      continue;
    }

    current += character;
  }

  cells.push(current);

  if (cells[0]?.trim() === '') cells.shift();
  if (cells.at(-1)?.trim() === '') cells.pop();

  return cells.map(stripInlineMarkdown);
}

function isSeparatorRow(row: string[]): boolean {
  return row.length > 0 && row.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

export function parseMarkdownTable(input: string): { rows: string[][]; warnings: string[] } {
  const lines = input
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new TableParseError('Markdown表は、見出し行と区切り行を含めて貼り付けてください。');
  }

  const parsedRows = lines.map(splitMarkdownRow);
  const separatorIndex = parsedRows.findIndex(isSeparatorRow);

  if (separatorIndex !== 1) {
    throw new TableParseError('Markdown表の2行目に「---」を使った区切り行が見つかりません。');
  }

  const rows = parsedRows.filter((_, index) => index !== separatorIndex);
  if (rows.some((row) => row.length < 2)) {
    throw new TableParseError('2列以上のMarkdown表を貼り付けてください。');
  }

  return normalizeRows(rows);
}

export function parseTsv(input: string): { rows: string[][]; warnings: string[] } {
  const source = input.replace(/\r\n?/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === '\t' && !quoted) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if (character === '\n' && !quoted) {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += character === '\n' ? ' ' : character;
  }

  row.push(cell.trim());
  rows.push(row);

  while (rows.length > 0 && rows.at(-1)?.every((value) => value === '')) rows.pop();

  if (rows.length === 0 || Math.max(...rows.map((item) => item.length)) < 2) {
    throw new TableParseError('Excelまたはスプレッドシートから、2列以上のセルをコピーしてください。');
  }

  return normalizeRows(rows);
}

function normalizeRows(rows: string[][]): { rows: string[][]; warnings: string[] } {
  const columnCount = Math.max(...rows.map((row) => row.length));
  const hasUnevenRows = rows.some((row) => row.length !== columnCount);
  const normalized = rows.map((row) => [
    ...row,
    ...Array.from({ length: columnCount - row.length }, () => ''),
  ]);

  return {
    rows: normalized,
    warnings: hasUnevenRows ? ['列数が異なる行は、末尾を空のセルで補いました。'] : [],
  };
}

export function escapeKatexText(value: string): string {
  const replacements: Record<string, string> = {
    '\\': '\\textbackslash{}',
    '{': '\\{',
    '}': '\\}',
    '$': '\\$',
    '%': '\\%',
    '#': '\\#',
    '&': '\\&',
    '_': '\\_',
    '^': '\\^{}',
    '~': '\\~{}',
  };

  return value.replace(/[\\{}$%#&_^~]/g, (character) => replacements[character]);
}

export function generateKatexExpression(rows: string[][]): string {
  const columnCount = rows[0]?.length ?? 0;
  if (columnCount === 0) return '';

  const columns = `|${Array.from({ length: columnCount }, () => 'c').join('|')}|`;
  const body = rows
    .map((row) => `${row.map((cell) => `\\text{${escapeKatexText(cell)}}`).join(' & ')} \\\\ \\hline`)
    .join('\n');

  return `\\begin{array}{${columns}}\n\\hline\n${body}\n\\end{array}`;
}

export function generateNoteCode(expression: string): string {
  const katexRowBreak = String.raw`\\ \hline`;
  const notePasteSafeRowBreak = String.raw`\\\\ \hline`;
  const pasteSafeExpression = expression.replaceAll(katexRowBreak, notePasteSafeRowBreak);

  return `$$\n${pasteSafeExpression}\n$$`;
}

export function convertTable(input: string, format = detectFormat(input)): ConversionResult {
  const parsed = format === 'tsv' ? parseTsv(input) : parseMarkdownTable(input);
  const expression = generateKatexExpression(parsed.rows);

  return {
    format,
    rows: parsed.rows,
    expression,
    code: generateNoteCode(expression),
    warnings: parsed.warnings,
  };
}
