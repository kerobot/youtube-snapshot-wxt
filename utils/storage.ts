import { storage } from "wxt/storage";

// ストレージに保管する設定の型と初期値を含めて定義
export const snapshotShowFps =
  storage.defineItem<boolean>('local:snapshot-show-fps', {
    fallback: true,
  });
