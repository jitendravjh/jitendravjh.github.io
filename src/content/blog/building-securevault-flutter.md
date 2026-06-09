---
title: 'Building SecureVault: AES-256 and Native Platform Channels in Flutter'
description: 'How I built a privacy vault that disguises itself as ordinary utility apps — with real AES-256 encryption, a panic password, and native tricks like dynamic app-icon switching.'
pubDate: '2025-02-12'
authors:
  - jitendra-verma
toc: true
tags:
  - flutter
  - security
  - mobile
---

SecureVault is a privacy vault with a twist: from the outside it looks like four boring utility apps (a calculator, a clock, and so on), but behind the right password it opens into an encrypted store for your private files. This post walks through the two pieces I found most interesting to build — **client-side AES-256 encryption** and the **native platform-channel tricks** that make the disguise convincing.

## Why encrypt on the device

The whole point of a vault is that nobody — not even a stolen-phone thief with a backup tool — can read your files without the key. That means encryption has to happen on the device, with a key derived from the user's password and never stored in plaintext.

<div class="callout" data-callout="warning">
  <p><strong>Security note:</strong> never roll your own crypto primitives. SecureVault uses vetted AES-256 in GCM mode; I only wrote the glue around it.</p>
</div>

## Deriving a key from the password

The password never becomes the key directly. I run it through a key-derivation function with a per-vault salt, so two users with the same password still get different keys:

```dart
import 'package:cryptography/cryptography.dart';

Future<SecretKey> deriveKey(String password, List<int> salt) async {
  final pbkdf2 = Pbkdf2(
    macAlgorithm: Hmac.sha256(),
    iterations: 120000,
    bits: 256,
  );
  return pbkdf2.deriveKey(
    secretKey: SecretKey(utf8.encode(password)),
    nonce: salt,
  );
}
```

Encrypting a file is then a matter of generating a fresh nonce and letting the AES-GCM algorithm authenticate the ciphertext:

```dart
Future<SecretBox> encryptBytes(List<int> data, SecretKey key) async {
  final algorithm = AesGcm.with256bits();
  return algorithm.encrypt(data, secretKey: key);
}
```

## The disguise: dynamic app-icon switching

Flutter alone can't change a launcher icon at runtime — that's a platform feature. So I reached for **Platform Channels** to call into Kotlin (Android) and Swift (iOS). On Android, each disguise is an `activity-alias` that I enable or disable:

```dart
static const _channel = MethodChannel('securevault/icon');

Future<void> switchIcon(String aliasName) async {
  await _channel.invokeMethod('switchIcon', {'alias': aliasName});
}
```

```kotlin
"switchIcon" -> {
    val pm = context.packageManager
    pm.setComponentEnabledSetting(
        ComponentName(context, result.alias),
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
        PackageManager.DONT_KILL_APP,
    )
}
```

<div class="callout" data-callout="tip">
  <p><strong>Tip:</strong> keep exactly one alias enabled at a time, or Android shows duplicate launcher entries. I disable the others in the same call.</p>
</div>

## Panic password and auto-lock

A second password — the *panic password* — opens a decoy vault with harmless content, so you can hand over the phone under pressure without revealing the real data. Auto-lock listens to the app lifecycle and clears the in-memory key the moment the app goes to the background:

```dart
@override
void didChangeAppLifecycleState(AppLifecycleState state) {
  if (state == AppLifecycleState.paused) {
    VaultSession.instance.lock(); // wipes the derived key from memory
  }
}
```

## Takeaways

- Encryption belongs on the device; the key should live only in memory and only while the vault is open.
- Platform Channels are the bridge whenever Flutter needs something only the OS can do — icon switching, the iOS Screen Time API, screenshot prevention.
- A good disguise is as much UX as it is engineering.

If you want to try it, SecureVault is on the Play Store — and I'm always happy to talk Flutter security.
