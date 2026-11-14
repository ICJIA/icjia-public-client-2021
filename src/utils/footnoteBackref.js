// markdown-it-footnote ends each footnote with a back-link whose only text is
// "↩︎", which NVDA reads as "right arrow curving left", the same for every
// footnote: a list of them says nothing about where each goes (WCAG 2.4.4).
// Each back-link now names its footnote: "Back to text, footnote 3"; a
// footnote cited more than once gets one per citation: "…, footnote 3,
// citation 2".
const nameFootnoteBackrefs = function (md) {
  const render = md.renderer.rules.footnote_anchor;
  md.renderer.rules.footnote_anchor = (tokens, idx, options, env, slf) => {
    const { id, subId } = tokens[idx].meta;
    const label =
      `Back to text, footnote ${id + 1}` +
      (subId > 0 ? `, citation ${subId + 1}` : "");
    return render(tokens, idx, options, env, slf).replace(
      'class="footnote-backref"',
      `class="footnote-backref" aria-label="${label}"`
    );
  };
  return md;
};

module.exports = { nameFootnoteBackrefs };
