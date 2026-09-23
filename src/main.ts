import katex from 'katex/dist/katex.mjs';
import 'katex/dist/katex.min.css';
import './style.css';
import { convertTable, type ConversionResult, TableParseError } from './converter';

const sampleMarkdown = `| 項目 | 内容 | メモ |
| --- | --- | --- |
| サービス名 | note表メーカー | 無料で使えます |
| 対応形式 | Markdown / Excel | ブラウザ内で変換 |
| 使い方 | 貼ってコピー | たったの2ステップ |`;

const desktopAdMarkup = `
<a href="https://px.a8.net/svt/ejp?a8mat=4BCHZR+66O6KI+50H8+614CX" rel="nofollow">
<img border="0" width="200" height="200" alt="" src="https://www23.a8.net/svt/bgt?aid=260923671374&wid=003&eno=01&mid=s00000023390001013000&mc=1"></a>
<img border="0" width="1" height="1" src="https://www10.a8.net/0.gif?a8mat=4BCHZR+66O6KI+50H8+614CX" alt="">
`;

const mobileAdMarkup = `
<a href="https://px.a8.net/svt/ejp?a8mat=4BCHZR+66O6KI+50H8+614CX" rel="nofollow">
<img border="0" width="200" height="200" alt="" src="https://www23.a8.net/svt/bgt?aid=260923671374&wid=003&eno=01&mid=s00000023390001013000&mc=1"></a>
<img border="0" width="1" height="1" src="https://www10.a8.net/0.gif?a8mat=4BCHZR+66O6KI+50H8+614CX" alt="">
`;

