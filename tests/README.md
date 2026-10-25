# Tests and browser acceptance

## Quick application checks

```sh
python3 -m unittest discover -s tests -v
node --test tests/client.test.mjs tests/illustrations.test.mjs
node --check static/app.js
node --check static/illustrations.js
```

The ordinary Python command deliberately skips the opt-in browser cases. Its green
result alone **does not mean browser acceptance passed**. The Node DOM adapter is
also not a real browser, layout, touch, or audio-device test.

## Mandatory real-browser gate

In an environment already allowed to run Chromium:

```sh
python3 -m pip --isolated install --index-url https://pypi.org/simple --no-cache-dir --only-binary=:all: -r requirements-test.txt
python3 -m playwright install chromium
python3 tests/run_browser.py
```

The runner enables the browser suite before discovery and exits nonzero for any
failure, error, skip, or zero collected tests. Missing Playwright/Chromium fails;
it never falls back to a simulated browser. `BROWSER_EXECUTABLE` optionally selects
an already-installed local executable, but CI uses Playwright's matching managed
Chromium. A nonexistent override fails before starting a subprocess. Do not use
this override to bypass an environment's browser/socket restriction.

Only the GitHub workflow uses `python -m playwright install --with-deps chromium`
to install necessary OS libraries on its disposable runner. Do not run that
privileged setup on a user's Mac, NAS, or restricted executor.

## What the seven browser cases check

At **1280×800 desktop, 1024×768 tablet landscape, and 768×1024 tablet portrait**:

- Open home, enter foundation through its visible course tab, then switch to the
  progressive course. Complete progressive lesson 1 by real clicks, alternating
  adult-led and silent modes; no WAV request is allowed.
- Check disabled-before-mode controls, hidden adult prompts, one wrong answer and
  correct answers, the selected answer's visible verdict, and explicit manual
  next. Pause, reload and resume; refresh at final reward, then enter lesson 2.
- Complete foundation lesson 1 and a full repeat through the UI; return normally,
  reload, verify the next lesson and one first-completion reward only. Inspect the
  real server's resulting state read-only; completing lessons must not claim mastery.
- Enter the parent view, use keyboard date selection, and inspect the actual UI
  learning records. Check horizontal overflow at each learning step and take real
  PNG screenshots at important states.
- In **separate calendar-only cases**, POST clearly synthetic historical events to
  the same local HTTP API, then operate the real calendar UI: occupied/empty dates,
  keyboard selection, earlier/later months, both course filters, all courses and
  return to today. These fixtures are **not evidence of completing learning via UI**.

An additional landscape case aborts a real event request, navigates to the parent
view with the app's own pending record, reconnects through its button, then verifies
all settings fields are editable, save correctly and survive reload.

Every case starts the real app server on `127.0.0.1` and an ephemeral port **in the
same Python process/environment that launches Playwright**. Each case uses a fresh
temporary SQLite database, not `data/`, backups, imported learner files or the NAS.
Unexpected external browser requests and uncaught JavaScript errors fail the case.
Tablet viewport/touch emulation is **not Android hardware acceptance**. These checks
do not certify Android audio, real touch feel, teaching quality, or a deployment.

## CI scope, dependencies and artifacts

`.github/workflows/browser-checks.yml` runs only on pushes to `main` or
`qa/browser-acceptance`. A public-repository guard prevents running on a private
repository (a skipped job is not acceptance). It uses standard `ubuntu-24.04`, `contents: read`, checkout
without persisted credentials, bounded job/step timeouts, and no deployment,
self-hosted/larger runner, secrets, or dependency/browser cache. There is no
`pull_request_target` or permission-modifying step. Publishing the workflow is a
separate authorized action; this file does not grant publication permission.

