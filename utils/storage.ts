import { storage } from "wxt/storage";

export const snapshotShowFps =
  storage.defineItem<boolean>('local:snapshot-show-fps', {
    fallback: true,
  });
