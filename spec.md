# Specification

## Summary
**Goal:** After a screen recording finishes in the ScreenRecorder component, show an in-app video preview player so the admin can review the recording locally before uploading or downloading it.

**Planned changes:**
- After recording stops, generate a local object URL from the recorded Blob and display a `<video>` preview player in the ScreenRecorder UI labeled "Recording Preview".
- The preview player supports play, pause, and scrubbing without any backend interaction.
- The existing download button remains visible alongside the new preview player.
- The preview player is cleared when the admin starts a new recording or proceeds to upload.

**User-visible outcome:** After stopping a screen recording, the admin sees an in-app video preview they can play and review directly, while still having access to the download button.
