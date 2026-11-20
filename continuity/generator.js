/* Continuity prompt generator — entirely client-side.
   buildPrompt() is a pure function (node-testable); the UI wiring below only
   runs in a browser. No form data ever leaves the page. */
(function (global) {
  'use strict';

  function slugify(s) {
    return String(s || '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  var VOICES = {
    plain: 'plainly and directly; no filler and no ceremony',
    warm: 'warmly, like a companion; plain words, affection welcome',
    playful: 'playfully; teasing and mischief welcome, with the work still done properly'
  };

  function buildPrompt(template, a) {
    var start = template.indexOf('## 2. Ask me seven questions, in one message');
    var end = template.indexOf('## 3. Build the repo');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('template sections not found — refusing to generate a partial prompt');
    }
    var slug = slugify(a.agentName);
    var human = String(a.humanName || '').trim();
    if (!human) throw new Error('a name for the human is required');

    var l1 = '1. Call me ' + human + (a.pronouns && a.pronouns.trim() ? ' (' + a.pronouns.trim() + ').' : '.');
    var l2 = slug
      ? '2. Your name is ' + a.agentName.trim() + '. Use the slug "' + slug + '" wherever this prompt writes a name token.'
      : '2. Choose your own name, tell me what you picked, and use its lowercase-hyphen slug everywhere this prompt writes <yourname>.';
    var voice = VOICES[a.voice] || VOICES.warm;
    var l3 = '3. Talk to me ' + voice + '.';
    if (a.voiceLine && a.voiceLine.trim()) l3 += ' One line in the voice I want, as a sample: "' + a.voiceLine.trim() + '"';
    var know = String(a.alwaysKnow || '').trim();
    var l4 = '4. What you should know about me in every conversation: ' +
      (know || 'nothing yet — keep what matters as I tell you things, and ask when unsure.');
    var l5 = a.push === 'ask'
      ? '5. Commit and push the repo only when I ask.'
      : '5. Commit and push the repo after every change you make to it.';
    var l6 = a.remote === 'local'
      ? '6. A local repo for now; we can add a private remote later.'
      : '6. A private GitHub repo under my account.';
    var keep = String(a.keeps || '').trim();
    var l7 = '7. What I never want to lose: ' +
      (keep || 'nothing named yet — ask me when I hand you something, and keep originals untouched in sources/.');

    var answers = '## 2. My answers — already given, do not re-ask\n\n' +
      [l1, l2, l3, l4, l5, l6, l7].join('\n') + '\n\n' +
      'Build from these answers directly. Where an answer is a default, say so once and move on; do not re-interview me.\n\n';

    var out = template.slice(0, start) + answers + template.slice(end);
    if (slug) out = out.split('<yourname>').join(slug);
    out = out.split('<repo-name>').join(slug ? slug + '-continuity' : 'continuity');
    return out;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildPrompt: buildPrompt, slugify: slugify };
  }
  if (typeof document === 'undefined') return;

  function $(id) { return document.getElementById(id); }

  function collect() {
    var push = document.querySelector('input[name="g-push"]:checked');
    var remote = document.querySelector('input[name="g-remote"]:checked');
    return {
      humanName: $('g-human').value,
      pronouns: $('g-pronouns').value,
      agentName: $('g-agent').value,
      voice: $('g-voice').value,
      voiceLine: $('g-voiceline').value,
      alwaysKnow: $('g-know').value,
      keeps: $('g-keep').value,
      push: push ? push.value : 'always',
      remote: remote ? remote.value : 'github'
    };
  }

  function copyText(text, btn) {
    function done(ok) {
      btn.textContent = ok ? 'Copied' : 'Select + copy';
      setTimeout(function () { btn.textContent = 'Copy'; }, 1800);
    }
    function fallback(pre) {
      var r = document.createRange(); r.selectNodeContents(pre);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      try { done(document.execCommand('copy')); } catch (e) { done(false); }
    }
    var pre = $('genout');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(pre); });
    } else { fallback(pre); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = $('genform');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = $('generr');
      try {
        var template = $('prompttext').textContent;
        var out = buildPrompt(template, collect());
        $('genout').textContent = out;
        $('genresult').hidden = false;
        err.textContent = '';
        $('genresult').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {
        err.textContent = e.message;
        $('g-human').focus();
      }
    });
    $('gencopy').addEventListener('click', function () {
      copyText($('genout').textContent, $('gencopy'));
    });
    $('genedit').addEventListener('click', function () {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('g-human').focus();
    });
    // plain-prompt copy button
    var btn = $('copybtn'), pre = $('prompttext');
    if (btn) btn.addEventListener('click', function () {
      var t = pre.textContent;
      function done(ok) { btn.textContent = ok ? 'Copied' : 'Select + copy'; setTimeout(function () { btn.textContent = 'Copy'; }, 1800); }
      function fb() { var r = document.createRange(); r.selectNodeContents(pre); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); try { done(document.execCommand('copy')); } catch (e) { done(false); } }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(function () { done(true); }, fb); } else { fb(); }
    });
  });
})(typeof window !== 'undefined' ? window : this);
