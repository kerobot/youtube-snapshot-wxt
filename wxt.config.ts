import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  runner: {
    // 開発時に起動するページ
    startUrls: ["https://www.youtube.com"],
  },
  manifest: {
    // バージョンや説明や名前はpackage.jsonに記述する
    author: 'kerobot', // 作者名を追加
    action: {
      default_popup: 'popup.html',
      default_icon: {16: 'icon/16.png'},
      // 既定のタイトルはpopup.htmlのtitleタグに記述する
    },
    permissions: ['activeTab','declarativeContent','storage'],
    // マッチパターンはcontent.tsに記述する
  },
});
