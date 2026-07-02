---
layout: post
title: "A trip into Kotlin Multiplatform Projects, Part 4"
author: me
categories: [Kotlin, Multiplatform, Android, iOS]
image: /assets/images/kotlin-multiplatform-pt4.jpg
featured: true
hidden: false
---

Almost seven years ago, I wrote a small series about **Kotlin Multiplatform**. Back then, in
[part 1](/kotlin-multiplatform-pt1), [part 2](/kotlin-multiplatform-pt2) and
[part 3](/kotlin-multiplatform-pt3), I was playing with a toy **BLE** library, talking to a
Xiaomi Mi Band, and later fetching a list of users with a simple **REST** call. It was exciting,
but it was still a _playground_. The `expect`/`actual` mechanism felt magical and fragile at the
same time, the Gradle plugin changed name between releases, and shipping something to a real iOS
app was more of a promise than a reality.

Fast forward to today. I now work at **Empatica**, on a **medical-grade health monitoring** app
that runs on both **Android** and **iOS**, talks to real wearable devices, moves data to and from
the backend, and does all of this from a **shared Kotlin
codebase**. The toy grew up. And I think it deserves a fourth part.

## What changed in almost seven years

The first thing worth saying is that **Kotlin Multiplatform is not experimental anymore**. In 2019
I had to reassure the reader (and myself) that this thing could actually work. Today I don't need
to convince anyone: KMP is **stable**, JetBrains ships it as a first-class product, and the tooling
around it is boringly reliable. _Boring is a compliment here._

A few concrete numbers from the codebase I work on every day:

- **Kotlin 2.2.21**, with the K2 compiler
- **Coroutines 1.9.0** for the threading abstraction I was so excited about in part 3
- **Ktor 3.2.3** as the multiplatform HTTP client — remember the hand-rolled REST call from part 3?
  That whole problem is now a solved, cross-platform library.
- **kotlinx.serialization** and **kotlinx.datetime**, two libraries that simply _did not exist_
  when I wrote the original series
- **Gradle 8.14.5** driving the whole thing

Back in part 3 I spent paragraphs explaining how to abstract over threading, and how to move JSON
across the platform boundary by hand. Almost all of that is now handed to you by the ecosystem. The
interesting problems moved somewhere else.

## From "does it work" to "does it scale"

In the old series, the hard question was _can I share code at all?_ Today, the hard question is
_how do I share code across many modules without the build collapsing under its own weight?_

The shared layer I work on is a single Kotlin Multiplatform build made of several independent
libraries — networking, persistence, domain logic — plus a handful of feature modules. Nothing
exotic in principle: everything lives in `commonMain` as much as possible, and only drops into
`androidMain` or `iosMain` when it truly has to touch the platform.

This is _exactly_ the "framework-agnostic common module" principle I preached in part 1 — except
now it's load-bearing for a shipping product instead of a blog demo. It turns out the advice held
up. What did **not** survive contact with reality was my assumption that, once the code was shared,
the hard part was over. It wasn't. The hard part was getting all of it into an iOS app _cleanly_.

## The part nobody told me about in 2019: packaging

Here's the thing that the early tutorials (mine included) glossed over. Writing shared Kotlin is the
easy part. **Delivering that shared Kotlin to an iOS app** is where the real work hides.

On Android there's basically no drama — the KMP module produces a JAR/AAR and Gradle consumes it like
any other dependency. iOS is the interesting side. Xcode doesn't know what a Kotlin module is; it
knows what an **XCFramework** is. So the shared world has to be packed into a binary artifact that
Swift can import and call as if it were a native framework.

And here's the problem that this whole section exists to explain.

## The duplicate-class trap

The setup I inherited did the intuitive thing, and then some: the shared code wasn't just split into
several modules — those modules lived in **separate repositories**, each one its own KMP project,
each producing **its own XCFramework**. Clean, modular, every library versioned and shipped
independently. It feels right. The iOS app imports all of them. It compiles.

Then the bugs start. A type produced by one framework can't be passed into another. Swift complains
that `Foo` is not `Foo`. The binary is mysteriously huge. Symbols look _almost_ right but namespaced
in a way nobody asked for.

Here's what's actually happening. When Kotlin/Native builds a framework, it **statically links every
Kotlin dependency into that framework** and namespaces the symbols under it. So if five of your
modules each depend on a common shared library, each framework carries its **own private copy** of
that common library's classes. In the host app you don't get one `SharedModel` — you get
`ModuleA.SharedModel`, `ModuleB.SharedModel`, `ModuleC.SharedModel`, all distinct Swift types that
happen to share a name. Hand an object from one framework to another and the compiler is right to
reject it: as far as it's concerned, those are different types.

The fix was to stop shipping many frameworks. I pulled those modules out of their separate
repositories and **converged every one of them into a single Gradle project**, then added an
**umbrella Gradle module whose only job is to export one XCFramework** for the whole shared layer. Because everything now lives in one compilation, the common library gets linked
exactly _once_: one canonical version of every type, one binary to version, one thing to sign, and
one import on the Swift side. The umbrella module looks, in Gradle terms, roughly like this:

