import { storage } from "wxt/storage";

export const snapshotShowFps =
  // ストレージに保管する設定の型と初期値を含めて定義
  storage.defineItem<boolean>('local:snapshot-show-fps', {
    fallback: true,
  });
