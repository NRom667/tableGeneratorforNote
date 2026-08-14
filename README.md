# note表メーカー

Markdown、Excel、Googleスプレッドシートの表を、noteで利用できるKaTeX形式へ変換するブラウザツールです。入力内容はすべてブラウザ内で処理し、サーバーには送信しません。

## 開発

```bash
npm install
npm run dev
```

## 確認

```bash
npm test
npm run build
```

## Cloudflare Pagesへのデプロイ

Cloudflare PagesでGitリポジトリを接続し、次の設定を使用します。

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

カスタムドメインは、Pagesプロジェクトの「Custom domains」から `table.hirameki-tech.com` を追加して設定します。

## 広告枠

広告タグは `src/main.ts` 冒頭の次の定数で管理しています。

- `desktopAdMarkup`: PC用（641px以上、現在は728×90）
- `mobileAdMarkup`: スマホ用（640px以下、現在は300×250）

同じサイズの広告へ変更する場合は、該当する定数のテンプレートリテラル（バッククォートで囲まれた範囲）内を、新しい広告タグ全体で置き換えます。広告リンク、バナー画像、末尾の1×1px計測用画像は同じ広告素材の組なので、必ずまとめて差し替えてください。

広告サイズも変更する場合は、`src/style.css` の `.ad-slot--desktop a` または `.ad-slot--mobile a` に設定されている幅も、新しい広告サイズに合わせて変更します。

画面幅の判定には `window.matchMedia('(max-width: 640px)')` を使用し、PC用・スマホ用のうち表示対象となる広告だけをDOMへ挿入しています。広告であることを示す `[ PR ]` 表記は維持してください。
