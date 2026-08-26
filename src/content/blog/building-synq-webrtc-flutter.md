---
title: 'Building Synq: WebRTC Calling in Flutter, from 1:1 to Mesh'
description: 'How I built real-time video calling in Flutter - a sealed signalling protocol, a call state machine that avoids glare, and a mesh that scales the same code to a group.'
pubDate: '2026-06-24'
authors:
  - jitendra-verma
toc: true
tags:
  - flutter
  - webrtc
  - mobile
---

[Synq](https://jitendravjh.in/Synq/) is a Flutter app for real-time voice and video calls - 1:1 and small groups - built directly on WebRTC with a small Node.js and Socket.IO server doing the signalling. This post covers the three decisions that shaped it: how signalling messages are typed, how a call's lifecycle is modelled, and how the same code stretches from a single call to a group mesh.

## WebRTC does the media; you still write the introduction

WebRTC gives you peer-to-peer audio, video, and data channels. What it deliberately does *not* give you is a way for two devices to find each other in the first place. Before any media flows, each side has to exchange an SDP description of what it can send, plus a stream of ICE candidates describing the network paths it might be reachable on.

That exchange is **signalling**, and it's entirely yours to build. In Synq it's a single-file Socket.IO server that does little more than route messages between users by id:

| Direction | Event | Payload |
|---|---|---|
| client → server | `register` | `{ displayName, userId? }` |
| server → client | `registered` | `{ user, iceServers }` |
| server → clients | `presence`, `user-joined`, `user-left` | roster and changes |
| caller ↔ callee | `call-offer`, `call-answer`, `call-decline` | `{ from, to, sdp? }` |
| both | `ice-candidate`, `call-end` | `{ from, to, ... }` |

The server assigns each connected user a short **call code**, which doubles as the routing key. A client sends it back when it reconnects so it keeps the same identity - and anyone can dial anyone by typing it.

## One sealed type for the whole protocol

The obvious way to handle Socket.IO messages is to sprinkle `socket.on('call-offer', (data) => ...)` handlers around and read untyped maps out of them. That works right up until a payload shape changes and you find out at runtime, on a device, mid-call.

Instead, every message on the wire is one variant of a single sealed Freezed union:

```dart
@freezed
sealed class SignalMessage with _$SignalMessage {
  const factory SignalMessage.register({
    required String displayName,
    String? userId,
  }) = RegisterMessage;

  const factory SignalMessage.offer({
    required String from,
    required String to,
    required String sdp,
    String? fromName,
  }) = OfferMessage;

  const factory SignalMessage.iceCandidate({
    required String from,
    required String to,
    required IceCandidatePayload candidate,
  }) = IceCandidateMessage;

  // ...answer, decline, callEnd, presence, and the meeting variants
}
```

All the JSON lives in one `SignalCodec` that translates between a `SignalMessage` and an `(event, payload)` pair. Because the union is sealed, `switch` over it is exhaustive - adding a variant makes the compiler point at every place that now needs to handle it:

```dart
({String event, Map<String, dynamic> payload}) encode(SignalMessage message) {
  return switch (message) {
    OfferMessage(:final from, :final to, :final sdp, :final fromName) => (
      event: SignalEvents.callOffer,
      payload: {'from': from, 'to': to, 'sdp': sdp, 'fromName': ?fromName},
    ),
    // ...
  };
}
```

<div class="callout" data-callout="tip">
  <p><strong>Decoding never throws.</strong> Malformed or unknown input returns <code>null</code> and the transport drops it. A stray message from an older client should be ignored, not crash a call that's already connected.</p>
</div>

The nice side effect: the codec is a pure function, so the entire protocol is unit-testable without a socket, a camera, or a second device.

## A call is a state machine, not a pile of booleans

Early on I tried tracking a call with flags - `isRinging`, `isConnected`, `hasRemoteStream`. It falls apart quickly, because those flags can express states that don't exist (ringing *and* connected) and the UI has to guess which combination it's looking at.

A sealed state makes the illegal combinations unrepresentable:

```dart
@freezed
sealed class CallState with _$CallState {
  const factory CallState.idle() = Idle;
  const factory CallState.outgoing({required User peer}) = Outgoing;
  const factory CallState.incoming({
    required User peer,
    required String offerSdp,
  }) = Incoming;
  const factory CallState.connecting({required User peer}) = Connecting;
  const factory CallState.connected({required User peer}) = Connected;
  const factory CallState.ended({required String reason}) = Ended;
  const factory CallState.failed({required String error}) = Failed;
}
```

The flow is `idle → outgoing | incoming → connecting → connected → ended | failed`. `CallController` owns it and is the single source of truth; the router picks the screen from the state rather than pushing routes imperatively, so an incoming call can't land you on two screens at once.

Notice that `incoming` carries the `offerSdp` with it. The offer arrives *before* the user has accepted anything, so it has to be parked somewhere until they tap accept - putting it inside the state means it cannot get lost, and there's no separate "pending offer" variable to keep in sync.

## Glare: when both sides offer at once

In a 1:1 call the rule is simple - the caller always creates the offer, the callee always answers. That sidesteps **glare**, the situation where both peers send an offer simultaneously and each receives one while already waiting on its own.

Groups don't get that for free. In a mesh every participant has to connect to every other participant, and there is no natural "caller". When two people join at the same moment, both would try to offer to the other.

The fix is a deterministic rule that both sides can evaluate independently and always agree on:

```dart
/// Deterministic, glare-free offerer rule. For any unordered pair exactly one
/// side returns true (the lexicographically smaller id offers), so two peers
/// never offer each other simultaneously.
static bool shouldOffer(String selfId, String peerId) =>
    selfId.compareTo(peerId) < 0;
```

Both peers compute the same comparison over the same two ids and reach opposite conclusions - exactly one offers, the other waits. No coordination round-trip, no server involvement, no tie to break.

<div class="callout" data-callout="note">
  <p>The peer connection is created up front on <em>both</em> sides, offerer or not. ICE candidates can arrive before the offer does, and they need somewhere to go.</p>
</div>

## Scaling to a mesh

A mesh means one peer connection per pair of participants. It's the simplest topology that needs no media server: everyone sends their stream directly to everyone else. The cost is that it grows quadratically, which is fine for the small meetings Synq targets and would not be fine for fifty people.

Joining works out to a short loop - for each existing peer, create the link, then offer if the rule says you're the offerer:

```dart
Future<void> _connectToPeer(String peerId) async {
  final self = _self;
  if (self == null) return;
  final offerer = MeetingReducer.shouldOffer(self.userId, peerId);
  if (!_engine.hasPeer(peerId)) {
    await _engine.addPeer(peerId);
  }
  // The peer may have left during addPeer; bail rather than negotiate a
  // connection that no longer exists.
  if (offerer && _engine.hasPeer(peerId)) {
    final sdp = await _engine.createOffer(peerId);
    if (!_engine.hasPeer(peerId)) return;
    _signaling.send(SignalMessage.meetingOffer(
      from: self.userId,
      to: peerId,
      sdp: sdp,
      fromName: self.displayName,
    ));
  }
}
```

Those repeated `hasPeer` checks look paranoid, and they are - deliberately. Every `await` is a point where the peer can leave the meeting, and negotiating with a connection that has already been torn down is one of the easier ways to get a hang or a crash in WebRTC code.

## Chat over the data channel

The 1:1 chat doesn't touch the server at all. Text rides the same peer connection as the media, over a WebRTC **data channel**, tagged so chat and media-state updates can share one channel:

```dart
static String encodeChat(ChatMessage message) =>
    jsonEncode({'type': 'chat', 'message': message.toJson()});

static String encodeMediaState({
  required bool cameraOn,
  required bool micOn,
}) => jsonEncode({'type': 'media', 'cameraOn': cameraOn, 'micOn': micOn});
```

Two benefits fall out. The chat survives a brief socket drop, because it never depended on the socket. And "their camera is off" arrives on the same path as the video itself, so the placeholder appears in step with the stream rather than a beat behind it.

Group chat is relayed by the server instead - a data channel per pair would mean sending each message N times. The server stamps the real sender onto every relayed message, so a client can't claim to be someone else.

## Layers, so it can be tested

The app is one-directional: presentation uses application, application uses data, and data never calls up.

| Layer | Holds | Examples |
|---|---|---|
| presentation | screens and widgets, no logic | lobby, pre-join, call, meeting |
| application | controllers (state and logic) | `CallController`, `MeetingController` |
| data | services and models | `SignalingService`, `WebRtcService`, `MeshService` |

The part that pays for itself is that services sit behind interfaces - `WebRtcEngine` and `SignalingTransport` - and are injected with Riverpod. The call state machine can then be tested against fakes, no camera and no network:

```
test/application/call/call_controller_test.dart
test/application/meeting/meeting_reducer_test.dart
test/data/signaling/signal_codec_test.dart
test/data/webrtc/data_channel_codec_test.dart
```

Those are the pieces that break in ways you can't see - a codec that drops a field, a glare rule that gets inverted. Testing them on the desk beats discovering it with two phones and a colleague on the other end.

## Takeaways

- Signalling is your problem, not WebRTC's. Give it one typed, sealed representation and one codec, and keep the codec total - never let bad input throw.
- Model a call as a state machine. Sealed states delete whole categories of bug, and carrying the offer SDP inside `incoming` means one less thing to keep in sync.
- Glare needs a rule both sides can compute alone. Lexicographic id comparison is enough and costs nothing.
- Re-check your invariants after every `await`. Peers leave mid-negotiation.

The [source is on GitHub](https://github.com/jitendravjh/Synq), and there's a [live web build](https://jitendravjh.in/Synq/) if you'd rather just try a call.
