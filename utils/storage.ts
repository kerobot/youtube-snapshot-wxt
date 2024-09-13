import { storage } from "wxt/storage";

// ストレージに保管する設定の型と初期値を定義(ミニモード)
export const snapShotMiniMode =
  storage.defineItem<boolean>('local:snapshot-mini-mode', {
    fallback: false,
  });

// ストレージに保管する設定の型と初期値を定義(FPS表示の有無)
export const snapshotShowFps =
  storage.defineItem<boolean>('local:snapshot-show-fps', {
    fallback: true,
  });

// ストレージに保管する設定の型と初期値を定義(ボタン群の位置)
export const snapshotPosition =
  storage.defineItem<string>('local:snapshot-position', {
    fallback: 'top-right',
  });
