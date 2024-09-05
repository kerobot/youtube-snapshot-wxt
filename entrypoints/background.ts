export default defineBackground(() => {
  console.log('Youtube Snapshot Extension background.', { id: browser.runtime.id });
});
