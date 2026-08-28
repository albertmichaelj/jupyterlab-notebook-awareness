import { expect, test } from '@jupyterlab/galata';

test('should load the extension', async ({ page }) => {
  // `isPluginActivated` rather than merely `hasPlugin`: the plugin takes an
  // optional IGlobalAwareness, and the failure mode worth catching is the one
  // where that dependency stops it from activating at all.
  const activated = await page.evaluate(() =>
    (window as any).jupyterapp?.isPluginActivated(
      'jupyterlab-notebook-awareness:plugin'
    )
  );

  expect(activated).toBeTruthy();
});
