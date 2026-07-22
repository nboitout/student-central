// Personal / consumer email providers (free webmail + consumer ISP domains).
// A professor or trainer must sign up with a professional (institutional)
// address to unlock the faculty section, so these are rejected for that role —
// and flagged as "personal" in the leads inspector.
//
// Coverage: global webmail + consumer ISPs for every language/region the app
// serves (see src/context/LanguageContext.tsx). Anything NOT listed here is
// treated as a professional/institutional domain. Grouped for maintainability;
// duplicates across groups are harmless (Set de-dupes).
const DOMAINS: string[] = [
  // ── Global webmail ────────────────────────────────────────────────
  'gmail.com', 'googlemail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'windowslive.com', 'hotmail.co.uk', 'live.co.uk',
  'yahoo.com', 'ymail.com', 'rocketmail.com', 'yahoo.co.uk',
  'icloud.com', 'me.com', 'mac.com',
  'proton.me', 'protonmail.com', 'pm.me',
  'aol.com', 'aim.com',
  'gmx.com', 'gmx.net', 'gmx.us',
  'mail.com', 'email.com', 'usa.com', 'europe.com',
  'yandex.com',
  'zoho.com', 'zohomail.com', 'fastmail.com', 'fastmail.fm', 'hey.com',
  'tutanota.com', 'tuta.com', 'tutanota.de', 'hushmail.com',
  'inbox.com', 'gawab.com', 'lycos.com', 'excite.com', 'rediffmail.com',

  // ── United States ISPs (English) ──────────────────────────────────
  'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'bellsouth.net', 'cox.net',
  'charter.net', 'spectrum.net', 'roadrunner.com', 'rr.com', 'earthlink.net', 'juno.com',
  'netzero.net', 'netzero.com', 'optonline.net', 'optimum.net', 'frontier.com', 'frontiernet.net',
  'windstream.net', 'centurylink.net', 'embarqmail.com', 'ameritech.net', 'pacbell.net',
  'prodigy.net', 'mindspring.com', 'swbell.net', 'suddenlink.net',

  // ── United Kingdom / Ireland ISPs (English) ───────────────────────
  'btinternet.com', 'btconnect.com', 'sky.com', 'virginmedia.com', 'virgin.net', 'talktalk.net',
  'tiscali.co.uk', 'ntlworld.com', 'blueyonder.co.uk', 'plus.com', 'plusnet.com', 'o2.co.uk',
  'aol.co.uk', 'madasafish.com', 'freeserve.co.uk', 'fsmail.net', 'supanet.com', 'eircom.net',

  // ── France (fr) ───────────────────────────────────────────────────
  'free.fr', 'orange.fr', 'wanadoo.fr', 'sfr.fr', 'laposte.net', 'bbox.fr', 'neuf.fr', 'aliceadsl.fr',
  'numericable.fr', 'club-internet.fr', 'gmx.fr', 'outlook.fr', 'hotmail.fr', 'live.fr', 'yahoo.fr',
  'noos.fr', 'cegetel.net', 'voila.fr', '9online.fr',

  // ── Germany / Austria (de) ────────────────────────────────────────
  'web.de', 'gmx.de', 't-online.de', 'freenet.de', 'arcor.de', 'online.de', 'mail.de', 'posteo.de',
  'hotmail.de', 'yahoo.de', 'outlook.de', 'live.de', 'ewetel.de', 'kabelmail.de', 'unitybox.de',
  '1und1.de', 'aol.de', 'gmx.at', 'aon.at', 'a1.net', 'chello.at', 'kabsi.at', 'utanet.at',

  // ── Spain + Latin America (es) ────────────────────────────────────
  'terra.es', 'telefonica.net', 'movistar.es', 'hotmail.es', 'yahoo.es', 'outlook.es', 'live.es',
  'ono.com', 'ya.com', 'wanadoo.es', 'teleline.es', 'jazztel.es', 'hotmail.com.mx', 'yahoo.com.mx',
  'prodigy.net.mx', 'hotmail.com.ar', 'yahoo.com.ar', 'fibertel.com.ar', 'speedy.com.ar',
  'arnet.com.ar', 'ciudad.com.ar', 'telmex.com',

  // ── Italy (it) ────────────────────────────────────────────────────
  'libero.it', 'virgilio.it', 'alice.it', 'tin.it', 'tiscali.it', 'fastwebnet.it', 'email.it',
  'inwind.it', 'iol.it', 'hotmail.it', 'yahoo.it', 'live.it', 'poste.it', 'teletu.it', 'vodafone.it',
  'tim.it', 'aruba.it', 'katamail.com', 'tele2.it',

  // ── Greece (el) ───────────────────────────────────────────────────
  'otenet.gr', 'hol.gr', 'forthnet.gr', 'yahoo.gr', 'hotmail.gr', 'in.gr', 'freemail.gr', 'acn.gr', 'mail.gr',

  // ── Netherlands + Belgium (nl) ────────────────────────────────────
  'ziggo.nl', 'kpnmail.nl', 'planet.nl', 'home.nl', 'hetnet.nl', 'chello.nl', 'xs4all.nl', 'telfort.nl',
  'hotmail.nl', 'live.nl', 'casema.nl', 'quicknet.nl', 'upcmail.nl', 'zonnet.nl', 'online.nl', 'tele2.nl',
  'tiscali.nl', 'wanadoo.nl', 'telenet.be', 'skynet.be', 'scarlet.be', 'pandora.be', 'base.be',
  'proximus.be', 'hotmail.be', 'live.be',

  // ── Portugal + Brazil (pt) ────────────────────────────────────────
  'sapo.pt', 'netcabo.pt', 'clix.pt', 'iol.pt', 'portugalmail.pt', 'meo.pt', 'nortenet.pt', 'oninet.pt',
  'hotmail.pt', 'mail.pt', 'bol.com.br', 'uol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com',
  'globomail.com', 'r7.com', 'oi.com.br', 'zipmail.com.br', 'hotmail.com.br', 'yahoo.com.br',
  'pop.com.br', 'ibest.com.br', 'superig.com.br', 'itelefonica.com.br', 'bighost.com.br',

  // ── Poland (pl) ───────────────────────────────────────────────────
  'wp.pl', 'o2.pl', 'onet.pl', 'onet.eu', 'interia.pl', 'interia.eu', 'gazeta.pl', 'op.pl', 'tlen.pl',
  'go2.pl', 'poczta.fm', 'poczta.onet.pl', 'vp.pl', 'autograf.pl', 'buziaczek.pl', 'wp.eu', 'neostrada.pl',

  // ── Sweden (sv) ───────────────────────────────────────────────────
  'telia.com', 'spray.se', 'comhem.se', 'hotmail.se', 'yahoo.se', 'live.se', 'swipnet.se', 'bahnhof.se',
  'tele2.se', 'bredband.net', 'home.se', 'glocalnet.se', 'passagen.se',

  // ── Denmark (da) ──────────────────────────────────────────────────
  'mail.dk', 'hotmail.dk', 'live.dk', 'yahoo.dk', 'post.tele.dk', 'stofanet.dk', 'webspeed.dk', 'sol.dk',
  'jubii.dk', 'tdcadsl.dk', 'privat.dk', 'city.dk',

  // ── Finland (fi) ──────────────────────────────────────────────────
  'elisanet.fi', 'luukku.com', 'kolumbus.fi', 'suomi24.fi', 'saunalahti.fi', 'netti.fi', 'hotmail.fi',
  'yahoo.fi', 'dnainternet.net', 'welho.com', 'pp.inet.fi', 'surffi.fi',

  // ── Romania (ro) ──────────────────────────────────────────────────
  'yahoo.ro', 'hotmail.ro', 'rdslink.ro', 'clicknet.ro', 'personal.ro', 'home.ro', 'k.ro', 'xnet.ro',

  // ── Ukraine (uk) ──────────────────────────────────────────────────
  'ukr.net', 'i.ua', 'meta.ua', 'bigmir.net', 'online.ua', 'mail.ua', 'email.ua', 'ua.fm', '3g.ua',
  'voliacable.com', 'ex.ua',

  // ── Russia (ru) ───────────────────────────────────────────────────
  'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru', 'internet.ru', 'rambler.ru', 'yandex.ru', 'ya.ru',
  'pochta.ru', 'mail333.com', 'land.ru', 'nm.ru', 'r0.ru',

  // ── Hungary (hu) ──────────────────────────────────────────────────
  'freemail.hu', 'citromail.hu', 'indamail.hu', 't-online.hu', 'vipmail.hu', 'chello.hu', 'upcmail.hu',
  'hotmail.hu', 'yahoo.hu', 'invitel.hu', 'digikabel.hu',

  // ── Croatia (hr) ──────────────────────────────────────────────────
  'net.hr', 'inet.hr', 'vip.hr', 't-com.hr', 'globalnet.hr', 'htnet.hr', 'hotmail.hr',

  // ── Serbia (sr) ───────────────────────────────────────────────────
  'eunet.rs', 'sbb.rs', 'mts.rs', 'ptt.rs', 'verat.net', 'neobee.net', 'beotel.net', 'open.telekom.rs',

  // ── Bulgaria (bg) ─────────────────────────────────────────────────
  'abv.bg', 'mail.bg', 'dir.bg', 'gbg.bg', 'techno-link.com', 'ttm.bg', 'rozali.com',

  // ── Czech (cs) ────────────────────────────────────────────────────
  'seznam.cz', 'centrum.cz', 'email.cz', 'atlas.cz', 'volny.cz', 'post.cz', 'tiscali.cz', 'quick.cz',
  'chello.cz', 'tcentrum.cz',

  // ── Turkey (tr) ───────────────────────────────────────────────────
  'mynet.com', 'superonline.com', 'ttmail.com', 'turk.net', 'yahoo.com.tr', 'hotmail.com.tr',
  'ixir.com', 'e-kolay.net', 'excite.com.tr', 'yandex.com.tr',
]

