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

現在は画面内に予約枠のみ設置しています。A8.netの案件と掲載方針が決まり次第、`src/main.ts` の `.ad-slot` を広告コードへ置き換えてください。広告であることが分かる `PR` 表記は維持します。