Test dependency: **Playwright 1.64.1**, pinned from its
[official PyPI release](https://pypi.org/project/playwright/1.64.1/), published
2026-10-22. Its installer supplies the matching browser. Python 3.12 and Node 22
match the app's supported stdlib/Node test usage; no pytest/plugin or runtime
dependency is added. Transitive Playwright dependencies are resolved by pip from
PyPI, not fully lock-file pinned. GitHub steps use the official `actions/checkout`,
`actions/setup-python`, `actions/setup-node` and `actions/upload-artifact` actions
at documented major versions; these are not immutable SHA pins.

References checked 2026-10-25:
- [Playwright Python CI installation and browser-cache guidance](https://playwright.dev/python/docs/ci)
- [GitHub standard public-repository runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
- [Official Node setup, including disabling automatic package cache](https://github.com/actions/setup-node)

Only `evidence/browser/**/*.png` and `evidence/browser/**/trace.zip` are eligible for
upload, with a 32 MiB size check and **3-day retention**. Traces use DOM/network
snapshots, no source capture or continuous screenshot recording; all content is
synthetic and local. No database, backup, environment dump, user profile, secret,
or general log is uploaded. Artifact directories are already git-ignored.

Screenshots/traces are evidence for inspection, not proof that a human reviewed
visual quality. Report the exact CI commit and result, and any blocked stages;
never call this suite passed based on skipped tests or syntax checks alone.

## Real container acceptance (CI only)

`.github/workflows/container-checks.yml` runs on pushes to `main` and
`qa/container-acceptance`, only in a public repository, on standard
`ubuntu-24.04` native **linux/amd64**. It uses the runner's existing Docker,
read-only repository permissions and checkout without stored credentials. It
installs no host packages, QEMU or privileged helpers and publishes no image.
The Python standard-library harness has no additional pip dependencies.

`tests/run_container.py` refuses a non-CI, root or non-amd64 environment. It:

1. Verifies a clean checkout at the exact workflow commit. Resolves the existing
   official `python:3.12-slim` base tag, pins its digest in a temporary build recipe
   (without changing the repository's Dockerfile), and builds without cache.
2. Starts a dedicated container with the same hardening as `compose.yaml`:
   non-root UID/GID, read-only root, all capabilities dropped, no-new-privileges,
   bounded `/tmp`, and only `127.0.0.1` on a randomly allocated host port. The
   configurable UID/GID match the CI user's newly created mode-0700 bind directory;
   there is no `chmod 777`, root container or change to existing host permissions.
3. Checks Docker and real HTTP health, course/state endpoints, runtime hardening
   and the packaged offline restore command/dependencies. Writes three synthetic
   progressive-course events through HTTP and checks duplicate replay adds no row.
4. Restarts only that container and compares HTTP state, historical calendar and
   every persisted event row—not just a health response.
5. Downloads a synthetic SQLite backup, stops the source container, and restores
   offline with networking disabled into a **second empty** temporary bind directory.
   Boots a second app container, checks the restored HTTP state and changed recovery
   generation, and confirms original database and selected backup are unchanged.
6. Removes only exact per-run names whose ownership labels match, then removes its
   own temporary directory and image. If container removal cannot be verified, the
   job fails and does not delete potentially mounted data. No broad prune is used.

Only a small success summary is uploaded (3-day retention): immutable source
commit, resolved base digest/image IDs, architecture, CI runtime UID/GID, synthetic
case count, and passed check names. **No database, backup, full inspect, container
logs, local paths or environment dump is uploaded.** Missing Docker, failed
checks or incomplete cleanup fail the gate; local helper tests are not Docker
acceptance. A skipped private-repository job is not a passing run.

This does **not** certify a NAS CPU architecture, real data-directory ownership,
NAS Docker/Compose implementation, LAN reachability or a real deployment. Those
conditions require a separate authorized device-specific check. The base tag and
OS packages remain upstream-maintained inputs; the summary records the exact base
used for this run, not a promise of future byte-for-byte builds.

Official references checked 2026-10-25:
- [Docker Official Image packaging for Python](https://github.com/docker-library/python)
- [Docker container run options](https://docs.docker.com/reference/cli/docker/container/run/)
- [GitHub standard public-repository runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