// Microsoft (Hotmail/Outlook/Live) and Yahoo localise by country-code domain.
// Rather than hand-list every variant (and miss some, e.g. outlook.it), we
// generate brand × covered-locale ccTLD for all markets the app serves. Any
// generated domain that doesn't actually exist is harmless — no institution
// uses a consumer webmail domain.
const LOCALE_TLDS = [
  'fr', 'de', 'at', 'es', 'it', 'gr', 'nl', 'be', 'pt', 'pl', 'se', 'dk', 'fi',
  'ro', 'ua', 'ru', 'hu', 'hr', 'rs', 'bg', 'cz', 'ie', 'co.uk', 'com.tr',
  'com.mx', 'com.ar', 'com.br',
]
const LOCALIZED_BRANDS = ['hotmail', 'outlook', 'live', 'yahoo']
const LOCALIZED_DOMAINS = LOCALIZED_BRANDS.flatMap((brand) =>
  LOCALE_TLDS.map((tld) => `${brand}.${tld}`)
)

export const CONSUMER_DOMAINS = new Set([...DOMAINS, ...LOCALIZED_DOMAINS])

export function emailDomain(email: string): string {
  const at = email.lastIndexOf('@')
  return at < 0 ? '' : email.slice(at + 1).trim().toLowerCase()
}

/** True when the email has no domain or uses a known personal provider. */
export function isConsumerEmail(email: string): boolean {
  const d = emailDomain(email)
  return !d || CONSUMER_DOMAINS.has(d)
}