const useMobileAd = window.matchMedia('(max-width: 640px)').matches;
const adMarkup = useMobileAd ? mobileAdMarkup : desktopAdMarkup;

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) throw new Error('App root not found');

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#top" aria-label="note表メーカー トップへ">
      <span class="brand-mark" aria-hidden="true">
        <i></i><i></i><i></i><i></i>
      </span>
      <span>note表メーカー</span>
    </a>
    <a class="help-link" href="#how-to">使い方</a>
  </header>

  <main id="top">
    <section class="intro" aria-labelledby="page-title">
      <div class="eyebrow"><span></span> NOTE TABLE MAKER</div>
      <h1 id="page-title">貼るだけで、<br />noteに表を。</h1>
      <p>MarkdownやExcelの表を、noteで使えるKaTeX形式へすぐに変換します。</p>
    </section>

    <section class="workspace" aria-label="表の変換ツール">
      <div class="source-pane">
        <div class="pane-heading">
          <div>
            <span class="step-number">01</span>
            <h2>表を貼り付ける</h2>
          </div>
          <div class="source-actions">
            <button class="text-button" id="sample-button" type="button">サンプル</button>
            <button class="text-button" id="clear-button" type="button">クリア</button>
          </div>
        </div>
        <label class="sr-only" for="source-input">Markdown表またはタブ区切りの表</label>
        <textarea
          id="source-input"
          class="source-input"
          spellcheck="false"
          placeholder="ここに表を貼り付けてください&#10;&#10;Excel・Googleスプレッドシート&#10;または Markdown表に対応しています"
          aria-describedby="privacy-note input-status"
        ></textarea>
        <div class="input-meta">
          <p id="privacy-note">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3M6 10h12v10H6z"/></svg>
            貼り付けた内容はブラウザ内で処理され、サーバーには送信されません。
          </p>
          <span id="format-badge" class="format-badge" hidden></span>
        </div>
        <div id="input-status" class="input-status" role="status" aria-live="polite"></div>
      </div>

      <div class="result-pane">
        <div class="pane-heading">
          <div>
            <span class="step-number">02</span>
            <h2>確認してコピー</h2>
          </div>
          <span id="table-size" class="table-size"></span>
        </div>
        <div class="style-controls" aria-label="表のスタイル">
          <fieldset class="alignment-control">
            <legend>文字揃え</legend>
            <div class="alignment-tabs">
              <label><input type="radio" name="alignment" value="center" checked /><span>中央</span></label>
              <label><input type="radio" name="alignment" value="left" /><span>左</span></label>
              <label><input type="radio" name="alignment" value="right" /><span>右</span></label>
            </div>
          </fieldset>
          <div class="option-controls">
            <label class="header-option">
              <input id="header-option" type="checkbox" />
              <span class="checkbox-mark" aria-hidden="true">
                <svg viewBox="0 0 16 16"><path d="m3.5 8 3 3 6-6" /></svg>
              </span>
              <span>1行目は見出し</span>
            </label>
            <label class="header-option">
              <input id="note-app-option" type="checkbox" />
              <span class="checkbox-mark" aria-hidden="true">
                <svg viewBox="0 0 16 16"><path d="m3.5 8 3 3 6-6" /></svg>
              </span>
              <span>noteアプリ用</span>
            </label>
          </div>
        </div>

        <section class="preview-section" aria-labelledby="preview-title">
          <div class="section-label-row">
            <h3 id="preview-title">参考プレビュー</h3>
            <span>note上の表示と異なる場合があります</span>
          </div>
          <div id="preview" class="preview" aria-live="polite">
            <div class="empty-state">
              <span class="empty-grid" aria-hidden="true"></span>
              <p>表を貼り付けると<br />ここに表示されます</p>
            </div>
          </div>
        </section>

        <section class="code-section" aria-labelledby="code-title">
          <div class="section-label-row">
            <h3 id="code-title">note用コード</h3>
          </div>
          <div class="code-wrap">
            <textarea id="output-code" readonly aria-label="生成されたnote用コード" placeholder="変換後のコードが表示されます"></textarea>
            <button id="copy-button" class="copy-button" type="button" disabled>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
              <span>コードをコピー</span>
            </button>
          </div>
          <p id="copy-status" class="copy-status" role="status" aria-live="polite"></p>
        </section>
      </div>
    </section>

    <aside class="ad-slot ad-slot--${useMobileAd ? 'mobile' : 'desktop'}" aria-label="広告掲載枠">
      <span>[ PR ]</span>
      ${adMarkup}
    </aside>

    <section id="how-to" class="how-to" aria-labelledby="how-to-title">
      <div class="how-to-intro">
        <span class="section-kicker">HOW TO USE</span>
        <h2 id="how-to-title">使い方は、<br />たったの2ステップ。</h2>
      </div>
      <ol class="steps">
        <li>
          <span>1</span>
          <div><h3>表をコピーして貼る</h3><p>Excel、Googleスプレッドシート、またはMarkdownの表をそのまま貼り付けます。</p></div>
        </li>
        <li>
          <span>2</span>
          <div><h3>コードをnoteに貼る</h3><p>生成されたコードをコピーし、noteの記事編集画面へ貼り付ければ完成です。</p></div>
        </li>
      </ol>
    </section>

    <section class="tips" aria-labelledby="tips-title">
      <h2 id="tips-title">きれいに変換するために</h2>
      <div class="tips-list">
        <p><span>01</span>セル結合や色などの書式は引き継がれません。文字だけを変換します。</p>
        <p><span>02</span>幅の広い表は、note上で横スクロール表示になる場合があります。</p>
        <p><span>03</span>iOS版noteでは、数式が正常に表示されない場合があります。</p>
      </div>
    </section>
  </main>

  <footer>
    <a class="brand footer-brand" href="#top">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span>note表メーカー</span>
    </a>
    <p>入力内容を保存・送信することはありません。<br>
    当サイトはアフィリエイト広告を利用しています。</p>
    <small>© 2026 hirameki-tech.com</small>
  </footer>
