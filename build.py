#!/usr/bin/env python3
"""src/ -> index.html and concrete-pumping-service-new-jersey/index.html (same address as their current pumping page).
Fails if a file, image or anchor is missing, if any phone link is not dispatch, if email creeps back in,
if a link goes to their old site, or if wording Matt asked to drop comes back."""
import hashlib, html, json, os, pathlib, re
here = pathlib.Path(__file__).parent
read = lambda f: (here / f).read_text(encoding='utf8')
TEL = '+12017977550'  # dispatch takes calls and texts on this number: confirm the texting number before launch
PUMP = 'concrete-pumping-service-new-jersey/'
NAV = [('#equipment', 'Equipment'), (PUMP, 'Pumping'), ('#metered', 'Why metered'), ('#quote', 'Calculator'), ('#reviews', 'Reviews'), ('#area', 'Service area')]
DROP = ['over the house', 'over roofs', 'email', 'mailto:', '@gmail', 'get a quote', 'quote it this way', 'keep going']

BIZ = {"@type": "HomeAndConstructionBusiness", "@id": "https://www.bergenmobileconcrete.com/#business", "name": "Bergen Mobile Concrete",
       "description": "Ready mix concrete supplier with metered mobile mixers, concrete buggy, line pumping and boom pumping.", "telephone": "+1-201-797-7550",
       "logo": "https://revupag.github.io/bergen-mobile-concrete-demo/img/logo.webp", "image": "https://revupag.github.io/bergen-mobile-concrete-demo/img/share.jpg",
       "url": "https://www.bergenmobileconcrete.com/",
       "address": {"@type": "PostalAddress", "streetAddress": "67 Goffle Rd", "addressLocality": "Hawthorne", "addressRegion": "NJ", "postalCode": "07506", "addressCountry": "US"},
       "areaServed": ["Bergen County, NJ", "Passaic County, NJ", "Morris County, NJ", "Essex County, NJ", "Hudson County, NJ"], "paymentAccepted": "Credit Card, Debit Card",
       "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], "opens": "07:00", "closes": "17:00"}],
       "sameAs": ["https://www.facebook.com/BergenMobileConcrete", "https://www.instagram.com/bergenmobileconcrete/", "https://www.youtube.com/@BergenMobileConcreteHawthorne"]}
LD = {'index.html': {"@context": "https://schema.org", **BIZ},
      'pumping.html': {"@context": "https://schema.org", "@type": "Service", "serviceType": "Concrete pumping", "name": "Concrete line pumping and boom pumping",
                       "url": "https://www.bergenmobileconcrete.com/" + PUMP, "provider": BIZ, "areaServed": BIZ["areaServed"]}}

ARROW = {'-1': 'M15 4 7 12l8 8', '1': 'm9 4 8 8-8 8'}
def ctl(what):
    b = lambda d, w: f'<button type="button" aria-label="{w} {what}" data-d="{d}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="{ARROW[d]}"/></svg></button>'
    return (f'<div class="ctl">{b("-1", "Previous")}<div class="dots" role="group" aria-label="Choose a {what}"></div>{b("1", "Next")}'
            '<button type="button" class="pp" aria-label="Pause"><svg class="a" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg><svg class="b" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button></div>')

def faq(q, a):
    return f'<details name="faq"><summary>{q}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18"/></svg></summary><p>{a}</p></details>'

def end(title):
    return (f'<section class="end" aria-labelledby="h-e" data-nodock>\n  <div class="wrap">\n    <h2 id="h-e"><span class="livery">{title}</span></h2>\n'
            '    <div class="cta"><a class="btn ink" href="tel:+12017977550"><svg aria-hidden="true"><use href="#tel"/></svg>Call dispatch to order</a>'
            '<a class="btn line" href="sms:+12017977550" data-sms><svg aria-hidden="true"><use href="#sms"/></svg>Text dispatch</a></div>\n  </div>\n</section>')