```kotlin
import org.jetbrains.kotlin.gradle.plugin.mpp.apple.XCFramework

val iosFrameworkName = "SharedMultiplatform"

kotlin {
    androidTarget()

    val xcf = XCFramework(iosFrameworkName)

    listOf(
        iosArm64(),           // real devices
        iosSimulatorArm64(),  // Apple Silicon simulators
    ).forEach { target ->
        target.binaries.framework {
            baseName = iosFrameworkName
            xcf.add(this)
        }
    }
}
```

Two more things about this snippet are worth pausing on.

First, notice the targets: `iosArm64` for real devices and `iosSimulatorArm64` for the simulator.
In 2019 I was building for `iosX64` because everyone was on Intel Macs. The whole Apple Silicon
transition happened _inside_ the lifetime of this technology, and KMP absorbed it by simply adding
a target. That's the ecosystem maturing under your feet.

Second, the `XCFramework` helper. This didn't exist in the old plugin. You used to assemble a fat
framework by hand with a shell script full of `lipo` calls. Now it's one Gradle type.

## Debug and release are two different animals

Another lesson that only shows up once you're shipping for real: the artifact you hand to a developer
running the app in the simulator is **not** the artifact you ship in the store. So the build defines
two packaging flavors — a **debug** XCFramework for day-to-day development and a **release** one,
each zipped and versioned separately:

```kotlin
tasks.register<Zip>("zipReleaseXCFramework") {
    dependsOn("assemble${iosFrameworkName}ReleaseXCFramework")
    archiveFileName.set("$iosFrameworkName-$version.zip")
    // ...ready to be published and consumed by the iOS app
}
```

The debug build is fast to produce and easy to step through; the release build is optimized and
stripped. Getting this split right is the difference between "the iOS engineers wait five minutes
for every change" and "they don't notice the shared layer exists at all." And _not noticing_ is the
goal — the best shared module is the one your platform teammates forget is written in Kotlin.

## Getting the binary to the iOS app: Carthage

Producing a versioned zip is only half the story — the iOS app still has to _pull it in_. Rather than
invent something bespoke, we lean on a tool the iOS world already knows: **Carthage**. It's usually
thought of as a dependency manager for Swift/Objective-C frameworks, but it's perfectly happy
distributing a **prebuilt binary XCFramework** too, which is exactly what our umbrella module produces.

The nice part is that this makes the Kotlin layer look like _any other_ binary dependency to the iOS
engineers. They don't build Kotlin, they don't touch Gradle, they don't care that the framework came
out of Kotlin/Native. Carthage fetches the versioned XCFramework, drops it into the project, and Swift
imports it like a normal framework. The whole "there is a Kotlin compiler somewhere upstream" detail
stays invisible on the consuming side — which, again, is the entire point.

## What I got right, and what I got wrong

Reading my 2019 self is a fun exercise. Some things aged beautifully:

- **"Be framework-agnostic in the common module."** Still the single most important rule. Every time
  someone leaks a platform type into `commonMain`, they pay for it later.
- **"Use coroutines to abstract over threading."** More true than ever. Structured concurrency wasn't
  even a term yet, and now it's the backbone of every client we ship.

And some things were naïve:

- I treated **packaging and distribution** as an afterthought. In a real product it's half the effort.
- I underestimated **build times and IDE experience** at scale. When you have this many modules, the
  question of how a single IDE indexes the whole thing — Android app, shared KMP, platform SDKs — becomes
  a real engineering topic on its own. (That's probably its own blog post.)
- I thought the risky part was **Kotlin/Native**. In practice, Kotlin/Native has been the stable part.
  The risky parts were all the _boundaries_: build configuration, versioning, and the Swift interop
  surface.

## Cool, isn't it? (still)

In part 1 I asked "_Cool, isn't it?_" about a demo that discovered Bluetooth devices. I'm asking the
same question now, except the answer ships in an app that people wear on their wrist and depend on.

Kotlin Multiplatform delivered on the promise I was excited about in 2019 — one codebase, real
Android, real iOS, no lowest-common-denominator compromise. It just delivered it _quietly_, by
becoming ordinary. The magic didn't disappear; it turned into infrastructure.

But I want to end this part on a more open question, because I think the _why_ of code sharing is
about to shift under us.

We share code because writing the same logic twice, in two languages, and keeping the two versions in
sync by hand is expensive and error-prone. That's the whole economic argument for KMP: one source of
truth beats two drifting copies. But look at what **AI tooling** is starting to do. If a model can
take a piece of Kotlin business logic and produce a faithful Swift translation — and, more
importantly, _keep it in parity_ as the Kotlin evolves — then "one shared binary" stops being the only
way to get "one behavior on both platforms."

I'm not saying KMP goes away. A single compiled source of truth has guarantees that a generated
translation doesn't — you can't accidentally let the two drift, and you're not trusting a model to be
correct on every edge case. But the _trade-off_ changes. Some of the pain I described in this post —
the packaging, the interop surface, the binary you have to version and sign — exists precisely because
we insist on shipping one artifact to two runtimes. If code parity becomes something you can get
out-of-the-box from tooling, the honest question becomes: _for which modules is a shared binary still
worth its cost, and for which is idiomatic-per-platform code, kept in parity automatically, the better
deal?_

That's the tension I want to explore next. Seven years ago the exciting question was "can we share
code across platforms?" The answer turned out to be _yes_. The 2026 question is "given that we can,
and given what AI now does — **when should we?**"

See you in part 5.
