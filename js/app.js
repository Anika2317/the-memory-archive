(function () {
  var PLACES = {
    'Del Mar': [69, 46],
    'La Jolla': [60, 262],
    Clairemont: [171, 289],
    'Pacific Beach': [92, 348],
    'Mission Beach': [92, 393],
    'Ocean Beach': [94, 432],
    'Point Loma': [104, 490],
    'Old Town': [180, 419],
    Hillcrest: [238, 428],
    'North Park': [292, 446],
    'Balboa Park': [257, 462],
    Downtown: [240, 490],
    'Logan Heights': [287, 509],
    'Barrio Logan': [270, 522],
    'City Heights': [345, 430],
    'La Mesa': [480, 392],
    Coronado: [205, 532],
    'National City': [345, 548],
    'Chula Vista': [396, 612],
    'Imperial Beach': [306, 714],
    'Somewhere else in San Diego': [440, 250],
  };
  var REGION_OF_HOOD = {
    'Del Mar': 'coast',
    'La Jolla': 'coast',
    'Pacific Beach': 'coast',
    'Mission Beach': 'coast',
    'Ocean Beach': 'coast',
    'Point Loma': 'coast',
    Coronado: 'coast',
    'Imperial Beach': 'coast',
    'Logan Heights': 'south',
    'Barrio Logan': 'south',
    'National City': 'south',
    'Chula Vista': 'south',
  };
  var FW = 1300,
    FH = 720;
  var REGIONS = [
    { id: 'family', name: 'Family & People', c: [660, 390] },
    { id: 'stories', name: 'Movies & Books', c: [660, 130] },
    { id: 'places', name: 'Places', c: [990, 175] },
    { id: 'love', name: 'Love', c: [1095, 470] },
    { id: 'smell', name: 'Food & Kitchens', c: [850, 625] },
    { id: 'work', name: 'Work & Routine', c: [500, 625] },
    { id: 'music', name: 'Music & Sound', c: [250, 500] },
  ];
  var REG = {};
  REGIONS.forEach(function (r) {
    REG[r.id] = r;
  });
  var KEY_REGION = {
    music: 'music',
    beach: 'places',
    summer: 'places',
    coast: 'places',
    south: 'places',
    love: 'love',
    parents: 'family',
    grandparents: 'family',
    sundays: 'family',
    recipes: 'smell',
    cars: 'places',
    work: 'work',
    movies: 'stories',
    books: 'stories',
  };
  var KEYNAME = {
    music: 'music',
    cars: 'red convertibles',
    summer: 'summer',
    beach: 'the beach',
    recipes: 'recipes',
    sundays: 'Sundays',
    grandparents: 'grandparents',
    parents: 'parents',
    love: 'falling in love',
    work: 'work',
    coast: 'the coast',
    south: 'the South Bay',
    movies: 'movies',
    books: 'books',
  };

  var MEMORIES = [];
  // Ids shown on the page; never reused, so deleting a memory can't make two share one.
  var memSeq = 0;
  var PEOPLE = {};
  function siblings(m) {
    return m.person
      ? MEMORIES.filter(function (x) {
          return x.person === m.person;
        }).sort(function (a, b) {
          return (a.year || 9999) - (b.year || 9999);
        })
      : [m];
  }
  var SYN = {
    music: [
      'music',
      'song',
      'songs',
      'sing',
      'singing',
      'sang',
      'piano',
      'organ',
      'guitar',
      'band',
      'radio',
      'record',
      'records',
      'choir',
      'dance',
      'dancing',
    ],
    beach: ['beach', 'ocean', 'surf', 'surfing', 'pier', 'sand', 'waves', 'shore', 'cove'],
    recipes: [
      'recipe',
      'recipes',
      'cooking',
      'baking',
      'pie',
      'cake',
      'tamales',
      'bread',
      'cookies',
      'kitchen',
      'smell',
      'cinnamon',
    ],
    cars: ['car', 'cars', 'convertible', 'mustang', 'drive', 'driving', 'truck'],
    summer: ['summer', 'summers'],
    sundays: ['sunday', 'sundays'],
    parents: ['mom', 'mother', 'dad', 'father', 'mama', 'papa'],
    grandparents: [
      'grandma',
      'grandmother',
      'grandpa',
      'grandfather',
      'abuela',
      'nani',
      'nana',
      'grandchildren',
    ],
    love: ['married', 'wedding', 'date', 'husband', 'wife', 'love'],
    work: ['job', 'work', 'worked', 'factory', 'cannery', 'office', 'shipyard'],
    movies: ['movie', 'movies', 'film', 'films', 'theater', 'theatre', 'cinema', 'drive-in'],
    books: ['book', 'books', 'read', 'reading', 'library', 'novel', 'poem', 'poems'],
  };
  var FEELINGS = ['Happy', 'Funny', 'Everyday', 'Bittersweet', 'Hard', 'Surprising'];
  var SD_BOX = [-117.6, 32.53, -116.08, 33.51];

  function toMap(lng, lat) {
    var x = 1729.78 * lng + 20.29 * lat + 202238.71;
    var y = -20.76 * lng - 1777.53 * lat + 56207.36;
    return [Math.max(12, Math.min(588, x)), Math.max(12, Math.min(788, y))];
  }

  function byLine(rel) {
    rel = rel.trim();
    if (!rel || /^it'?s my own/i.test(rel)) return 'In their own words';
    return 'Shared by ' + rel.replace(/^(i'?m|i am)\s+/i, '');
  }
  var MEDIA_NAME = {
    audio: 'Voice recording',
    video: 'Video clip',
    drawing: 'Drawing or painting',
    photo: 'Photo',
    music: 'Music piece',
  };

  var $ = function (id) {
    return document.getElementById(id);
  };

  // Shared storage (Supabase). Without settings in js/config.js, additions stay in this tab only.
  var DB = window.ARCHIVE_DB || {};
  var online = !!(DB.url && DB.key);
  if (!online) console.warn('Archive storage is not set up: fill in js/config.js.');
  function dbFetch(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign(
      { apikey: DB.key, Authorization: 'Bearer ' + DB.key },
      opts.headers,
    );
    return fetch(DB.url + path, opts).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      return r;
    });
  }
  // Row ids this tab saved itself, so live updates don't add them a second time.
  var savedHere = { memories: {}, answers: {} };
  var saving = 0;
  // Delete keys for rows added in this browser, by table and row id. The database keeps only their hash.
  function ownKeys() {
    try {
      return JSON.parse(localStorage.getItem('archive-own')) || { memories: {}, answers: {} };
    } catch (e) {
      return { memories: {}, answers: {} };
    }
  }
  function keepKey(table, rowId, key) {
    var own = ownKeys();
    own[table][rowId] = key;
    try {
      localStorage.setItem('archive-own', JSON.stringify(own));
    } catch (e) {}
  }
  function newKey() {
    var b = new Uint8Array(24);
    crypto.getRandomValues(b);
    return Array.prototype.map
      .call(b, function (x) {
        return ('0' + x.toString(16)).slice(-2);
      })
      .join('');
  }
  function dbInsert(table, row) {
    saving++;
    var key = newKey();
    row.delete_key = key;
    return dbFetch('/rest/v1/' + table + '?select=id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(row),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (rows) {
        savedHere[table][rows[0].id] = true;
        keepKey(table, rows[0].id, key);
        return rows[0].id;
      })
      .finally(function () {
        saving--;
      });
  }

  // Admin sign-in (Supabase Auth). The session is only used to call the delete functions.
  var admin = null;
  function readSession() {
    try {
      return JSON.parse(localStorage.getItem('archive-admin'));
    } catch (e) {
      return null;
    }
  }
  function storeSession(s) {
    try {
      if (s) localStorage.setItem('archive-admin', JSON.stringify(s));
      else localStorage.removeItem('archive-admin');
    } catch (e) {}
  }
  function authToken(grant, body) {
    return dbFetch('/auth/v1/token?grant_type=' + grant, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (s) {
        var out = {
          access: s.access_token,
          refresh: s.refresh_token,
          until: Date.now() + (s.expires_in - 60) * 1000,
          email: s.user && s.user.email,
        };
        storeSession(out);
        return out;
      });
  }
  // A fresh access token for the signed-in admin, or null for everyone else.
  function adminToken() {
    var s = readSession();
    if (!s) return Promise.resolve(null);
    if (Date.now() < s.until) return Promise.resolve(s.access);
    return authToken('refresh_token', { refresh_token: s.refresh }).then(
      function (n) {
        return n.access;
      },
      function () {
        storeSession(null);
        return null;
      },
    );
  }
  // Like dbFetch, but as the signed-in admin when there is one.
  function asAdmin(path, opts) {
    return adminToken().then(function (token) {
      opts = opts || {};
      if (token)
        opts.headers = Object.assign({}, opts.headers, { Authorization: 'Bearer ' + token });
      return dbFetch(path, opts);
    });
  }
  function rpc(name, args) {
    return asAdmin('/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args || {}),
    }).then(function (r) {
      return r.json();
    });
  }
  function checkAdmin() {
    if (!online || !readSession()) {
      setAdmin(null);
      return Promise.resolve();
    }
    return rpc('is_admin').then(
      function (yes) {
        setAdmin(yes ? readSession().email : null);
        if (!yes) storeSession(null);
      },
      function () {
        setAdmin(null);
      },
    );
  }
  function setAdmin(email) {
    admin = email ? { email: email } : null;
    $('adminState').textContent = admin ? 'Signed in as admin (' + admin.email + ')' : '';
    $('adminBtn').textContent = admin ? 'Sign out' : 'Admin sign-in';
    $('reqBtn').hidden = !admin;
    if (state.active != null) openMemory(state.active);
    qmDetail();
  }
  function canDelete(table, rowId) {
    return online && rowId != null && (!!admin || !!ownKeys()[table][rowId]);
  }
  function removeRow(table, rowId) {
    var fn = table === 'memories' ? 'delete_memory' : 'delete_answer';
    return rpc(fn, { row_id: rowId, key: ownKeys()[table][rowId] || null }).then(function (ok) {
      if (!ok) throw new Error('not allowed');
    });
  }
  // The private link holds the memory's delete key, so whoever has it can delete that memory.
  function privateLink(m) {
    var key = ownKeys().memories[m.rowId];
    return key ? location.origin + location.pathname + '#manage=' + m.rowId + '.' + key : null;
  }
  function copyText(input, btn) {
    var done = function () {
      btn.textContent = 'Copied';
      setTimeout(function () {
        btn.textContent = 'Copy link';
      }, 2000);
    };
    input.select();
    if (navigator.clipboard) navigator.clipboard.writeText(input.value).then(done, function () {});
  }
  function removeMedia(url) {
    var at = url ? url.indexOf('/storage/v1/object/public/media/') : -1;
    if (at < 0 || url.indexOf(DB.url) !== 0) return;
    dbFetch('/storage/v1/object/media/' + url.slice(at + 32), { method: 'DELETE' }).catch(
      function (e) {
        console.warn('Could not remove the media file', e);
      },
    );
  }
  function uploadMedia(file) {
    var ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    var path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    return dbFetch('/storage/v1/object/media/' + path, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    }).then(function () {
      return DB.url + '/storage/v1/object/public/media/' + path;
    });
  }
  function saveMemory(mem, file) {
    if (!online) return Promise.resolve();
    return (file ? uploadMedia(file) : Promise.resolve(null)).then(function (url) {
      if (url) mem.media.url = url;
      var data = Object.assign({}, mem);
      delete data.id;
      delete data.mine;
      delete data.fresh;
      delete data.rowId;
      return dbInsert('memories', { data: data }).then(function (rowId) {
        mem.rowId = rowId;
      });
    });
  }
  function saveAnswer(question, a) {
    if (!online) return Promise.resolve();
    return dbInsert('answers', {
      question: question,
      data: { s: a.s, full: a.full, by: a.by },
    }).then(function (rowId) {
      a.rowId = rowId;
    });
  }
  function busy(form, label) {
    var btn = form.querySelector('.submit');
    btn.disabled = !!label;
    if (label) {
      btn.dataset.label = btn.textContent;
      btn.textContent = label;
    } else btn.textContent = btn.dataset.label;
  }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function cap(t) {
    return t.replace(/^the /, 'The ').replace(/^./, function (c) {
      return c.toUpperCase();
    });
  }
  function yr(m) {
    return m.year ? String(m.year) : 'Undated';
  }
  function byId(id) {
    return MEMORIES.filter(function (m) {
      return m.id === id;
    })[0];
  }
  function rng(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function decade(m) {
    return m.year ? Math.floor(m.year / 10) * 10 + 's' : null;
  }
  function keyName(k) {
    if (/^\d{4}s$/.test(k)) return 'the ' + k;
    return KEYNAME[k] || k;
  }
  function plain(s) {
    return String(s).replace(/^♪\s*/, '');
  }

  function pieces(m) {
    var out = [
      { type: 'Year', text: yr(m), key: decade(m) },
      { type: 'Neighborhood', text: m.hood, key: REGION_OF_HOOD[m.hood] || null },
    ];
    m.frags.forEach(function (f) {
      out.push({ type: f[0], text: f[1], key: f[2] });
    });
    return out;
  }
  function sharing(key, exceptId) {
    if (!key) return [];
    return MEMORIES.filter(function (o) {
      return (
        o.id !== exceptId &&
        pieces(o).some(function (p) {
          return p.key === key;
        })
      );
    }).sort(function (a, b) {
      return (a.year || 9999) - (b.year || 9999);
    });
  }
  function themesOf(m) {
    return m.themes && m.themes.length ? m.themes : [m.region];
  }
  function inTheme(m, id) {
    return themesOf(m).indexOf(id) !== -1;
  }
  function themeNames(m) {
    return themesOf(m)
      .map(function (id) {
        return (REG[id] || REG.family).name;
      })
      .join(' · ');
  }
  function regionCount(id) {
    return MEMORIES.filter(function (m) {
      return inTheme(m, id);
    }).length;
  }

  var state = {
    active: null,
    region: null,
    hover: null,
    hlKey: null,
    lockKey: null,
    timers: [],
    shift: 0,
  };
  var cv = $('net'),
    ctx = cv.getContext('2d');
  var W = 0,
    H = 0,
    dpr = 1,
    s = 1,
    ox = 0,
    oy = 0;
  var cache = document.createElement('canvas'),
    cctx = cache.getContext('2d');
  var nodes = [],
    links = [],
    pulses = [],
    lastP = [],
    dust = [],
    dustLinks = [];

  function buildDust() {
    var r = rng(77);
    dust = [];
    while (dust.length < 620) {
      var a = r() * Math.PI * 2,
        d = Math.pow(r(), 0.7);
      var br = [];
      var nb = 2 + Math.floor(r() * 3);
      for (var b = 0; b < nb; b++)
        br.push({ a: r() * 6.283, l: 4 + r() * 9, bend: (r() - 0.5) * 0.8 });
      dust.push({
        x: FW / 2 + Math.cos(a) * d * FW * 0.54,
        y: FH / 2 + Math.sin(a) * d * FH * 0.54,
        r: 0.8 + r() * 1.4,
        br: br,
      });
    }
    dustLinks = [];
    for (var i = 0; i < dust.length; i++)
      for (var j = i + 1; j < dust.length; j++) {
        var dd = Math.hypot(dust[i].x - dust[j].x, dust[i].y - dust[j].y);
        if (dd < 38 && r() < 0.55) dustLinks.push([i, j, (r() - 0.5) * 0.6]);
      }
  }
  function makeDendrites(seed) {
    var r = rng(seed),
      out = [],
      n = 6 + Math.floor(r() * 3);
    for (var i = 0; i < n; i++) {
      var a = (i * 6.283) / n + (r() - 0.5) * 0.7,
        L = 16 + r() * 20;
      var x1 = Math.cos(a) * L,
        y1 = Math.sin(a) * L,
        bend = (r() - 0.5) * 0.5;
      var cx = x1 / 2 - y1 * bend,
        cy = y1 / 2 + x1 * bend;
      out.push({ x0: 0, y0: 0, cx: cx, cy: cy, x1: x1, y1: y1, w: 1.4 });
      var forks = 1 + Math.floor(r() * 2);
      for (var f = 0; f < forks; f++) {
        var t = 0.5 + r() * 0.3,
          fx = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * cx + t * t * x1,
          fy = 2 * (1 - t) * t * cy + t * t * y1;
        var fa = a + (f === 0 ? 1 : -1) * (0.45 + r() * 0.5),
          fl = L * (0.35 + r() * 0.3);
        var ex = fx + Math.cos(fa) * fl,
          ey = fy + Math.sin(fa) * fl;
        out.push({
          x0: fx,
          y0: fy,
          cx: (fx + ex) / 2 + (r() - 0.5) * 4,
          cy: (fy + ey) / 2 + (r() - 0.5) * 4,
          x1: ex,
          y1: ey,
          w: 0.8,
        });
      }
    }
    return out;
  }
  function layout() {
    var r = cv.getBoundingClientRect();
    W = r.width;
    H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var mx = W < 640 ? 8 : 24,
      my = 16;
    s = Math.min((W - 2 * mx) / FW, (H - 2 * my) / FH);
    ox = (W - FW * s) / 2;
    oy = (H - FH * s) / 2;
    cache.width = cv.width;
    cache.height = cv.height;
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cctx.clearRect(0, 0, W, H);
    cctx.save();
    cctx.translate(ox, oy);
    cctx.scale(s, s);
    dust.forEach(function (d) {
      cctx.fillStyle = 'rgba(122,80,194,0.16)';
      cctx.beginPath();
      cctx.arc(d.x, d.y, d.r / Math.max(s, 0.6), 0, 6.283);
      cctx.fill();
    });
    cctx.restore();
    var old = {};
    nodes.forEach(function (n) {
      old[n.m.id] = n;
    });
    var perRegion = {};
    nodes = MEMORIES.map(function (m) {
      var reg = REG[m.region] || REG.family;
      var k = (perRegion[reg.id] = (perRegion[reg.id] || 0) + 1);
      var rr = rng(m.id * 7919 + 13);
      var a = k * 2.399 + rr() * 0.6,
        d = 26 + Math.sqrt(k) * 30 + rr() * 10;
      var o = old[m.id];
      return {
        m: m,
        bx: reg.c[0] + Math.cos(a) * d,
        by: reg.c[1] + Math.sin(a) * d * 0.8,
        ph: rr() * 6.28,
        dend: makeDendrites(m.id * 131 + 7),
        lit: o ? o.lit : 0,
        grow: o ? o.grow : 0,
        born: o ? o.born : m.fresh ? 0 : 1,
      };
    });
    links = [];
    var deg = {};
    var keysOf = function (m) {
      return m.frags
        .map(function (f) {
          return f[2];
        })
        .filter(Boolean);
    };
    var pairs = [];
    nodes.forEach(function (n, i) {
      nodes.forEach(function (o, j) {
        if (j <= i) return;
        var a = keysOf(n.m),
          b = keysOf(o.m);
        var sh = a.filter(function (k) {
          return b.indexOf(k) !== -1;
        });
        if (sh.length)
          pairs.push({ i: i, j: j, k: sh.length, d: Math.hypot(n.bx - o.bx, n.by - o.by) });
      });
    });
    pairs.sort(function (a, b) {
      return b.k - a.k || a.d - b.d;
    });
    pairs.forEach(function (p) {
      if ((deg[p.i] || 0) >= 4 || (deg[p.j] || 0) >= 4) return;
      deg[p.i] = (deg[p.i] || 0) + 1;
      deg[p.j] = (deg[p.j] || 0) + 1;
      links.push({ a: p.i, b: p.j, bend: (rng(p.i * 31 + p.j)() - 0.5) * 0.5 });
    });
  }

  function S(x, y) {
    return [ox + state.shift + x * s, oy + y * s];
  }
  function pos(n, t) {
    var p = S(n.bx, n.by);
    if (reduce) return p;
    return [p[0] + Math.sin(t * 0.0006 + n.ph) * 3, p[1] + Math.cos(t * 0.0005 + n.ph) * 3];
  }
  function curve(p, q, bend) {
    var mx = (p[0] + q[0]) / 2,
      my = (p[1] + q[1]) / 2,
      dx = q[0] - p[0],
      dy = q[1] - p[1];
    return [mx - dy * bend, my + dx * bend];
  }
  function onCurve(p, c, q, u) {
    var v = 1 - u;
    return [
      v * v * p[0] + 2 * v * u * c[0] + u * u * q[0],
      v * v * p[1] + 2 * v * u * c[1] + u * u * q[1],
    ];
  }
  function idxOf(id) {
    for (var i = 0; i < nodes.length; i++) if (nodes[i].m.id === id) return i;
    return -1;
  }
  function connected(i) {
    var out = [];
    links.forEach(function (l) {
      if (l.a === i) out.push(l.b);
      else if (l.b === i) out.push(l.a);
    });
    return out;
  }
  function gapU(A, B) {
    var L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
    return Math.min(0.22, 30 / L);
  }
  function strokeSeg(A, c, B, u0, u1, steps) {
    var p = onCurve(A, c, B, u0);
    ctx.moveTo(p[0], p[1]);
    for (var k = 1; k <= steps; k++) {
      var q = onCurve(A, c, B, u0 + ((u1 - u0) * k) / steps);
      ctx.lineTo(q[0], q[1]);
    }
  }
  function bouton(A, c, B, u, dirSign, alpha) {
    var p = onCurve(A, c, B, u),
      q = onCurve(A, c, B, u - 0.02 * dirSign);
    var ang = Math.atan2(p[1] - q[1], p[0] - q[0]);
    ctx.strokeStyle = 'rgba(122,80,194,' + alpha + ')';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    [-0.6, 0.6].forEach(function (da) {
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(p[0] + Math.cos(ang + da) * 6, p[1] + Math.sin(ang + da) * 6);
    });
    ctx.stroke();
    ctx.fillStyle = 'rgba(106,66,176,' + alpha + ')';
    ctx.beginPath();
    ctx.arc(p[0], p[1], 2.1, 0, 6.283);
    ctx.fill();
  }

  var bursts = [];
  function draw(t) {
    var targetShift = state.active != null && W >= 832 ? -Math.min(200, W * 0.14) : 0;
    state.shift += (targetShift - state.shift) * (reduce ? 1 : 0.07);
    ctx.clearRect(0, 0, W, H);
    var open = state.active != null;
    ctx.save();
    ctx.globalAlpha = open ? 0.6 : 1;
    ctx.drawImage(cache, state.shift, 0, W, H);
    ctx.restore();
    ctx.lineCap = 'round';

    REGIONS.forEach(function (r) {
      var c = S(r.c[0], r.c[1]),
        on = state.region === r.id;
      var g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 140 * s);
      g.addColorStop(0, 'rgba(122,80,194,' + (on ? 0.24 : 0.08) + ')');
      g.addColorStop(1, 'rgba(122,80,194,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c[0], c[1], 140 * s, 0, 6.283);
      ctx.fill();
      if (W >= 560) {
        var a = on ? 0.95 : state.region ? 0.22 : open ? 0.3 : 0.6;
        ctx.textAlign = 'center';
        ctx.font =
          Math.max(11, Math.round(13 * Math.min(1.25, s * 1.2))) +
          'px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(74,48,120,' + a + ')';
        ctx.fillText(r.name.toUpperCase(), c[0], c[1] - 112 * s);
      }
    });

    var P = nodes.map(function (n) {
      return pos(n, t);
    });
    var ai = open ? idxOf(state.active) : -1,
      near = ai >= 0 ? connected(ai) : [];
    var activeM = ai >= 0 ? nodes[ai].m : null;
    if (activeM && activeM.person)
      nodes.forEach(function (n, i) {
        if (n.m.person === activeM.person && i !== ai) near.push(i);
      });
    var key = state.lockKey || state.hlKey,
      hlIds = {};
    if (key)
      sharing(key, state.active).forEach(function (m) {
        hlIds[m.id] = 1;
      });
    var ds = Math.max(0.7, Math.min(1.3, s * 1.25));
    links.forEach(function (l) {
      var A = nodes[l.a],
        B = nodes[l.b];
      var hot = ai >= 0 && (l.a === ai || l.b === ai);
      var inReg = state.region && inTheme(A.m, state.region) && inTheme(B.m, state.region);
      var alpha = hot ? 0.6 : inReg ? 0.5 : state.region ? 0.06 : open ? 0.1 : 0.2;
      alpha *= Math.min(A.born, B.born);
      var pA = P[l.a],
        pB = P[l.b],
        c = curve(pA, pB, l.bend),
        g = gapU(pA, pB) * 0.5;
      if (hot) {
        ctx.strokeStyle = 'rgba(122,80,194,0.1)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        strokeSeg(pA, c, pB, g, 1 - g, 24);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(122,80,194,' + alpha + ')';
      ctx.lineWidth = hot ? 1.3 : 1;
      ctx.beginPath();
      strokeSeg(pA, c, pB, g, 1 - g, 24);
      ctx.stroke();
      [g, 1 - g].forEach(function (u) {
        var q = onCurve(pA, c, pB, u),
          rr = hot ? 7 : 5;
        var sg = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr);
        sg.addColorStop(0, 'rgba(122,80,194,' + Math.min(0.9, alpha * 1.6) + ')');
        sg.addColorStop(1, 'rgba(122,80,194,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(q[0], q[1], rr, 0, 6.283);
        ctx.fill();
      });
      if (!reduce) {
        for (var f = 0; f < 2; f++) {
          var ph = (t * 0.00007 * (1 + (l.a % 3) * 0.2) + f * 0.5 + l.bend) % 1;
          if (ph < 0) ph += 1;
          var fx = onCurve(pA, c, pB, g + (1 - 2 * g) * ph),
            fa = Math.sin(ph * Math.PI) * Math.min(0.85, alpha * 2.2);
          var fg = ctx.createRadialGradient(fx[0], fx[1], 0, fx[0], fx[1], 4);
          fg.addColorStop(0, 'rgba(150,110,220,' + fa + ')');
          fg.addColorStop(1, 'rgba(122,80,194,0)');
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.arc(fx[0], fx[1], 4, 0, 6.283);
          ctx.fill();
        }
      }
    });
    var groups = {};
    nodes.forEach(function (n, i) {
      if (n.m.person) (groups[n.m.person] = groups[n.m.person] || []).push(i);
    });
    Object.keys(groups).forEach(function (pid) {
      var ids = groups[pid].sort(function (a, b) {
        return (nodes[a].m.year || 9999) - (nodes[b].m.year || 9999);
      });
      var on = activeM && activeM.person === pid;
      for (var q = 1; q < ids.length; q++) {
        var pA = P[ids[q - 1]],
          pB = P[ids[q]],
          c = curve(pA, pB, -0.18);
        ctx.strokeStyle = 'rgba(90,60,130,' + (on ? 0.12 : 0.04) + ')';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(pA[0], pA[1]);
        ctx.quadraticCurveTo(c[0], c[1], pB[0], pB[1]);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(90,60,130,' + (on ? 0.75 : state.region ? 0.08 : 0.22) + ')';
        ctx.lineWidth = on ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(pA[0], pA[1]);
        ctx.quadraticCurveTo(c[0], c[1], pB[0], pB[1]);
        ctx.stroke();
      }
    });
    if (ai >= 0 && key) {
      nodes.forEach(function (n, i) {
        if (!hlIds[n.m.id]) return;
        var c = curve(P[ai], P[i], 0.14);
        ctx.strokeStyle = 'rgba(122,80,194,0.14)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(P[ai][0], P[ai][1]);
        ctx.quadraticCurveTo(c[0], c[1], P[i][0], P[i][1]);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(90,53,150,0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(P[ai][0], P[ai][1]);
        ctx.quadraticCurveTo(c[0], c[1], P[i][0], P[i][1]);
        ctx.stroke();
      });
    }
    pulses = pulses.filter(function (p) {
      if (!P[p.from] || !P[p.to]) return false;
      var A = P[p.from],
        B = P[p.to],
        c = curve(A, B, p.bend),
        g = gapU(A, B) * 0.5;
      p.u += p.v;
      var u = g + (1 - 2 * g) * Math.min(1, p.u);
      if (p.u >= 1) {
        var e = onCurve(A, c, B, 1 - g);
        if (p.big)
          for (var k = 0; k < 6; k++)
            bursts.push({
              x: e[0],
              y: e[1],
              tx: B[0] + (Math.random() - 0.5) * 10,
              ty: B[1] + (Math.random() - 0.5) * 10,
              k: 0,
              life: 34 + Math.random() * 16,
              to: p.to,
              big: p.big,
              wob: (Math.random() - 0.5) * 14,
            });
        return false;
      }
      var h = onCurve(A, c, B, u),
        rad = p.big ? 10 : 6;
      var gr = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], rad);
      gr.addColorStop(0, 'rgba(106,66,176,' + (p.big ? 0.95 : 0.5) + ')');
      gr.addColorStop(1, 'rgba(122,80,194,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(h[0], h[1], rad, 0, 6.283);
      ctx.fill();
      return true;
    });
    bursts = bursts.filter(function (b) {
      b.k++;
      var q = b.k / b.life;
      if (q >= 1) {
        if (nodes[b.to]) nodes[b.to].lit = 1;
        return false;
      }
      var e = 1 - Math.pow(1 - q, 2);
      var x = b.x + (b.tx - b.x) * e * 0.55 + Math.sin(q * 3.14) * b.wob * 0.3,
        y = b.y + (b.ty - b.y) * e * 0.55 + Math.cos(q * 3.14) * b.wob * 0.3;
      ctx.fillStyle = 'rgba(106,66,176,' + (1 - q) * (b.big ? 0.95 : 0.6) + ')';
      ctx.beginPath();
      ctx.arc(x, y, b.big ? 1.6 : 1.2, 0, 6.283);
      ctx.fill();
      return true;
    });
    nodes.forEach(function (n, i) {
      if (n.born < 1) n.born = Math.min(1, n.born + 0.02);
      n.lit = Math.max(0, n.lit - 0.006);
      n.grow += ((i === ai ? 1 : 0) - n.grow) * (reduce ? 1 : 0.08);
      var p = P[i],
        isH = state.hover === i,
        isN = near.indexOf(i) !== -1,
        isHL = !!hlIds[n.m.id];
      var dim =
        (state.region && !inTheme(n.m, state.region)) ||
        (open && i !== ai && !isN && !isHL && n.lit < 0.2);
      var a = (dim ? 0.3 : 1) * n.born;
      var bright = i === ai || isH || isHL || n.lit > 0.4;
      var reach = ds * (1 + n.grow * 0.35) * (0.5 + 0.5 * n.born);
      var r = (5 + n.grow * 3.5 + (isH ? 1.2 : 0) + (isHL ? 1.2 : 0)) * (0.4 + 0.6 * n.born);
      var glow = 18 + n.grow * 30 + (isH || isN || isHL || n.lit > 0.3 ? 8 : 0);
      var gg = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], glow);
      gg.addColorStop(0, 'rgba(122,80,194,' + (0.55 * a + n.lit * 0.3 + n.grow * 0.2) + ')');
      gg.addColorStop(1, 'rgba(122,80,194,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(p[0], p[1], glow, 0, 6.283);
      ctx.fill();
      var body = ctx.createRadialGradient(p[0] - r * 0.3, p[1] - r * 0.3, 0, p[0], p[1], r);
      body.addColorStop(0, 'rgba(255,255,255,' + a + ')');
      body.addColorStop(1, bright ? 'rgba(106,66,176,' + a + ')' : 'rgba(150,115,212,' + a + ')');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(p[0], p[1], r, 0, 6.283);
      ctx.fill();
      if (n.grow > 0.05) {
        ctx.strokeStyle = 'rgba(90,53,150,' + 0.55 * n.grow + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p[0], p[1], r + 8 + n.grow * 4, 0, 6.283);
        ctx.stroke();
      }
      if (n.m.fresh) {
        ctx.strokeStyle =
          'rgba(90,53,150,' + (0.35 + (reduce ? 0 : Math.sin(t * 0.004) * 0.25)) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 30, 0, 6.283);
        ctx.stroke();
      }
    });
    lastP = P;
  }
  var ambientAt = 0;
  function frame(t) {
    if (!reduce && t > ambientAt && links.length) {
      var l = links[Math.floor(Math.random() * links.length)],
        d = Math.random() < 0.5;
      pulses.push({
        from: d ? l.a : l.b,
        to: d ? l.b : l.a,
        bend: d ? l.bend : -l.bend,
        u: 0,
        v: 0.007 + Math.random() * 0.006,
        big: false,
      });
      ambientAt = t + 500 + Math.random() * 800;
    }
    draw(t);
    requestAnimationFrame(frame);
  }
  function fire(i) {
    connected(i).forEach(function (j) {
      var l = links.filter(function (k) {
        return (k.a === i && k.b === j) || (k.b === i && k.a === j);
      })[0];
      pulses.push({
        from: i,
        to: j,
        bend: l.a === i ? l.bend : -l.bend,
        u: 0,
        v: 0.014,
        big: true,
      });
    });
    if (reduce)
      connected(i).forEach(function (j) {
        nodes[j].lit = 1;
      });
  }
  function still() {
    if (reduce) draw(0);
  }
  function hit(ev) {
    var r = cv.getBoundingClientRect(),
      x = ev.clientX - r.left,
      y = ev.clientY - r.top,
      best = -1,
      bd = 22;
    lastP.forEach(function (p, i) {
      var d = Math.hypot(p[0] - x, p[1] - y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  }
  cv.addEventListener('pointermove', function (ev) {
    var i = hit(ev);
    state.hover = i >= 0 ? i : null;
    cv.style.cursor = i >= 0 ? 'pointer' : 'default';
    var tip = $('tip');
    if (i >= 0 && nodes[i].m.id !== state.active) {
      var p = lastP[i],
        m = nodes[i].m;
      tip.textContent = yr(m) + ' · ' + m.hood;
      tip.style.left = p[0] + 'px';
      tip.style.top = p[1] + 'px';
      tip.classList.add('on');
    } else tip.classList.remove('on');
    still();
  });
  cv.addEventListener('pointerleave', function () {
    state.hover = null;
    $('tip').classList.remove('on');
    still();
  });
  cv.addEventListener('click', function (ev) {
    var i = hit(ev);
    if (i >= 0) openMemory(nodes[i].m.id);
    else if (state.active != null) closeMemory();
  });
  function mediaIcon(t) {
    var p =
      {
        audio:
          '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
        music:
          '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
        video: '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
        drawing: '<path d="M4 20c3 0 4-2 4-4s2-3 3-3M11 13l8-8 1 1-8 8"/>',
        photo:
          '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>',
      }[t] || '';
    return (
      '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      p +
      '</svg>'
    );
  }
  function mediaBlock(m) {
    var md = m.media;
    if (!md) return '';
    var cap =
      '<div class="cap"><span>' +
      mediaIcon(md.type) +
      ' ' +
      esc(md.label) +
      '</span><span class="mono">' +
      esc(MEDIA_NAME[md.type]) +
      (md.dur ? ' · ' + esc(md.dur) : '') +
      '</span></div>';
    if (!md.url) return '';
    var el =
      md.type === 'audio' || md.type === 'music'
        ? '<audio controls src="' + md.url + '"></audio>'
        : md.type === 'video'
          ? '<video controls src="' + md.url + '"></video>'
          : '<img src="' + md.url + '" alt="' + esc(md.label) + '">';
    return '<div class="media">' + el + cap + '</div>';
  }
  function clearTimers() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
  }
  function contentKeys(m) {
    var out = [];
    m.frags.forEach(function (f) {
      if (f[2] && out.indexOf(f[2]) === -1 && sharing(f[2], m.id).length) out.push(f[2]);
    });
    return out;
  }
  function excerpt(text) {
    var m = String(text).match(/^.*?[.!?](\s|$)/);
    var first = m ? m[0].trim() : text;
    return first.length < text.length ? first + ' \u2026' : first;
  }
  function openMemory(id, banner) {
    clearTimers();
    var m = byId(id);
    state.active = id;
    state.hlKey = null;
    state.lockKey = null;
    if (state.region && !inTheme(m, state.region)) {
      state.region = null;
      drawChips();
    }
    $('tip').classList.remove('on');
    var ai = idxOf(id);
    if (ai >= 0) fire(ai);
    var sibs = siblings(m),
      keys = contentKeys(m);
    var linked = {};
    keys.forEach(function (k) {
      sharing(k, m.id).forEach(function (x) {
        linked[x.id] = 1;
      });
    });
    var nLinked = Object.keys(linked).length;
    var link = online && m.rowId != null ? privateLink(m) : null;
    var card = $('card');
    card.innerHTML =
      '<button class="close" id="cardClose" aria-label="Close this memory"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      (banner
        ? '<span class="archived-tag">Your memory joined the network' +
          (online ? '' : ' · preview only') +
          '</span>'
        : '') +
      '<span class="mono region">' +
      esc(themeNames(m)) +
      (m.kind ? '<span class="kind-tag">' + esc(m.kind) + '</span>' : '') +
      '</span>' +
      '<h2>' +
      esc(m.hood) +
      ', ' +
      esc(yr(m)) +
      '</h2>' +
      (sibs.length > 1
        ? '<p class="person">One of ' +
          sibs.length +
          ' memories about <strong>' +
          esc(PEOPLE[m.person]) +
          '</strong><button class="linkbtn" id="sibNext">Next memory about ' +
          esc(PEOPLE[m.person]) +
          ' \u2192</button></p>'
        : '') +
      '<p class="pieces-line">' +
      m.frags
        .slice(0, 3)
        .map(function (f) {
          return esc(f[1]);
        })
        .join(' \u00b7 ') +
      '</p>' +
      '<p class="excerpt">\u201C' +
      esc(excerpt(m.text)) +
      '\u201D</p>' +
      (m.media
        ? '<p class="media-line">' +
          mediaIcon(m.media.type) +
          'Includes a ' +
          esc(MEDIA_NAME[m.media.type].toLowerCase()) +
          '</p>'
        : '') +
      '<button class="read-btn" id="readBtn">Read the whole memory</button>' +
      (keys.length
        ? '<div class="conn"><span class="mono">Shares pieces with ' +
          nLinked +
          ' ' +
          (nLinked === 1 ? 'memory' : 'memories') +
          '</span><div class="chips">' +
          keys
            .map(function (k) {
              return (
                '<button class="fchip" data-k="' +
                esc(k) +
                '" aria-pressed="false">' +
                esc(cap(keyName(k))) +
                '<span class="n">' +
                sharing(k, m.id).length +
                '</span></button>'
              );
            })
            .join('') +
          '</div><p class="hint">Choose one to light those memories up.</p></div>'
        : '') +
      '<div class="card-links"><button class="linkbtn" id="addAbout">Add another memory about ' +
      (m.person ? esc(PEOPLE[m.person]) : 'this person') +
      '</button>' +
      (link && !banner ? '<button class="linkbtn" id="showLink">Your private link</button>' : '') +
      (canDelete('memories', m.rowId)
        ? '<button class="linkbtn danger" id="delMem">Delete this memory</button>'
        : online && m.rowId != null
          ? '<button class="linkbtn" id="askRemove">Ask us to remove this memory</button>'
          : '') +
      '</div><p class="err" id="delMemErr" hidden></p>' +
      (link
        ? '<div class="private-link" id="linkBox"' +
          (banner ? '' : ' hidden') +
          '><span class="mono">Your private link</span><p>Save or bookmark this link to delete your memory later, from any device. Anyone with this link can delete this memory, so keep it to yourself.</p><div class="copy-row"><input id="linkIn" readonly aria-label="Your private link" value="' +
          esc(link) +
          '"><button class="btn-line" id="linkCopy">Copy link</button></div><p class="hint">Lost it? You can still ask us to remove the memory.</p></div>'
        : '');
    $('stage').classList.add('open');
    card.scrollTop = 0;
    $('cardClose').addEventListener('click', closeMemory);
    $('readBtn').addEventListener('click', function () {
      openReader(m);
    });
    $('addAbout').addEventListener('click', function () {
      openAdd(m);
    });
    var dm = $('delMem');
    if (dm)
      dm.addEventListener('click', function () {
        deleteMemory(m, dm);
      });
    var ar = $('askRemove');
    if (ar)
      ar.addEventListener('click', function () {
        openRemoval(m);
      });
    var sl = $('showLink');
    if (sl)
      sl.addEventListener('click', function () {
        $('linkBox').hidden = !$('linkBox').hidden;
      });
    if ($('linkCopy'))
      $('linkCopy').addEventListener('click', function () {
        copyText($('linkIn'), this);
      });
    var sn = $('sibNext');
    if (sn)
      sn.addEventListener('click', function () {
        var i = sibs.indexOf(m);
        openMemory(sibs[(i + 1) % sibs.length].id);
      });
    card.querySelectorAll('[data-k]').forEach(function (b) {
      var k = b.getAttribute('data-k');
      b.addEventListener('mouseenter', function () {
        state.hlKey = k;
        still();
      });
      b.addEventListener('mouseleave', function () {
        state.hlKey = null;
        still();
      });
      b.addEventListener('click', function () {
        var on = state.lockKey === k;
        state.lockKey = on ? null : k;
        card.querySelectorAll('[data-k]').forEach(function (x) {
          x.setAttribute('aria-pressed', !on && x === b ? 'true' : 'false');
        });
        still();
      });
    });
    if (window.innerWidth < 832)
      state.timers.push(
        setTimeout(function () {
          card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        }, 60),
      );
    still();
  }
  function deleteMemory(m, btn) {
    if (!confirm('Delete this memory from the archive for everyone? This can’t be undone.')) return;
    btn.disabled = true;
    removeRow('memories', m.rowId).then(
      function () {
        if (m.media) removeMedia(m.media.url);
        MEMORIES.splice(MEMORIES.indexOf(m), 1);
        closeMemory();
        layout();
        drawChips();
        fillFilters();
        drawList();
        drawDots();
      },
      function (e) {
        console.error(e);
        btn.disabled = false;
        $('delMemErr').textContent = 'This memory couldn’t be deleted. Try again.';
        $('delMemErr').hidden = false;
      },
    );
  }
  function closeMemory() {
    clearTimers();
    state.active = null;
    state.hlKey = null;
    state.lockKey = null;
    $('stage').classList.remove('open');
    still();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.active != null && !$('readDlg').open && !$('addDlg').open)
      closeMemory();
  });

  function openReader(m) {
    $('readIn').innerHTML =
      '<span class="mono" id="readMeta">' +
      esc(yr(m)) +
      ' · ' +
      esc(m.hood) +
      '</span>' +
      (m.kind ? '<span class="kind-tag">' + esc(m.kind) + '</span>' : '') +
      '<blockquote>“' +
      esc(m.text) +
      '”</blockquote>' +
      mediaBlock(m) +
      '<p class="by">' +
      esc(m.by) +
      ' · from someone living with Alzheimer’s and their family</p>' +
      '<p class="pieces">' +
      m.frags
        .map(function (f) {
          return esc(plain(f[1]));
        })
        .join(' · ') +
      '</p>' +
      (siblings(m).length > 1
        ? '<div class="sibs"><span>Also about ' +
          esc(PEOPLE[m.person]) +
          ':</span>' +
          siblings(m)
            .filter(function (x) {
              return x !== m;
            })
            .map(function (x) {
              return (
                '<button data-sib="' + x.id + '">' + esc(yr(x)) + ' · ' + esc(x.hood) + '</button>'
              );
            })
            .join('') +
          '</div>'
        : '') +
      '<button class="back" id="readBack">Back to the archive</button>';
    var d = $('readDlg');
    try {
      d.showModal();
    } catch (e) {
      d.setAttribute('open', '');
    }
    $('readBack').addEventListener('click', function () {
      d.close();
    });
    $('readIn')
      .querySelectorAll('[data-sib]')
      .forEach(function (b) {
        b.addEventListener('click', function () {
          var id = +b.getAttribute('data-sib');
          openMemory(id);
          openReader(byId(id));
        });
      });
    $('readBack').focus();
  }
  function drawChips() {
    var el = $('regionChips');
    el.innerHTML =
      '<span class="mono lbl">Light up</span>' +
      REGIONS.map(function (r) {
        return (
          '<button class="fchip" data-r="' +
          r.id +
          '" aria-pressed="' +
          (state.region === r.id) +
          '">' +
          esc(r.name) +
          '<span class="n">' +
          regionCount(r.id) +
          '</span></button>'
        );
      }).join('');
    el.querySelectorAll('[data-r]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-r');
        setRegion(state.region === id ? null : id);
      });
    });
  }
  function setRegion(id) {
    if (state.active != null) closeMemory();
    state.region = id;
    drawChips();
    drawList();
    if (id) {
      nodes.forEach(function (n) {
        if (inTheme(n.m, id)) n.lit = 1;
      });
      $('stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    }
    still();
  }
  var all = { q: '', theme: '', decade: '', year: '', who: '', piece: '', kind: '', shown: 24 };
  function fillFilters() {
    var kinds = FEELINGS.slice();
    MEMORIES.forEach(function (m) {
      if (m.kind && kinds.indexOf(m.kind) === -1) kinds.push(m.kind);
    });
    $('fKind').innerHTML =
      '<option value="">Every kind of memory</option>' +
      kinds
        .map(function (k) {
          return '<option' + (all.kind === k ? ' selected' : '') + '>' + esc(k) + '</option>';
        })
        .join('') +
      '<option value="media"' +
      (all.kind === 'media' ? ' selected' : '') +
      '>With recordings, photos, or art</option>';
    $('fTheme').innerHTML =
      '<option value="">All themes</option>' +
      REGIONS.map(function (r) {
        return (
          '<option value="' +
          r.id +
          '"' +
          (all.theme === r.id ? ' selected' : '') +
          '>' +
          esc(r.name) +
          '</option>'
        );
      }).join('');
    drawDecades();
    $('fWho').innerHTML =
      '<option value="">Everyone</option>' +
      Object.keys(PEOPLE)
        .map(function (p) {
          return (
            '<option value="' +
            p +
            '"' +
            (all.who === p ? ' selected' : '') +
            '>Memories about ' +
            esc(PEOPLE[p]) +
            '</option>'
          );
        })
        .join('');
  }
  function drawDecades() {
    var ds = [],
      undated = 0;
    MEMORIES.forEach(function (m) {
      var d = decade(m);
      if (!d) undated++;
      else if (ds.indexOf(d) === -1) ds.push(d);
    });
    ds.sort();
    if (undated) ds.push('Undated');
    var cnt = function (d) {
      return MEMORIES.filter(function (m) {
        return (decade(m) || 'Undated') === d;
      }).length;
    };
    $('decTabs').innerHTML =
      '<span class="mono lbl">By decade</span><button class="fchip" data-dec="" aria-pressed="' +
      !all.decade +
      '">All</button>' +
      ds
        .map(function (d) {
          return (
            '<button class="fchip" data-dec="' +
            d +
            '" aria-pressed="' +
            (all.decade === d) +
            '">' +
            d +
            '<span class="n">' +
            cnt(d) +
            '</span></button>'
          );
        })
        .join('');
    $('decTabs')
      .querySelectorAll('[data-dec]')
      .forEach(function (b) {
        b.addEventListener('click', function () {
          all.decade = b.getAttribute('data-dec');
          all.year = '';
          all.shown = 24;
          drawDecades();
          drawList();
        });
      });
    var yt = $('yearTabs');
    if (!all.decade || all.decade === 'Undated') {
      yt.hidden = true;
      yt.innerHTML = '';
      return;
    }
    var ys = [];
    MEMORIES.forEach(function (m) {
      if (decade(m) === all.decade && ys.indexOf(m.year) === -1) ys.push(m.year);
    });
    ys.sort();
    yt.hidden = false;
    yt.innerHTML =
      '<span class="mono lbl">By year</span><button class="fchip" data-yr="" aria-pressed="' +
      !all.year +
      '">All of the ' +
      all.decade +
      '</button>' +
      ys
        .map(function (y) {
          return (
            '<button class="fchip" data-yr="' +
            y +
            '" aria-pressed="' +
            (String(all.year) === String(y)) +
            '">' +
            y +
            '</button>'
          );
        })
        .join('');
    yt.querySelectorAll('[data-yr]').forEach(function (b) {
      b.addEventListener('click', function () {
        all.year = b.getAttribute('data-yr');
        all.shown = 24;
        drawDecades();
        drawList();
      });
    });
  }
  function holds(m, piece) {
    return (
      m.frags.some(function (f) {
        if (piece === 'songs') return f[0] === 'Song' || f[2] === 'music';
        if (piece === 'movies') return f[0] === 'Movie' || f[2] === 'movies';
        if (piece === 'books') return f[0] === 'Book' || f[2] === 'books';
        if (piece === 'food') return f[0] === 'Food' || f[2] === 'recipes';
        return true;
      }) ||
      (piece === 'food' && inTheme(m, 'smell'))
    );
  }
  function drawList() {
    var ms = MEMORIES.filter(function (m) {
      if (all.theme && !inTheme(m, all.theme)) return false;
      if (all.decade && (decade(m) || 'Undated') !== all.decade) return false;
      if (all.year && String(m.year) !== all.year) return false;
      if (all.piece && !holds(m, all.piece)) return false;
      if (all.kind === 'media' && !m.media) return false;
      if (all.kind && all.kind !== 'media' && m.kind !== all.kind) return false;
      if (all.who && m.person !== all.who) return false;
      if (all.q) {
        var hay = (
          yr(m) +
          ' ' +
          m.hood +
          ' ' +
          m.text +
          ' ' +
          m.frags
            .map(function (f) {
              return f[1];
            })
            .join(' ') +
          ' ' +
          themeNames(m) +
          ' ' +
          (m.person ? PEOPLE[m.person] : '') +
          ' ' +
          (m.kind || '') +
          ' ' +
          (m.media ? MEDIA_NAME[m.media.type] : '')
        ).toLowerCase();
        if (hay.indexOf(all.q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      return (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || (a.year || 9999) - (b.year || 9999);
    });
    $('allCount').textContent =
      ms.length === MEMORIES.length
        ? MEMORIES.length + ' memories'
        : ms.length + ' of ' + MEMORIES.length + ' memories';
    $('allGrid').innerHTML = ms.length
      ? ms
          .slice(0, all.shown)
          .map(function (m) {
            var f = m.frags[0];
            return (
              '<button class="mcard" data-id="' +
              m.id +
              '"><span class="mono">' +
              esc(yr(m)) +
              ' \u00b7 ' +
              esc(m.hood) +
              '</span><span class="first">' +
              esc(f ? f[1] : '') +
              '</span><span class="tags">' +
              themesOf(m)
                .map(function (id) {
                  return '<span class="tag">' + esc((REG[id] || REG.family).name) + '</span>';
                })
                .join('') +
              (m.person ? '<span class="tag who">' + esc(PEOPLE[m.person]) + '</span>' : '') +
              (m.kind ? '<span class="tag">' + esc(m.kind) + '</span>' : '') +
              (m.media
                ? '<span class="tag">' +
                  mediaIcon(m.media.type) +
                  ' ' +
                  esc(MEDIA_NAME[m.media.type]) +
                  '</span>'
                : '') +
              '</span></button>'
            );
          })
          .join('')
      : '<p class="count">' +
        (MEMORIES.length
          ? 'Nothing matches. Try another word or clear a filter.'
          : 'No memories yet. Be the first to add one.') +
        '</p>';
    $('allMoreWrap').hidden = ms.length <= all.shown;
    $('allGrid')
      .querySelectorAll('[data-id]')
      .forEach(function (b) {
        b.addEventListener('click', function () {
          $('stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          var id = +b.getAttribute('data-id');
          setTimeout(
            function () {
              openMemory(id);
            },
            reduce ? 0 : 450,
          );
        });
      });
  }
  $('q').addEventListener('input', function () {
    all.q = this.value.trim().toLowerCase();
    all.shown = 24;
    drawList();
  });
  $('fTheme').addEventListener('change', function () {
    all.theme = this.value;
    all.shown = 24;
    drawList();
  });
  $('fPiece').addEventListener('change', function () {
    all.piece = this.value;
    all.shown = 24;
    drawList();
  });
  $('fKind').addEventListener('change', function () {
    all.kind = this.value;
    all.shown = 24;
    drawList();
  });
  $('fWho').addEventListener('change', function () {
    all.who = this.value;
    all.shown = 24;
    drawList();
  });
  $('allMore').addEventListener('click', function () {
    all.shown += 24;
    drawList();
  });
  $('fireRandom').addEventListener('click', function () {
    if (!MEMORIES.length) {
      openAdd(null);
      return;
    }
    var pool = MEMORIES.filter(function (m) {
      return m.id !== state.active && (!state.region || inTheme(m, state.region));
    });
    if (!pool.length) pool = MEMORIES;
    $('stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    openMemory(pool[Math.floor(Math.random() * pool.length)].id);
  });
  function drawDots() {
    $('dots').innerHTML = '';
    $('worldDots').innerHTML = '';
    var away = 0;
    MEMORIES.forEach(function (m) {
      var b = document.createElement('button');
      b.className = 'dot';
      if (m.world) {
        away++;
        b.style.left = ((m.world[0] + 180) / 360) * 100 + '%';
        b.style.top = ((80 - m.world[1]) / 140) * 100 + '%';
      } else {
        b.style.left = (m.xy[0] / 600) * 100 + '%';
        b.style.top = (m.xy[1] / 800) * 100 + '%';
      }
      b.setAttribute('aria-label', 'Open the memory from ' + m.hood + ', ' + yr(m));
      b.title = yr(m) + ' · ' + m.hood;
      b.innerHTML = '<span class="core"></span>';
      b.addEventListener('click', function () {
        $('stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        setTimeout(
          function () {
            openMemory(m.id);
          },
          reduce ? 0 : 500,
        );
      });
      (m.world ? $('worldDots') : $('dots')).appendChild(b);
    });
    $('trips').innerHTML = MEMORIES.filter(function (m) {
      return m.world;
    })
      .map(function (m) {
        var x = m.world[0] + 180,
          y = 80 - m.world[1];
        var cx = (62.84 + x) / 2,
          cy = Math.min(47.28, y) - Math.abs(x - 62.84) * 0.18 - 4;
        return (
          '<path d="M62.84 47.28 Q' +
          cx.toFixed(1) +
          ' ' +
          cy.toFixed(1) +
          ' ' +
          x.toFixed(1) +
          ' ' +
          y.toFixed(1) +
          '"/>'
        );
      })
      .join('');
    $('worldCaption').textContent =
      'Illustrative map, not to scale. ' +
      (away
        ? away + (away === 1 ? ' memory comes' : ' memories come') + ' from beyond San Diego.'
        : 'Memories from other cities and countries appear in the corner.');
    $('memCount').textContent = MEMORIES.length;
    $('heroCount').textContent = MEMORIES.length;
    $('heroLinks').textContent = links.length;
    $('stageHint').textContent = MEMORIES.length
      ? 'Choose a bright cell to open its memory.'
      : 'The archive is just getting started. Add the first memory.';
  }
  function options(list) {
    return list
      .map(function (v) {
        return '<option value="' + esc(v) + '"></option>';
      })
      .join('');
  }
  $('placeList').innerHTML = options(
    Object.keys(PLACES).filter(function (h) {
      return h !== 'Somewhere else in San Diego';
    }),
  );
  $('feelList').innerHTML = options(FEELINGS);

  var pickedThemes = [];
  function drawThemePick() {
    $('fThemes').innerHTML = REGIONS.map(function (r) {
      return (
        '<button type="button" class="fchip" data-t="' +
        r.id +
        '" aria-pressed="' +
        (pickedThemes.indexOf(r.id) !== -1) +
        '">' +
        esc(r.name) +
        '</button>'
      );
    }).join('');
  }
  $('fThemes').addEventListener('click', function (e) {
    var b = e.target.closest('[data-t]');
    if (!b) return;
    var id = b.getAttribute('data-t'),
      at = pickedThemes.indexOf(id);
    if (at === -1) pickedThemes.push(id);
    else pickedThemes.splice(at, 1);
    drawThemePick();
    listen();
  });
  drawThemePick();

  function inSanDiego(lng, lat) {
    return lng >= SD_BOX[0] && lng <= SD_BOX[2] && lat >= SD_BOX[1] && lat <= SD_BOX[3];
  }
  function placeName(hit, local) {
    var a = hit.address || {};
    var name = hit.display_name.split(',')[0];
    if (local) return name;
    var city = a.city || a.town || a.village || a.county || a.state || name;
    return a.country ? city + ', ' + a.country : city;
  }
  function geocode(text, bounded) {
    var url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&accept-language=en' +
      (bounded ? '&bounded=1&viewbox=' + SD_BOX.join(',') : '') +
      '&q=' +
      encodeURIComponent(text);
    return fetch(url).then(function (r) {
      return r.json();
    });
  }

  var placeFound = null;
  var placeLookup = null;
  var placeTimer = null;
  function findPlace() {
    placeTimer = null;
    var text = $('fPlace').value.trim();
    var note = $('fPlaceNote');
    placeFound = null;
    if (!text) {
      note.textContent = '';
      return (placeLookup = Promise.resolve());
    }
    var known = Object.keys(PLACES).filter(function (h) {
      return h.toLowerCase() === text.toLowerCase();
    })[0];
    if (known) {
      placeFound = { name: known, xy: PLACES[known] };
      note.textContent = 'On the San Diego map at ' + known + '.';
      return (placeLookup = Promise.resolve());
    }
    note.textContent = 'Looking for it…';
    placeLookup = Promise.all([geocode(text, true), geocode(text, false)])
      .then(function (both) {
        var near = both[0][0],
          far = both[1][0];
        // a street that happens to share a city's name shouldn't win over the city
        if (near && (near['class'] !== 'highway' || !far)) return [near];
        return far ? [far] : [];
      })
      .then(function (res) {
        if (text !== $('fPlace').value.trim()) return;
        if (!res.length) {
          note.textContent =
            'We couldn’t find that on a map, so it will be pinned to San Diego as “' + text + '.”';
          return;
        }
        var lng = +res[0].lon,
          lat = +res[0].lat,
          local = inSanDiego(lng, lat);
        placeFound = { name: placeName(res[0], local), lng: lng, lat: lat };
        if (local) placeFound.xy = toMap(lng, lat);
        note.textContent =
          'Found it: ' +
          placeFound.name +
          (local ? ', on the San Diego map.' : ', on the world map.');
      })
      .catch(function () {
        note.textContent = 'We couldn’t look that up right now. It will be pinned to San Diego.';
      });
    return placeLookup;
  }
  $('fPlace').addEventListener('input', function () {
    clearTimeout(placeTimer);
    placeTimer = setTimeout(findPlace, 700);
  });

  function keysIn(text) {
    var out = [],
      low =
        ' ' +
        String(text)
          .toLowerCase()
          .replace(/[^a-z0-9\s']/g, ' ') +
        ' ';
    Object.keys(SYN).forEach(function (k) {
      var w = SYN[k];
      for (var i = 0; i < w.length; i++) {
        if (low.indexOf(' ' + w[i] + ' ') !== -1 || low.indexOf(' ' + w[i] + 's ') !== -1) {
          out.push(k);
          break;
        }
      }
    });
    return out;
  }
  function addText() {
    return ['fDetails', 'fWords']
      .map(function (id) {
        return $(id).value;
      })
      .join(' ');
  }
  function listen() {
    var ks = keysIn(addText()),
      el = $('listen');
    if (!el) return;
    if (pickedThemes.length && !ks.length) {
      el.innerHTML =
        '<span class="pulse" aria-hidden="true"></span><span>It will join <strong>' +
        pickedThemes
          .map(function (id) {
            return esc(REG[id].name.toUpperCase());
          })
          .join('</strong>, <strong>') +
        '</strong>.</span>';
      return;
    }
    if (!ks.length) {
      el.innerHTML =
        '<span class="pulse" aria-hidden="true"></span><span>As you write, we’ll show where your memory will live and what it connects to.</span>';
      return;
    }
    var joins = pickedThemes.length ? pickedThemes : [KEY_REGION[ks[0]] || 'family'];
    el.innerHTML =
      '<span class="pulse" aria-hidden="true"></span><span>It will join <strong>' +
      joins
        .map(function (id) {
          return esc(REG[id].name.toUpperCase());
        })
        .join('</strong>, <strong>') +
      '</strong> and connect through ' +
      ks
        .slice(0, 3)
        .map(function (k) {
          return (
            '<strong>' +
            esc(keyName(k).toUpperCase()) +
            '</strong> (' +
            sharing(k, -1).filter(function (m) {
              return !m.mine;
            }).length +
            ')'
          );
        })
        .join(', ') +
      '.</span>';
  }
  ['fDetails', 'fWords'].forEach(function (id) {
    $(id).addEventListener('input', listen);
  });
  function mediaTypeOf(f) {
    return !f
      ? null
      : /^audio/.test(f.type)
        ? 'audio'
        : /^video/.test(f.type)
          ? 'video'
          : /^image/.test(f.type)
            ? 'photo'
            : null;
  }
  $('fMedia').addEventListener('change', function () {
    var f = this.files && this.files[0],
      t = mediaTypeOf(f),
      pv = $('fMediaPrev');
    if (!f) {
      pv.innerHTML = '';
      return;
    }
    if (!t) {
      pv.innerHTML =
        '<p class="err">That file type isn\u2019t supported. Try an audio, video, or image file.</p>';
      this.value = '';
      return;
    }
    pv.innerHTML = '<p class="hint">' + mediaIcon(t) + ' ' + esc(f.name) + ' is attached.</p>';
  });
  var addFor = null;
  function personFor(m) {
    return m && m.person ? PEOPLE[m.person] : '';
  }
  function openAdd(forMem) {
    addFor = forMem || null;
    $('peopleList').innerHTML = options(
      Object.keys(PEOPLE).map(function (p) {
        return PEOPLE[p];
      }),
    );
    $('fPersonName').value = personFor(addFor);
    $('fErr').hidden = true;
    try {
      $('addDlg').showModal();
    } catch (e) {
      $('addDlg').setAttribute('open', '');
    }
  }
  $('addTop').addEventListener('click', function () {
    openAdd(null);
  });
  $('addClose').addEventListener('click', function () {
    $('addDlg').close();
  });
  $('addDlg').addEventListener('click', function (e) {
    if (e.target === this) this.close();
  });
  $('addForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (placeTimer) {
      clearTimeout(placeTimer);
      findPlace();
    }
    Promise.resolve(placeLookup).then(addMemory);
  });
  function addMemory() {
    var err = $('fErr');
    err.hidden = true;
    var y = $('fYear').value.trim();
    var words = $('fWords').value.trim();
    var details = $('fDetails')
      .value.split(',')
      .map(function (d) {
        return d.trim();
      })
      .filter(Boolean);
    var file = $('fMedia').files && $('fMedia').files[0],
      mType = mediaTypeOf(file);
    var kind = $('fFeel').value.trim();
    if (kind) kind = kind.charAt(0).toUpperCase() + kind.slice(1);
    if (y && !(/^\d{4}$/.test(y) && +y >= 1900 && +y <= 2026)) {
      err.textContent = 'Enter a four-digit year between 1900 and 2026, or leave it blank.';
      err.hidden = false;
      return;
    }
    if (!words && !details.length && !mType) {
      err.textContent = 'Write the memory, add a detail, or attach a recording or picture.';
      err.hidden = false;
      return;
    }
    if (!$('fConsent').checked) {
      err.textContent = 'Check the permission box so we know this memory can be shared.';
      err.hidden = false;
      return;
    }
    var frags = details.slice(0, 6).map(function (d) {
      return ['Detail', d, keysIn(d)[0] || null];
    });
    var all = keysIn(addText());
    if (!frags.length && words)
      frags.push(['Detail', words.length > 60 ? words.slice(0, 57) + '…' : words, all[0] || null]);
    if (!frags.length) frags.push(['Detail', 'A ' + MEDIA_NAME[mType].toLowerCase(), null]);
    var guessed =
      KEY_REGION[
        (frags.filter(function (f) {
          return f[2];
        })[0] || [])[2] || all[0]
      ] || 'family';
    var themes = pickedThemes.length ? pickedThemes.slice() : [guessed];
    var placeText = $('fPlace').value.trim();
    var hood, base, world;
    if (placeFound && !placeFound.xy) {
      hood = placeFound.name;
      world = [placeFound.lng, placeFound.lat];
    } else if (placeFound) {
      hood = placeFound.name;
      base = placeFound.xy;
    } else {
      hood = placeText || 'Somewhere in San Diego';
      base = PLACES['Somewhere else in San Diego'];
    }
    var jit = function () {
      return Math.random() * 16 - 8;
    };
    MEMORIES.forEach(function (m) {
      m.fresh = false;
    });
    var mem = {
      id: ++memSeq,
      year: y ? +y : null,
      hood: hood,
      region: themes[0],
      themes: themes,
      xy: base ? [base[0] + jit(), base[1] + jit()] : null,
      by: byLine($('fBy').value),
      frags: frags,
      text:
        words ||
        frags
          .map(function (f) {
            return plain(f[1]);
          })
          .join('. ') + '.',
      mine: true,
      fresh: true,
    };
    if (world) mem.world = world;
    if (kind) mem.kind = kind;
    if (mType)
      mem.media = { type: mType, label: file.name, dur: '', url: URL.createObjectURL(file) };
    var name = $('fPersonName').value.trim().slice(0, 30);
    var existing = Object.keys(PEOPLE).filter(function (p) {
      return PEOPLE[p].toLowerCase() === name.toLowerCase();
    })[0];
    if (existing) mem.person = existing;
    else if (name || (addFor && !addFor.person)) {
      var pid = 'p' + Date.now();
      PEOPLE[pid] = name || 'Someone remembered';
      mem.person = pid;
      if (addFor && !addFor.person) addFor.person = pid;
    }
    if (mem.person) mem.personName = PEOPLE[mem.person];
    busy($('addForm'), 'Saving…');
    saveMemory(mem, mType && file).then(
      function () {
        busy($('addForm'));
        showAdded(mem);
      },
      function (e) {
        console.error(e);
        busy($('addForm'));
        err.textContent = 'Your memory couldn’t be saved. Check your connection and try again.';
        err.hidden = false;
      },
    );
  }
  function showAdded(mem) {
    MEMORIES.push(mem);
    $('addForm').reset();
    $('fMediaPrev').innerHTML = '';
    $('fPlaceNote').textContent = '';
    placeFound = null;
    placeLookup = null;
    pickedThemes = [];
    drawThemePick();
    listen();
    $('addDlg').close();
    if (state.active != null) closeMemory();
    layout();
    drawChips();
    fillFilters();
    drawList();
    drawDots();
    $('stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(
      function () {
        openMemory(mem.id, true);
      },
      reduce ? 0 : 900,
    );
  }
  var QUESTIONS = [{ month: 'October 2026', q: 'What’s a memory worth keeping?', answers: [] }];
  var qm = { i: 0, sel: -1 };
  function qmBuildStars() {
    var sky = $('sky'),
      r = rng(911);
    for (var i = 0; i < 34; i++) {
      var d = document.createElement('span');
      d.className = 'bgstar' + (r() < 0.3 ? ' gold' : '');
      d.style.left = r() * 100 + '%';
      d.style.top = r() * 100 + '%';
      d.style.animationDelay = -r() * 4 + 's';
      if (r() < 0.4) {
        d.style.width = d.style.height = '2px';
      }
      sky.insertBefore(d, sky.firstChild);
    }
  }
  function qmRender() {
    var Q = QUESTIONS[qm.i];
    $('qmMonths').hidden = QUESTIONS.length < 2;
    $('qmMonths').innerHTML = QUESTIONS.map(function (x, i) {
      return (
        '<button class="fchip" data-qm="' +
        i +
        '" aria-pressed="' +
        (i === qm.i) +
        '">' +
        esc(x.month) +
        '</button>'
      );
    }).join('');
    $('qmMonths')
      .querySelectorAll('[data-qm]')
      .forEach(function (b) {
        b.addEventListener('click', function () {
          qm.i = +b.getAttribute('data-qm');
          qm.sel = -1;
          qmRender();
        });
      });
    $('skyQ').innerHTML =
      '<span class="mono">' +
      esc(Q.month) +
      (qm.i === 0 ? ' · This month' : '') +
      '</span><h3>' +
      esc(Q.q) +
      '</h3><button class="add-btn" id="qmAnswer">Answer this question</button>';
    $('qmAnswer').addEventListener('click', openAnswer);
    var n = Q.answers.length,
      shown = n > 12 ? 11 : n,
      total = shown + (n > 12 ? 1 : 0),
      html = '';
    function slot(k) {
      var t = ((-90 + (k * 360) / total) * Math.PI) / 180;
      return [50 + 40 * Math.cos(t), 50 + 43 * Math.sin(t)];
    }
    for (var j = 0; j < shown; j++) {
      var sl = slot(j),
        a = Q.answers[j];
      html +=
        '<button class="bubble' +
        (a.mine ? ' mine' : '') +
        (qm.sel === j ? ' on' : '') +
        '" data-b="' +
        j +
        '" style="left:' +
        sl[0].toFixed(2) +
        '%;top:' +
        sl[1].toFixed(2) +
        '%;animation-delay:' +
        (0.25 + j * 0.06).toFixed(2) +
        's">' +
        esc(a.s) +
        '</button>';
    }
    if (n > 12) {
      var sl2 = slot(shown);
      html +=
        '<button class="bubble more" data-b="more" style="left:' +
        sl2[0].toFixed(2) +
        '%;top:' +
        sl2[1].toFixed(2) +
        '%">+' +
        (n - 11) +
        ' more answers</button>';
    }
    $('skyBubbles').innerHTML = html;
    $('skyBubbles')
      .querySelectorAll('[data-b]')
      .forEach(function (b) {
        var v = b.getAttribute('data-b');
        b.addEventListener('click', function () {
          qmSelect(v === 'more' ? 'more' : +v);
        });
        b.addEventListener('mouseenter', function () {
          qmHover(v, true);
        });
        b.addEventListener('mouseleave', function () {
          qmHover(v, false);
        });
      });
    qmDetail();
    requestAnimationFrame(function () {
      qmLines(true);
    });
  }
  function qmHover(v, on) {
    var p = $('skyLines').querySelector('.petal[data-p="' + v + '"]');
    if (p) p.classList.toggle('hov', on);
  }
  function qmLines(grow) {
    var svg = $('skyLines'),
      sky = $('sky');
    if (window.matchMedia('(max-width: 51rem)').matches) {
      svg.innerHTML = '';
      return;
    }
    var box = sky.getBoundingClientRect();
    if (!box.width) return;
    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    var els = [].slice.call($('skyBubbles').querySelectorAll('.bubble'));
    var blank = !els.length,
      n = blank ? 8 : els.length,
      cx = box.width / 2,
      cy = box.height / 2;
    var R = box.height / 2 - 64,
      hw = Math.min(R * Math.sin(Math.PI / n) * 0.95, R * 0.42);
    var out =
      '<defs>' +
      '<radialGradient id="petalFill" gradientUnits="userSpaceOnUse" cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="' +
      R +
      '"><stop offset=".45" stop-color="#EDE4F8"/><stop offset="1" stop-color="#DCCDF1"/></radialGradient>' +
      '<radialGradient id="petalHov" gradientUnits="userSpaceOnUse" cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="' +
      R +
      '"><stop offset=".45" stop-color="#E2D5F5"/><stop offset="1" stop-color="#C9B3EC"/></radialGradient>' +
      '<radialGradient id="petalOn" gradientUnits="userSpaceOnUse" cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="' +
      R +
      '"><stop offset=".45" stop-color="#D3C0F0"/><stop offset="1" stop-color="#A988DE"/></radialGradient>' +
      '</defs>';
    function f(v) {
      return v.toFixed(1);
    }
    (blank ? [null, null, null, null, null, null, null, null] : els).forEach(function (el, i) {
      var t = ((-90 + (i * 360) / n) * Math.PI) / 180,
        ux = Math.cos(t),
        uy = Math.sin(t),
        nx = -uy,
        ny = ux;
      function pt(a, o) {
        return f(cx + ux * R * a + nx * o) + ' ' + f(cy + uy * R * a + ny * o);
      }
      var v = el ? el.getAttribute('data-b') : '',
        on = el && String(qm.sel) === v;
      if (grow && el) {
        el.classList.remove('grow');
        void el.offsetWidth;
        el.classList.add('grow');
      }
      var g = grow
        ? ' grow" style="transform-origin:' +
          f(cx) +
          'px ' +
          f(cy) +
          'px;animation-delay:' +
          (i * 0.06).toFixed(2) +
          's'
        : '';
      out +=
        '<g class="petal' +
        (on ? ' on' : '') +
        (blank ? ' blank' : '') +
        g +
        '" data-p="' +
        v +
        '"><path d="M' +
        pt(0, 0) +
        ' C' +
        pt(0.25, hw * 0.7) +
        ' ' +
        pt(0.45, hw) +
        ' ' +
        pt(0.68, hw) +
        ' C' +
        pt(0.9, hw) +
        ' ' +
        pt(1, hw * 0.5) +
        ' ' +
        pt(1, 0) +
        ' C' +
        pt(1, -hw * 0.5) +
        ' ' +
        pt(0.9, -hw) +
        ' ' +
        pt(0.68, -hw) +
        ' C' +
        pt(0.45, -hw) +
        ' ' +
        pt(0.25, -hw * 0.7) +
        ' ' +
        pt(0, 0) +
        'Z"/>' +
        '<path class="vein" d="M' +
        pt(0.4, 0) +
        ' L' +
        pt(0.88, 0) +
        '"/></g>';
    });
    svg.innerHTML = out;
  }
  function qmSelect(j) {
    qm.sel = j;
    $('skyBubbles')
      .querySelectorAll('[data-b]')
      .forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-b') === String(j));
      });
    qmDetail();
    qmLines(false);
  }
  function qmDetail() {
    var Q = QUESTIONS[qm.i],
      el = $('qmDetail');
    if (qm.sel === 'more') {
      el.innerHTML =
        '<span class="mono">More answers · ' +
        esc(Q.month) +
        '</span><ul>' +
        Q.answers
          .slice(11)
          .map(function (a) {
            return '<li>' + esc(a.s) + '</li>';
          })
          .join('') +
        '</ul>';
      return;
    }
    var a = Q.answers[qm.sel];
    if (!a) {
      el.innerHTML = Q.answers.length
        ? '<span class="mono">' +
          Q.answers.length +
          (Q.answers.length === 1 ? ' answer' : ' answers') +
          ' so far</span><p>Choose any petal above to read the whole answer.</p>'
        : '<span class="mono">No answers yet</span><p>Be the first to answer this month’s question.</p>';
      return;
    }
    el.innerHTML =
      '<span class="mono">' +
      esc(Q.month) +
      ' · ' +
      esc(a.by) +
      '</span><blockquote>' +
      esc(a.full) +
      '</blockquote>' +
      (a.mem ? '<button class="linkbtn" id="qmMem">See this memory in the archive</button>' : '') +
      (canDelete('answers', a.rowId)
        ? '<button class="linkbtn danger" id="qmDel">Delete this answer</button><p class="err" id="qmDelErr" hidden></p>'
        : '');
    var del = $('qmDel');
    if (del)
      del.addEventListener('click', function () {
        if (!confirm('Delete this answer for everyone? This can’t be undone.')) return;
        del.disabled = true;
        removeRow('answers', a.rowId).then(
          function () {
            Q.answers.splice(Q.answers.indexOf(a), 1);
            qm.sel = -1;
            qmRender();
          },
          function (e) {
            console.error(e);
            del.disabled = false;
            $('qmDelErr').textContent = 'This answer couldn’t be deleted. Try again.';
            $('qmDelErr').hidden = false;
          },
        );
      });
    var b = $('qmMem');
    if (b)
      b.addEventListener('click', function () {
        $('qmDlg').close();
        $('stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        setTimeout(
          function () {
            openMemory(a.mem);
          },
          reduce ? 0 : 450,
        );
      });
  }
  function openAnswer() {
    $('ansQ').textContent = QUESTIONS[qm.i].q;
    $('aErr').hidden = true;
    try {
      $('ansDlg').showModal();
    } catch (e) {
      $('ansDlg').setAttribute('open', '');
    }
  }
  $('ansClose').addEventListener('click', function () {
    $('ansDlg').close();
  });
  $('ansDlg').addEventListener('click', function (e) {
    if (e.target === this) this.close();
  });
  $('ansForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var sh = $('aShort').value.trim(),
      full = $('aFull').value.trim(),
      err = $('aErr');
    if (!sh) {
      err.textContent = 'Write your answer in a few words first.';
      err.hidden = false;
      return;
    }
    if (!$('aConsent').checked) {
      err.textContent = 'Check the permission box so we know this answer can be shared.';
      err.hidden = false;
      return;
    }
    var rel = $('aBy').value,
      Q = QUESTIONS[qm.i],
      a = {
        s: sh,
        full: full || sh,
        by: byLine(rel),
        mine: true,
      };
    busy($('ansForm'), 'Saving…');
    saveAnswer(Q.q, a).then(
      function () {
        busy($('ansForm'));
        Q.answers.unshift(a);
        $('ansForm').reset();
        $('ansDlg').close();
        qm.sel = 0;
        qmRender();
      },
      function (e) {
        console.error(e);
        busy($('ansForm'));
        err.textContent = 'Your answer couldn’t be saved. Check your connection and try again.';
        err.hidden = false;
      },
    );
  });
  $('qmOpen').addEventListener('click', function () {
    try {
      $('qmDlg').showModal();
    } catch (e) {
      $('qmDlg').setAttribute('open', '');
    }
    requestAnimationFrame(function () {
      qmLines(true);
    });
  });
  $('skyLines').addEventListener('click', function (e) {
    var p = e.target.closest('.petal');
    if (p) {
      var v = p.getAttribute('data-p');
      qmSelect(v === 'more' ? 'more' : +v);
    }
  });
  $('qmClose').addEventListener('click', function () {
    $('qmDlg').close();
  });
  $('qmDlg').addEventListener('click', function (e) {
    if (e.target === this) this.close();
  });
  var qrt;
  window.addEventListener('resize', function () {
    clearTimeout(qrt);
    qrt = setTimeout(function () {
      qmLines(false);
    }, 120);
  });
  // Loads everything on first call, then only rows newer than what this tab has seen.
  var lastId = { memories: 0, answers: 0 };
  var pulling = false;
  function pullArchive() {
    if (!online || pulling || saving) return Promise.resolve();
    pulling = true;
    return Promise.all([
      dbFetch('/rest/v1/memories?select=id,data&order=id.asc&id=gt.' + lastId.memories),
      dbFetch('/rest/v1/answers?select=id,question,data&order=id.asc&id=gt.' + lastId.answers),
    ])
      .then(function (res) {
        return Promise.all([res[0].json(), res[1].json()]);
      })
      .then(function (rows) {
        var newMems = 0,
          newAns = 0;
        rows[0].forEach(function (row) {
          lastId.memories = row.id;
          if (savedHere.memories[row.id]) return;
          var m = row.data;
          m.id = ++memSeq;
          m.rowId = row.id;
          if (!m.xy && !m.world) m.xy = PLACES[m.hood] || null;
          if (m.person && !PEOPLE[m.person])
            PEOPLE[m.person] = m.personName || 'Someone remembered';
          MEMORIES.push(m);
          newMems++;
        });
        rows[1].forEach(function (row) {
          lastId.answers = row.id;
          if (savedHere.answers[row.id]) return;
          var qi = QUESTIONS.map(function (q) {
            return q.q;
          }).indexOf(row.question);
          if (qi < 0) return;
          row.data.rowId = row.id;
          QUESTIONS[qi].answers.unshift(row.data);
          if (qi === qm.i && qm.sel >= 0) qm.sel++;
          newAns++;
        });
        if (newMems) {
          layout();
          drawChips();
          fillFilters();
          drawList();
          drawDots();
        }
        if (newAns) qmRender();
      })
      .catch(function (e) {
        console.error('Could not load the archive', e);
      })
      .then(function () {
        pulling = false;
      });
  }
  // Live updates: check for new memories and answers while the page is open.
  setInterval(function () {
    if (!document.hidden) pullArchive();
  }, 15000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) pullArchive();
  });
  buildDust();
  layout();
  drawChips();
  fillFilters();
  drawList();
  drawDots();
  qmBuildStars();
  qmRender();
  // A private link (#manage=<row id>.<key>) hands this browser the key, then opens that memory.
  var manage = /^#manage=(\d+)\.([0-9a-f]+)$/.exec(location.hash);
  if (manage) {
    keepKey('memories', +manage[1], manage[2]);
    history.replaceState(null, '', location.pathname + location.search);
  }
  pullArchive().then(function () {
    if (!manage) return;
    var m = MEMORIES.filter(function (x) {
      return x.rowId === +manage[1];
    })[0];
    if (!m) {
      alert('That memory isn’t in the archive anymore.');
      return;
    }
    $('stage').scrollIntoView({ block: 'start' });
    openMemory(m.id);
  });
  checkAdmin();

  // Removal requests, for people who no longer have their private link.
  var removalFor = null;
  function openRemoval(m) {
    removalFor = m || null;
    $('rWhich').textContent = m
      ? 'Memory #' + m.rowId + ': ' + m.hood + ', ' + yr(m) + ' · “' + excerpt(m.text) + '”'
      : 'Tell us which memory below.';
    $('rErr').hidden = true;
    $('rDone').hidden = true;
    $('removeForm').hidden = false;
    try {
      $('removeDlg').showModal();
    } catch (e) {
      $('removeDlg').setAttribute('open', '');
    }
  }
  $('askRemoveAbout').addEventListener('click', function () {
    openRemoval(null);
  });
  $('removeClose').addEventListener('click', function () {
    $('removeDlg').close();
  });
  $('removeDlg').addEventListener('click', function (e) {
    if (e.target === this) this.close();
  });
  $('removeForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('rErr'),
      details = $('rDetails').value.trim(),
      contact = $('rContact').value.trim();
    err.hidden = true;
    if (!details || !contact) {
      err.textContent = 'Fill in both boxes so we can find the memory and check with you.';
      err.hidden = false;
      return;
    }
    if (!online) {
      err.textContent = 'The archive isn’t connected right now. Email us instead.';
      err.hidden = false;
      return;
    }
    busy($('removeForm'), 'Sending…');
    dbFetch('/rest/v1/removal_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        memory_id: removalFor ? removalFor.rowId : null,
        details: details.slice(0, 4000),
        contact: contact.slice(0, 200),
      }),
    }).then(
      function () {
        busy($('removeForm'));
        $('removeForm').reset();
        $('removeForm').hidden = true;
        $('rDone').hidden = false;
      },
      function (e) {
        console.error(e);
        busy($('removeForm'));
        err.textContent = 'Your request couldn’t be sent. Try again, or email us.';
        err.hidden = false;
      },
    );
  });

  // For admins: the list of removal requests waiting to be checked.
  function loadRequests() {
    var list = $('reqList');
    list.innerHTML = '<p class="hint">Loading…</p>';
    asAdmin('/rest/v1/removal_requests?select=*&order=created_at.asc')
      .then(function (r) {
        return r.json();
      })
      .then(function (rows) {
        if (!rows.length) {
          list.innerHTML = '<p>No removal requests right now.</p>';
          return;
        }
        list.innerHTML = rows
          .map(function (q) {
            var m = MEMORIES.filter(function (x) {
              return x.rowId === q.memory_id;
            })[0];
            return (
              '<div class="req" data-req="' +
              q.id +
              '"><span class="mono">' +
              esc(new Date(q.created_at).toLocaleString()) +
              ' · ' +
              (q.memory_id == null
                ? 'Memory not named'
                : m
                  ? 'Memory #' + q.memory_id + ': ' + esc(m.hood) + ', ' + esc(yr(m))
                  : 'Memory #' + q.memory_id + ' (already gone)') +
              '</span><p>' +
              esc(q.details) +
              '</p><p class="contact">Contact: ' +
              esc(q.contact) +
              '</p><div class="card-links">' +
              (m
                ? '<button class="linkbtn" data-open="' + m.id + '">Open the memory</button>'
                : '') +
              '<button class="linkbtn" data-done="' +
              q.id +
              '">Mark as handled</button></div></div>'
            );
          })
          .join('');
      })
      .catch(function (e) {
        console.error(e);
        list.innerHTML =
          '<p class="err">The requests couldn’t be loaded. Try signing in again.</p>';
      });
  }
  $('reqBtn').addEventListener('click', function () {
    try {
      $('reqDlg').showModal();
    } catch (e) {
      $('reqDlg').setAttribute('open', '');
    }
    loadRequests();
  });
  $('reqClose').addEventListener('click', function () {
    $('reqDlg').close();
  });
  $('reqDlg').addEventListener('click', function (e) {
    if (e.target === this) this.close();
  });
  $('reqList').addEventListener('click', function (e) {
    var open = e.target.closest('[data-open]'),
      done = e.target.closest('[data-done]');
    if (open) {
      $('reqDlg').close();
      $('stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      openMemory(+open.getAttribute('data-open'));
    }
    if (done) {
      done.disabled = true;
      asAdmin('/rest/v1/removal_requests?id=eq.' + done.getAttribute('data-done'), {
        method: 'DELETE',
      }).then(loadRequests, function (e) {
        console.error(e);
        done.disabled = false;
      });
    }
  });

  function openLogin() {
    $('loginErr').hidden = true;
    try {
      $('loginDlg').showModal();
    } catch (e) {
      $('loginDlg').setAttribute('open', '');
    }
  }
  $('adminBtn').addEventListener('click', function () {
    if (!admin) {
      openLogin();
      return;
    }
    var s = readSession();
    storeSession(null);
    setAdmin(null);
    if (s)
      dbFetch('/auth/v1/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + s.access },
      }).catch(function () {});
  });
  $('loginClose').addEventListener('click', function () {
    $('loginDlg').close();
  });
  $('loginDlg').addEventListener('click', function (e) {
    if (e.target === this) this.close();
  });
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('loginErr');
    err.hidden = true;
    if (!online) {
      err.textContent = 'The archive isn’t connected to its database yet.';
      err.hidden = false;
      return;
    }
    busy($('loginForm'), 'Signing in…');
    authToken('password', { email: $('lEmail').value.trim(), password: $('lPass').value })
      .then(checkAdmin)
      .then(
        function () {
          busy($('loginForm'));
          if (!admin) {
            err.textContent = 'That account isn’t an admin for this archive.';
            err.hidden = false;
            return;
          }
          $('loginForm').reset();
          $('loginDlg').close();
        },
        function (e) {
          console.error(e);
          busy($('loginForm'));
          err.textContent = 'That email and password didn’t work. Try again.';
          err.hidden = false;
        },
      );
  });
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      layout();
      draw(performance.now());
    }, 150);
  });
  draw(0);
  if (!reduce) requestAnimationFrame(frame);

  function countUp(el) {
    var text = el.textContent;
    var match = text.match(/[\d.,]+/);
    if (!match) return;
    var target = parseFloat(match[0].replace(/,/g, ''));
    var decimals = (match[0].split('.')[1] || '').length;
    var start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / 1400);
      var v = target * (1 - Math.pow(1 - p, 3));
      var shown = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
      el.textContent = text.replace(match[0], shown);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (!reduce && 'IntersectionObserver' in window) {
    var revealSel = [
      '.under',
      '.section .eyebrow',
      '.section .h2',
      '.section .lede',
      '.allbar',
      '.decades',
      '.where-map',
      '.fact',
      '.about > p',
      '.about > ul',
      'footer .wrap',
    ];
    var groups = {};
    document.querySelectorAll(revealSel.join(',')).forEach(function (el) {
      var parent = el.parentNode;
      var key =
        parent.dataset.revealId || (parent.dataset.revealId = String(Object.keys(groups).length));
      groups[key] = (groups[key] || 0) + 1;
      el.classList.add('reveal');
      el.style.setProperty('--delay', Math.min(groups[key] - 1, 6) * 90 + 'ms');
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          var big = e.target.querySelector('.big');
          if (big) countUp(big);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    document.querySelectorAll('.reveal').forEach(function (el) {
      io.observe(el);
    });
  }
})();
