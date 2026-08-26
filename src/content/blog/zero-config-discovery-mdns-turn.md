---
title: 'No IP Address to Type: mDNS Discovery and a TURN Fallback'
description: 'Making a self-hosted app connect with zero configuration - advertising a server over mDNS, falling back to a public one, and relaying through TURN when peers are on different networks.'
pubDate: '2026-07-08'
authors:
  - jitendra-verma
toc: true
tags:
  - webrtc
  - networking
  - flutter
---

The least pleasant part of demoing a self-hosted app is the setup: *find your machine's LAN IP, rebuild the app with that IP baked in, hope nobody switches networks.* While building [Synq](https://jitendravjh.in/Synq/), a Flutter calling app with its own signalling server, I wanted the app to just connect - on Wi-Fi, on cellular, on the web, with nothing typed and no build flag.

This post is the two-part answer: **mDNS** to find the server, and a **TURN relay** to reach the person you're calling.

## Part 1: finding the server

### Advertising it

mDNS (Bonjour, DNS-SD - same family) lets a service announce itself on the local network under a service type, so clients can browse for it instead of being told where it is. The server publishes itself when it starts listening:

```js
const bonjour = new Bonjour();
bonjour.publish({
  name: 'Synq Signalling',
  type: 'synq',
  port: Number(PORT),
  host: 'synq-signal.local',
  txt: addresses.length > 0 ? { ip: addresses[0] } : undefined,
});
```

Two of those lines are scar tissue from real debugging.

**`host: 'synq-signal.local'`** - by default `bonjour-service` advertises under `os.hostname()`, which makes the responder claim the Mac's own `.local` name. macOS's built-in responder already owns that name, notices the conflict, and *renames the machine* - `MacBook-2`, `-3`, `-4` - once per run. Publishing under a dedicated host name stops it.

**`txt: { ip }`** - the client is supposed to resolve the SRV target to an address. But some routers hand the host a domain suffix (`.bbrouter` in my case) whose hostname has no mDNS A record, so resolution returns nothing at all. Carrying the IP in the TXT record sidesteps the whole resolution step.

<div class="callout" data-callout="warning">
  <p><strong>Don't trust the hostname.</strong> A service can be discoverable and still unreachable if its advertised name doesn't resolve. Put an address in the TXT record and prefer it.</p>
</div>

### Browsing for it

The client browses for `_synq._tcp` and takes the first service that gives it something usable, preferring the TXT IP:

```dart
static String? _urlFromServices(List<Service> services) {
  for (final service in services) {
    final port = service.port;
    if (port == null) continue;
    // Prefer the IP carried in the TXT record: the advertised hostname can be
    // unresolvable (router-assigned domain suffix with no mDNS A record).
    final txtIp = service.txt?['ip'];
    if (txtIp != null && txtIp.isNotEmpty) {
      return 'http://${utf8.decode(txtIp)}:$port';
    }
    final addresses = service.addresses;
    if (addresses != null && addresses.isNotEmpty) {
      return 'http://${addresses.first.address}:$port';
    }
  }
  return null;
}
```

### When there's nothing to find

mDNS is a local-network protocol. On cellular, on a guest network with client isolation, or on the web - where the API doesn't exist at all - browsing will simply never succeed. The important thing is that it doesn't *fail* either; it just waits, and a UI that waits forever is indistinguishable from a broken one.

So discovery is a race between finding a LAN server and a timer:

```dart
if (AppConfig.fallbackUrl.isNotEmpty) {
  _fallbackTimer = Timer(_discoveryTimeout, () {
    if (completer.isCompleted) return;
    _log.info('no LAN server found; using ${AppConfig.fallbackUrl}');
    completeWith(AppConfig.fallbackUrl);
  });
}
```

mDNS is tried *first*, so at home the direct LAN server still wins and media stays on the local network. If nothing answers within five seconds, the app quietly uses the public server. The same `completeWith` guard handles mDNS being unavailable outright - a caught exception at startup completes with the fallback instead of surfacing an error nobody can act on.

### Discovered isn't the same as reachable

That timeout only covers the case where nothing answers. The subtler failure is a server that *does* answer and still can't be reached - most reliably reproduced by putting the host machine on phone tethering, where it happily advertises an address that no other client on that network can route to.

Discovery succeeds, the URL looks fine, and the socket then hangs forever. So there's a second, shorter fallback one layer down, at the point where the socket is actually opened:

