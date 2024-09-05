# youtube-snapshot-wxt

## YouTube Video Screenshot Extension Developed by WXT

Youtube 動画のスクリーンショットを撮るための Chrome 拡張機能です。  
WXT + React で開発しています。

[WXT](https://wxt.dev/) - Put Developer Experience First

> WXT's simplifies the chrome extension development process by providing tools for zipping and publishing, the best-in-class dev mode, an opinionated project structure, and more. Iterate faster, develop features not build scripts, and use everything the JS ecosystem has to offer.

## プロジェクトの取得から起動

### Node バージョンの確認

```powershell
> node --version
v22.7.0
> npm --version
10.8.2
```

### プロジェクトの取得と依存関係のインストール

```powershell
> git clone https://github.com/kerobot/youtube-snapshot-wxt.git
> cd .\youtube-snapshot-wxt\
> npm install
```

### デバッグ起動

```powershell
> npm run dev
```

### プロダクションビルド

```powershell
> npm run build
```

### 公開のためのZIP化

```powershell
> npm run zip
```

## Chrome 拡張機能の追加

1. Chrome の URL 欄に `chrome://extensions/` を入力して拡張機能画面を開きます。
2. 右上の `デベロッパーモード` を ON にします。
3. `パッケージ化されていない拡張機能を読み込む` をクリックし、ビルドしたフォルダ（.output/chrome-mv3）を選択します。

## 使い方

1. Youtube にアクセスし、動画を再生します。
2. 動画の右上にボタン群が表示されますので、必要なタイミングに移動してスクリーンショットを撮ってください。

Youtube の埋め込み URL で動画を表示した際にスクリーンショットを撮れるようにするため、動画の上にボタン群を表示しています。

## おまけ機能

オプションで FPS 表示の ON/OFF ができます。  

ただし、動画のFPSではなくブラウザの再描画間隔を計算して平均したおおよその更新間隔となります。