def order(o, root):
    vias = '\n            '.join(f'<label><input type="radio" name="via" value="{v}" data-label="{html.escape(lab)}" data-say="{html.escape(say)}"{" checked" if i == 0 else ""}><span>{short}</span></label>'
                                   for i, (v, short, lab, say) in enumerate(o['vias']))
    s = read('src/_order.html')
    for k, x in dict(h2=o['h2'], lede=o['lede'], vias=vias, v5=' v5' if len(o['vias']) == 5 else '', root=root).items(): s = s.replace('{{%s}}' % k, x)
    s = s.replace(f'name="kind" value="{o["kind"]}"', f'name="kind" value="{o["kind"]}" checked')
    for d in re.findall(r'<div class="dims" data-for="(\w+)"[^>]*>', s):  # without JavaScript the chosen kind's sizes show
        s = s.replace(f'<div class="dims" data-for="{d}" hidden>', f'<div class="dims" data-for="{d}">').replace(f'<div class="dims" data-for="{d}">', f'<div class="dims" data-for="{d}"' + ('' if d == o['kind'] else ' hidden') + '>')
    return s

ver = lambda f: f'{f}?v={hashlib.md5(read(f).encode()).hexdigest()[:8]}'
layout = read('src/_layout.html').replace('style.css"', ver('style.css') + '"').replace('app.js"', ver('app.js') + '"')
built = {}
for f in sorted((here / 'src').glob('[a-z]*.html')):
    raw = f.read_text(encoding='utf8'); meta = json.loads(re.match(r'<!--(\{.*?\})-->', raw, re.S).group(1)); body = raw.split('-->', 1)[1].strip()
    root = meta['root']
    body = body.replace('{{order}}', order(meta['order'], root))
    body = re.sub(r'\{\{ctl:(\w+)\}\}', lambda m: ctl(m.group(1)), body)
    body = re.sub(r'\{\{faq:([^|]+)\|([^}]+)\}\}', lambda m: faq(m.group(1), m.group(2)), body)
    body = re.sub(r'\{\{end:([^}]+)\}\}', lambda m: end(m.group(1)), body)
    here_nav = meta.get('nav', 'home')
    def link(u):
        if u == PUMP: return './' if here_nav == 'pumping' else root + PUMP
        return u if root == '' or u == '#quote' else root + u
    nav = ''.join(f'<li><a href="{link(u)}"' + (' aria-current="page"' if u == PUMP and here_nav == 'pumping' else '') + f'>{t}</a></li>' for u, t in NAV)
    pg = layout
    for k, x in dict(title=html.escape(meta['title'], quote=False), desc=html.escape(meta['desc']), canon=meta['canon'], ogtitle=html.escape(meta['ogtitle']), ogdesc=html.escape(meta['ogdesc']),
                     preload=meta['preload'], home=meta['home'], nav=nav, ld=json.dumps(LD[f.name], ensure_ascii=False, separators=(',', ':')), body=body, root=root).items():
        pg = pg.replace('{{%s}}' % k, x)
    assert '{{' not in pg, (f.name, re.findall(r'\{\{[^}]*\}\}', pg)[:3])
    built[meta['out']] = pg

# ---- checks
ids = {o: set(re.findall(r'\bid="([^"]+)"', b)) for o, b in built.items()}
for out, b in built.items():
    low = re.sub(r'<script type="application/ld\+json">.*?</script>', '', b, flags=re.S).lower()
    assert 'name="robots" content="noindex"' in b and b.count('<h1') == 1 and 'data-demo' in b, out
    assert set(re.findall(r'(?:tel|sms):(\+?\d+)', b)) == {TEL}, (out, set(re.findall(r'(?:tel|sms):(\+?\d+)', b)))
    for w in DROP: assert w not in low, (out, w)
    assert not re.findall(r'<a\b[^>]*href="https?://(?:www\.)?bergenmobileconcrete\.com', b), (out, 'link to the old site')
    assert len(ids[out]) == len(re.findall(r'\bid="', b)), (out, 'duplicate id')
    base = os.path.dirname(out)
    rel = lambda u: os.path.normpath(os.path.join(base, u or '.'))  # page-relative -> site-relative
    page = lambda u: (lambda r: 'index.html' if r == '.' else r + '/index.html' if u.endswith('/') or u in ('', './') else r)(rel(u))
    for h in re.findall(r'href="([^"]*#[^"]+)"', b):
        u, frag = h.split('#', 1)
        assert frag in ids.get(out if u == '' else page(u), set()), (out, h)
    for u in re.findall(r'(?:src|href)="(?!https?:|tel:|sms:|#|data:)([^"#?]+)', b):
        assert page(u) in built or (here / rel(u)).is_file(), (out, u)

for out, b in built.items():
    (here / out).parent.mkdir(parents=True, exist_ok=True); (here / out).write_text(b, encoding='utf8')
    print(out, len(b), 'bytes,', len(re.findall(r'<section', b)), 'sections')