```dart
// A discovered LAN server can advertise an address this device cannot reach
// (for example when the host is on phone tethering). If the connection does
// not come up soon, switch to the public server so the client is not stuck.
const fallback = AppConfig.fallbackUrl;
if (fallback.isNotEmpty && url != fallback) {
  _fallbackTimer = Timer(const Duration(seconds: 3), () {
    if (_state == SignalingConnectionState.connected) return;
    if (_socket != socket || _self == null) return;
    _log.warn('$url did not connect, switching to $fallback');
    socket..clearListeners()..dispose();
    _socket = null;
    _openSocket(fallback);
  });
}
```

The guard `url != fallback` keeps this from looping - there's no point timing out the public server in order to switch to the public server. The two identity checks make sure a stale timer can't tear down a socket that has since been replaced.

<div class="callout" data-callout="note">
  <p>Two timeouts, two different questions. Five seconds asks <em>"did we find anything?"</em>; three seconds asks <em>"does what we found actually work?"</em> Discovery protocols answer only the first, and a service you can see but can't reach looks exactly like a hang.</p>
</div>

The result is a single `resolve()` with no flag to pass:

| Situation | Server used | Media path |
|---|---|---|
| Same Wi-Fi | LAN server found over mDNS | Direct peer to peer |
| LAN server unreachable (e.g. tethering) | Public server after a 3-second fallback | Direct or TURN relay |
| Different network or cellular | Public server | TURN relay |
| Web (no mDNS) | Public server over wss | Direct or TURN relay |

An explicit `--dart-define=SIGNALING_URL` or `SIGNALING_HOST` still short-circuits all of it, which is what you want for development.

## Part 2: reaching the other person

Finding the signalling server only gets the two peers introduced. The media still has to find a path, and that's where most calls between different networks quietly die.

### STUN gets you most of the way

Both peers are almost certainly behind NAT, with no public address of their own. STUN is a server that answers one question - *what address does the world see me on?* - and that's usually enough for two peers to punch a hole and connect directly. It's cheap: the traffic is a handful of packets, and the media never touches the server.

Usually. **Symmetric NAT**, common on mobile carriers and corporate networks, allocates a different external port per destination, so the address STUN reports is useless to anyone else. No amount of retrying fixes it.

### TURN is the fallback that always works

TURN is a relay: both peers connect *out* to a server that forwards packets between them. It always works, because it only needs outbound connections. The cost is real bandwidth on someone's server, so it should be the last resort, never the default.

WebRTC handles the preference for you - ICE gathers every candidate it can and picks the best working pair, direct beating relayed. You just have to supply both, in the right order:

```js
// Drop the :53 URLs (blocked/timeout-prone on many ISPs) and keep the
// Google STUN first so direct P2P is still preferred over the relay.
return [STUN_SERVER, ...cleaned];
```

### Credentials belong on the server

TURN servers need credentials, and a credential shipped inside a mobile app is a credential you've published. Cloudflare's Realtime TURN mints short-lived ones through an API, so the long-lived token can stay server-side:

```js
const res = await fetch(
  `https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_KEY_ID}/credentials/generate-ice-servers`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TURN_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ttl: ICE_TTL_SECONDS }),
  },
);
```

The client never sees `TURN_API_TOKEN`. It receives a ready-made ICE server list on the `registered` event, right after it connects, and holds it process-wide so both the 1:1 and mesh connections use the same servers:

```dart
class IceServers {
  static List<Map<String, dynamic>> _servers = AppConfig.iceServers;

  static List<Map<String, dynamic>> get servers => _servers;

  static void update(List<Map<String, dynamic>> servers) {
    if (servers.isEmpty) return;
    _servers = servers;
  }
}
```

<div class="callout" data-callout="tip">
  <p><strong>Refresh well before expiry.</strong> Credentials live 24 hours; the cache refreshes after 12. A credential that expires mid-call takes the relay down with it, and the cache is pre-warmed at startup so the first user to register doesn't pay for the round trip.</p>
</div>

That `if (servers.isEmpty) return;` matters more than it looks. If the TURN request fails - bad token, Cloudflare having a moment - the server falls back to returning STUN alone rather than an empty list, and the client keeps whatever it already had. A failed relay should degrade to "direct calls still work", not "no calls work".

## Takeaways

- mDNS removes the IP address from setup, but it only ever answers on the local network. Pair it with a timer and a public fallback, and try mDNS first so LAN calls stay local.
- Advertise an IP in the TXT record, and publish under your own host name unless you enjoy renaming your laptop.
- STUN first, TURN as fallback, in that candidate order. Direct is free; relayed is not.
- Mint TURN credentials server-side, keep them short-lived, refresh at half their lifetime, and always have a degraded path when the relay is unavailable.

The whole thing is in [the Synq repo](https://github.com/jitendravjh/Synq) - `ServerDiscovery` on the client, and the `mintIceServers` block in `server/index.js`.
