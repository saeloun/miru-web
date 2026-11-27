# Harmless OpenEXR fixture

`stripes.exr` is the unmodified 4,657-byte, 100×50 image from the official [OpenEXR image collection](https://github.com/AcademySoftwareFoundation/openexr-images/blob/e38ffb0790f62f05a6f083a6fa4cac150b3b7452/TestImages/stripes.exr), commit `e38ffb0790f62f05a6f083a6fa4cac150b3b7452`. It is a normal image, not a CVE payload; the runtime check evaluates its pixels before testing the loader boundary.

- Git blob: `1824f45604465e3aa24eb55f39115fcb766be437`
- SHA256: `a4c11b79d256fb6945087dc9b244e814264a128aeb2fefacc303c32d08e426a1`
- Upstream license: [BSD-3-Clause](https://github.com/AcademySoftwareFoundation/openexr-images/blob/e38ffb0790f62f05a6f083a6fa4cac150b3b7452/LICENSE)

Used to prove a real native decode in an isolated process, then the existing Active Storage integration's blocked loader in the application process. That verifies the framework boundary, not removal of installed OpenEXR vulnerabilities or remediation of XML/Chromium issues.
