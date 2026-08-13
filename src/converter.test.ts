import { describe, expect, it } from 'vitest';
import katex from 'katex/dist/katex.mjs';
import {
  convertTable,
  detectFormat,
  escapeKatexText,
  generateNoteCode,
  parseMarkdownTable,
  parseTsv,
  TableParseError,
} from './converter';

describe('detectFormat', () => {
  it('タブを含む入力をTSVとして判定する', () => {
    expect(detectFormat('名前\t年齢')).toBe('tsv');
    expect(detectFormat('| 名前 | 年齢 |')).toBe('markdown');
  });
});

describe('parseMarkdownTable', () => {
  it('区切り行を除外し、インライン記法を表示文字へ変換する', () => {
    const input = `| 名前 | 詳細 |\n| :--- | ---: |\n| **太郎** | [サイト](https://example.com) |`;
    expect(parseMarkdownTable(input).rows).toEqual([
      ['名前', '詳細'],
      ['太郎', 'サイト'],
    ]);
  });

  it('エスケープされたパイプをセル内の文字として扱う', () => {
    const input = `| A | B |\n| --- | --- |\n| a \\| b | c |`;
    expect(parseMarkdownTable(input).rows[1]).toEqual(['a | b', 'c']);
  });

  it('区切り行のない入力をエラーにする', () => {
    expect(() => parseMarkdownTable('| A | B |\n| a | b |')).toThrow(TableParseError);
  });
});

describe('parseTsv', () => {
  it('タブ区切りの空セルを保ったまま解析する', () => {
    expect(parseTsv('名前\t年齢\n太郎\t').rows).toEqual([
      ['名前', '年齢'],
      ['太郎', ''],
    ]);
  });

  it('引用符で囲まれた改行を空白へ変換する', () => {
    expect(parseTsv('名前\tメモ\n太郎\t"一行目\n二行目"').rows[1]).toEqual([
      '太郎',
      '一行目 二行目',
    ]);
  });

  it('短い行を空セルで補い、警告する', () => {
    const result = parseTsv('A\tB\tC\n1\t2');
    expect(result.rows[1]).toEqual(['1', '2', '']);
    expect(result.warnings).toHaveLength(1);
  });
});

describe('KaTeX output', () => {
  it('KaTeXで意味を持つ文字をエスケープする', () => {
    expect(escapeKatexText('A&B_1 {50%} \\ $ # ^ ~')).toBe(
      'A\\&B\\_1 \\{50\\%\\} \\textbackslash{} \\$ \\# \\^{} \\~{}',
    );
  });

  it('noteへ貼り付けられるディスプレイ数式を生成する', () => {
    const result = convertTable('項目\t内容\n名前\t太郎');
    expect(result.code).toContain('$$\n\\newcommand{\\arraystretch}{1.5} %\n\\begin{array}{|c|c|}');
    expect(result.expression).toContain(String.raw`\text{名前} & \text{太郎} \\ \hline`);
    expect(result.code).toContain(String.raw`\text{名前} & \text{太郎} \\\\ \hline`);
    expect(result.code.endsWith('\\end{array}\n$$')).toBe(true);
  });

  it('note用コードでは行区切りだけを4本のバックスラッシュにする', () => {
    const expression = String.raw`\begin{array}{|c|}\hline
\text{A} \\ \hline
\end{array}`;
    const code = generateNoteCode(expression);

    expect(code).toContain(String.raw`\text{A} \\\\ \hline`);
    expect(code).toContain(String.raw`\begin{array}`);
    expect(code).not.toContain(String.raw`\\begin{array}`);
  });

  it('特殊文字と日本語を含む生成結果をKaTeXで描画できる', () => {
    const result = convertTable('項目\t内容\n記号\tA&B_1 {50%} \\ $ # ^ ~\n日本語\tひらめき');
    expect(() =>
      katex.renderToString(result.expression, {
        displayMode: true,
        throwOnError: true,
        strict: false,
        trust: false,
      }),
    ).not.toThrow();
  });
});