`;

const sourceInput = document.querySelector<HTMLTextAreaElement>('#source-input')!;
const outputCode = document.querySelector<HTMLTextAreaElement>('#output-code')!;
const preview = document.querySelector<HTMLDivElement>('#preview')!;
const inputStatus = document.querySelector<HTMLDivElement>('#input-status')!;
const formatBadge = document.querySelector<HTMLSpanElement>('#format-badge')!;
const tableSize = document.querySelector<HTMLSpanElement>('#table-size')!;
const copyButton = document.querySelector<HTMLButtonElement>('#copy-button')!;
const copyStatus = document.querySelector<HTMLParagraphElement>('#copy-status')!;
const sampleButton = document.querySelector<HTMLButtonElement>('#sample-button')!;
const clearButton = document.querySelector<HTMLButtonElement>('#clear-button')!;
const alignmentInputs = document.querySelectorAll<HTMLInputElement>('input[name="alignment"]');
const headerOption = document.querySelector<HTMLInputElement>('#header-option')!;
const noteAppOption = document.querySelector<HTMLInputElement>('#note-app-option')!;

const emptyPreview = preview.innerHTML;
let copyStatusTimer: number | undefined;

function showResult(result: ConversionResult): void {
  outputCode.value = result.code;
  copyButton.disabled = false;
  formatBadge.hidden = false;
  formatBadge.textContent = result.format === 'tsv' ? 'Excel / スプレッドシート' : 'Markdown';
  tableSize.textContent = `${result.rows.length}行 × ${result.rows[0].length}列`;
  inputStatus.className = result.warnings.length ? 'input-status warning' : 'input-status success';
  inputStatus.textContent = result.warnings[0] ?? '表を変換しました。';

  preview.classList.remove('has-error', 'is-updated');
  preview.replaceChildren();

  const renderTarget = document.createElement('div');
  renderTarget.className = 'katex-target';
  preview.append(renderTarget);

  katex.render(result.expression, renderTarget, {
    displayMode: true,
    throwOnError: false,
    strict: false,
    trust: false,
    output: 'htmlAndMathml',
  });

  requestAnimationFrame(() => preview.classList.add('is-updated'));
}

function showError(message: string): void {
  outputCode.value = '';
  copyButton.disabled = true;
  formatBadge.hidden = true;
  tableSize.textContent = '';
  inputStatus.className = 'input-status error';
  inputStatus.textContent = message;
  preview.className = 'preview has-error';
  preview.innerHTML = `<div class="error-state"><span aria-hidden="true">!</span><p>表として読み取れませんでした。<br />入力形式を確認してください。</p></div>`;
}

function resetResult(): void {
  outputCode.value = '';
  copyButton.disabled = true;
  formatBadge.hidden = true;
  tableSize.textContent = '';
  inputStatus.className = 'input-status';
  inputStatus.textContent = '';
  preview.className = 'preview';
  preview.innerHTML = emptyPreview;
}

function updateConversion(): void {
  const value = sourceInput.value;
  if (!value.trim()) {
    resetResult();
    return;
  }

  try {
    const alignment = document.querySelector<HTMLInputElement>('input[name="alignment"]:checked')!;
    showResult(convertTable(value, {
      alignment: alignment.value as 'center' | 'left' | 'right',
      firstRowAsHeader: headerOption.checked,
      noteAppMode: noteAppOption.checked,
    }));
  } catch (error) {
    showError(error instanceof TableParseError ? error.message : '変換中にエラーが発生しました。');
  }
}

async function copyCode(): Promise<void> {
  if (!outputCode.value) return;

  try {
    await navigator.clipboard.writeText(outputCode.value);
  } catch {
    outputCode.focus();
    outputCode.select();
    document.execCommand('copy');
  }

  window.clearTimeout(copyStatusTimer);
  copyButton.classList.add('copied');
  copyButton.querySelector('span')!.textContent = 'コピーしました';
  copyStatus.textContent = 'noteの記事編集画面へ貼り付けてください。';

  copyStatusTimer = window.setTimeout(() => {
    copyButton.classList.remove('copied');
    copyButton.querySelector('span')!.textContent = 'コードをコピー';
    copyStatus.textContent = '';
  }, 3000);
}

sourceInput.addEventListener('input', updateConversion);
copyButton.addEventListener('click', copyCode);
alignmentInputs.forEach((input) => input.addEventListener('change', updateConversion));
headerOption.addEventListener('change', updateConversion);
noteAppOption.addEventListener('change', updateConversion);

sampleButton.addEventListener('click', () => {
  sourceInput.value = sampleMarkdown;
  updateConversion();
  sourceInput.focus();
});

clearButton.addEventListener('click', () => {
  sourceInput.value = '';
  resetResult();
  sourceInput.focus();
});
