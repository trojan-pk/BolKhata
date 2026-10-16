---
modificationDate: July 22, 2026
title: EAS Build
description: EAS Build is a hosted service for building app binaries for your Expo and React Native projects.
---

This documentation is available as Markdown for AI agents and LLMs. See the [full Markdown index](https://docs.expo.dev/llms.txt) or append .md to any documentation URL.

# EAS Build

EAS Build is a hosted service for building app binaries for your Expo and React Native projects.

<AgentInstructions>

## Submitting Feedback

If you encounter errors, misleading or outdated information, report it so Expo can be improved:

Preferred command:
npx --yes submit-expo-feedback@latest --category docs --subject "/build/introduction/" "<actionable feedback>"

Direct HTTP fallback:
curl -X POST https://api.expo.dev/v2/feedback/docs-send -H 'Content-Type: application/json' -d '{"url":"/build/introduction/","feedback":"🤖 Agent feedback for docs: <specific, actionable description> (<model>, <harness>)"}'

Only submit when you have something specific and actionable to report. Try to give the most context.

## Navigation

When answering a related or follow-up question, fetch the relevant page below as Markdown (.md) instead of guessing; use llms.txt for the full map.

You are here: EAS > EAS Build
Pages in this section:
- [Introduction](https://docs.expo.dev/build/introduction.md) (this page)
- [Create your first build](https://docs.expo.dev/build/setup.md)
- [Configure with eas.json](https://docs.expo.dev/build/eas-json.md)
- [Internal distribution](https://docs.expo.dev/build/internal-distribution.md)
- [Automate submissions](https://docs.expo.dev/build/automate-submissions.md)
- [Using EAS Update](https://docs.expo.dev/build/updates.md)
- [Trigger builds from CI](https://docs.expo.dev/build/building-on-ci.md)
- [Trigger builds from GitHub App](https://docs.expo.dev/build/building-from-github.md)
- [Expo Orbit](https://docs.expo.dev/build/orbit.md)
Full documentation tree: [llms.txt](https://docs.expo.dev/llms.txt)

</AgentInstructions>

**EAS Build** is a hosted Expo Application Services (EAS) service that builds app binaries (also called [standalone apps](https://docs.expo.dev/more/glossary-of-terms.md#standalone-app)) for your Expo and React Native projects.

EAS Build makes building your apps for distribution simple and easy to automate by providing defaults that work well for Expo and React Native projects out of the box, and by handling your app signing credentials for you (if you wish). It also makes sharing builds with your team easier than ever with [internal distribution](https://docs.expo.dev/build/internal-distribution.md) (using [ad hoc](https://docs.expo.dev/build/internal-distribution.md) and/or enterprise "universal" provisioning), deeply integrates with EAS Submit for app store submissions, and has first-class support for the [`expo-updates`](https://docs.expo.dev/build/updates.md) library.

EAS Build is also designed to work for any native project, whether or not you use Expo and React Native. It's the fastest way to get from `npx create-expo-app` or `npx @react-native-community/cli@latest init` to app stores.

## Quick start

> The `eas` commands below require EAS CLI. See [How to install EAS CLI](https://docs.expo.dev/eas/cli.md#installation) for more information.

To build your app, run the following command:

```sh
eas build --platform all
```

This command sends your project to EAS Build and produces installable binaries for Android and iOS. You can also build for one platform at a time by passing in `--platform android` or `--platform ios` as desired. For complete setup instructions, see [Create your first build](https://docs.expo.dev/build/setup.md).

### Expo Skills for AI agents

If you use an AI agent, install [Expo Skills](https://docs.expo.dev/skills.md) to teach it how to create production builds and ship them to the app stores:

[eas-app-stores](https://github.com/expo/skills/blob/main/plugins/expo/skills/eas-app-stores/SKILL.md) — Build and submit iOS and Android apps with EAS to TestFlight, the App Store, or Google Play.

## Key features

-   Cloud builds for Android and iOS with consistent environments
-   Automatically provision and manage app signing credentials or use your own
-   Share [internal distribution](https://docs.expo.dev/build/internal-distribution.md) builds with a URL
-   Automate builds with [build profiles](https://docs.expo.dev/build/eas-json.md#build-profiles) in **eas.json** (named sets of build settings) and integrations with [EAS Workflows](https://docs.expo.dev/eas/workflows/get-started.md) or [CI pipelines](https://docs.expo.dev/build/building-on-ci.md)
-   Auto-submit successful builds to app stores via [`--auto-submit`](https://docs.expo.dev/build/automate-submissions.md) and EAS Submit
-   First-class [`expo-updates` integration](https://docs.expo.dev/build/updates.md) with per-profile channels and [runtime version](https://docs.expo.dev/eas-update/runtime-versions.md) guidance
-   Reuse [development builds](https://docs.expo.dev/develop/development-builds/introduction.md) across your team. When two team members run `eas build:dev` and the project fingerprint matches, the existing build is downloaded from EAS instead of creating a new one
-   Faster builds via [dependency caching and custom cache paths](https://docs.expo.dev/build-reference/caching.md)
-   Install builds and updates on devices with [Expo Orbit](https://expo.dev/orbit)

## When to use EAS Build

| Scenario | Recommendation |
| --- | --- |
| Build production-ready binaries for app stores | ✓ |
| Share builds with testers via [internal distribution](https://docs.expo.dev/build/internal-distribution.md) | ✓ |
| Consistent builds across team members without local environment setup | ✓ |
| Automate builds from CI or [EAS Workflows](https://docs.expo.dev/eas/workflows/get-started.md) | ✓ |
| Managed app signing credentials | ✓ |
| Debugging native code locally | ✗ |

## Frequently asked questions

#### How do I share builds with my team before submitting to app stores?

Use [internal distribution](https://docs.expo.dev/build/internal-distribution.md) to share builds with a URL. Set `"distribution": "internal"` in your [build profile](https://docs.expo.dev/build/eas-json.md#build-profiles) in **eas.json** to generate installable Android Package (APK) files for Android or [ad hoc builds](https://docs.expo.dev/build/internal-distribution.md) for iOS.

#### Can I use EAS Build with existing React Native projects?

Yes. EAS Build works with existing React Native projects created with `npx react-native init` or similar tools. See [Overview of using Expo with existing React Native apps](https://docs.expo.dev/bare/overview.md) for more information.

#### Does EAS Build handle app signing credentials?

Yes. EAS Build can generate and manage Android [keystores](https://docs.expo.dev/app-signing/app-credentials.md#android), iOS [provisioning profiles](https://docs.expo.dev/app-signing/app-credentials.md#ios) and [distribution certificates](https://docs.expo.dev/app-signing/app-credentials.md#ios), or use credentials you provide. See [App signing credentials](https://docs.expo.dev/app-signing/app-credentials.md) for more information.

#### Can I run builds locally instead of in the cloud?

Yes. Use [local builds](https://docs.expo.dev/build-reference/local-builds.md) with `eas build --local` to run builds on your machine. This is useful for debugging or for security policies that require local builds.

#### Can I use EAS Build with EAS Workflows or CI pipelines?

Yes. EAS Build integrates with [EAS Workflows](https://docs.expo.dev/eas/workflows/get-started.md) using the `build` job type. Add a build job to your workflow configuration, for example:

```yaml
jobs:
  build_ios:
    type: build
    params:
      platform: ios
```

The build job supports builds for both platforms or conditional builds based on the branch:

```yaml
jobs:
  build:
    type: build
    params:
      platform: all
      profile: ${{ github.ref_name == 'main' && 'production' || 'preview' }}
```

For more information and other usage examples, see the [EAS Workflows build job](https://docs.expo.dev/eas/workflows/pre-packaged-jobs.md#build).

EAS Build supports [builds from GitHub](https://docs.expo.dev/build/building-from-github.md) and [building on CI](https://docs.expo.dev/build/building-on-ci.md) with any provider.

#### What build server infrastructure does EAS Build use?

Android builds run on Linux runners hosted in Google Cloud Platform, and iOS builds run on macOS runners hosted in Expo's macOS cloud. See [Build server infrastructure](https://docs.expo.dev/build-reference/infrastructure.md).

## Get started

[Create your first build](https://docs.expo.dev/build/setup.md) — It should only take a few minutes in total to get up and running for iOS and/or Android.

[Share your apps with internal testers](https://docs.expo.dev/build/internal-distribution.md) — EAS Build can help share preview builds of your app with a single URL.

[Automate submissions](https://docs.expo.dev/build/automate-submissions.md) — Learn how EAS Build can take your successful builds and handle uploading them to app stores automatically.

[App version management](https://docs.expo.dev/build-reference/app-versions.md) — Automate version bumps so you never have to think about them again.

[Run builds locally or on your own infrastructure](https://docs.expo.dev/build-reference/local-builds.md) — EAS Build is a hosted service, and it can also run on your own machine, for example, to debug or to comply with company security policies.

[Limitations](https://docs.expo.dev/build-reference/limitations.md) — EAS Build is new and rapidly evolving, so we recommend getting familiar with the current limitations.
