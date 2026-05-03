/* global React, renderRuby */

const { useState, useEffect, useMemo, useRef } = React;

// 全タグを集計してカウント付きで返す
function collectTags(stories) {
  const counts = new Map();
  stories.forEach((s) => (s.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  // 出現順を保つ
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}

// 選択タグでフィルタ（OR検索：複数選択時は1つでも一致すれば表示）
function filterByTags(stories, selected) {
  if (!selected || selected.length === 0) return stories;
  return stories.filter((s) => (s.tags || []).some((t) => selected.includes(t)));
}

// =====================================================================
// 共通：タグフィルター（シンプルな由来セグメント）
// =====================================================================
function TagFilter({ tags, selected, setSelected, variant, night }) {
  // 単一選択（"" = ぜんぶ）
  const current = selected.length > 0 ? selected[0] : "";
  const set = (name) => setSelected(name ? [name] : []);
  return React.createElement(
    "div",
    { className: `tag-filter tag-filter-${variant} ${night ? "night" : ""}` },
    React.createElement("span", { className: "tag-filter-label" }, "おはなしの しゅるい"),
    React.createElement(
      "div",
      { className: "tag-segment" },
      React.createElement(
        "button",
        { className: "tag-chip" + (current === "" ? " active" : ""), onClick: () => set("") },
        "ぜんぶ"
      ),
      tags.map((t) =>
        React.createElement(
          "button",
          {
            key: t.name,
            className: "tag-chip" + (current === t.name ? " active" : ""),
            onClick: () => set(t.name)
          },
          t.name
        )
      )
    )
  );
}

// 本棚切り替えピル（ヘッダー右に表示）
function ShelfSwitcher({ value, onChange, night }) {
  if (!onChange) return null;
  return React.createElement(
    "div",
    { className: "eh-version-pill" + (night ? " night" : "") },
    React.createElement("span", { className: "label" }, "ほんだな"),
    React.createElement(
      "button",
      { className: value === "A" ? "active" : "", onClick: () => onChange("A") },
      React.createElement("span", { className: "icon" }, "📚"),
      "立てかけ"
    ),
    React.createElement(
      "button",
      { className: value === "B" ? "active" : "", onClick: () => onChange("B") },
      React.createElement("span", { className: "icon" }, "🗂"),
      "表紙ならべ"
    )
  );
}

// =====================================================================
// 本棚 案A — 木製の立てかけ本棚（背表紙）
// =====================================================================
function ShelfA({ stories, onOpen, onAddStory, night, shelfVariant, setShelfVariant, selectedTags, setSelectedTags }) {
  const tags = useMemo(() => collectTags(stories), [stories]);
  const filtered = filterByTags(stories, selectedTags);

  return React.createElement(
    "div",
    { className: `eh-home shelf-a ${night ? "night" : ""}` },
    React.createElement(
      "div",
      { className: "eh-header" },
      React.createElement(
        "div",
        { className: "eh-logo" },
        React.createElement("div", { className: "eh-logo-mark" }, "本"),
        React.createElement(
          "div",
          null,
          React.createElement("div", { className: "eh-logo-text" }, "えほんやさん"),
          React.createElement("div", { className: "eh-logo-sub" }, "Ehon — よみたいおはなしを えらんでね")
        )
      ),
      React.createElement(ShelfSwitcher, { value: shelfVariant, onChange: setShelfVariant, night })
    ),
    React.createElement(
      "div",
      { className: "shelf-a-stage" },
      React.createElement(
        "div",
        { className: "shelf-a-greeting" },
        React.createElement("h1", null, "きょうは どのおはなしを よもうかな？"),
        React.createElement("p", null, "本のせなかを タップすると、おはなしがはじまります")
      ),
      React.createElement(TagFilter, { tags, selected: selectedTags, setSelected: setSelectedTags, variant: "a", night }),
      React.createElement(
        "div",
        { className: "shelf-a-shelf" },
        React.createElement(
          "div",
          { className: "shelf-a-decor" },
          React.createElement("div", { className: "shelf-a-decor-item lamp" }),
          React.createElement("div", { className: "shelf-a-decor-item" })
        ),
        filtered.length === 0
          ? React.createElement(
              "div",
              { className: "shelf-empty" },
              "🔍 このタグの えほんは まだないよ"
            )
          : React.createElement(
              "div",
              { className: "shelf-a-books" },
              filtered.map((s, idx) => {
                const heights = [240, 260, 230, 250, 245, 255];
                const widths = [62, 70, 58, 66, 64, 60];
                return React.createElement(
                  "div",
                  { key: s.id, className: "shelf-a-book", onClick: () => onOpen(s.id) },
                  React.createElement(
                    "div",
                    {
                      className: "shelf-a-spine",
                      style: {
                        background: s.spine,
                        height: heights[idx % heights.length],
                        width: widths[idx % widths.length]
                      }
                    },
                    React.createElement("div", { className: "shelf-a-spine-title" }, s.title),
                    React.createElement("div", { className: "shelf-a-spine-emoji" }, s.placeholderEmoji)
                  )
                );
              }),
              React.createElement(
                "div",
                { className: "shelf-a-bookend", onClick: onAddStory },
                React.createElement("div", { className: "shelf-a-bookend-plus" }, "＋"),
                React.createElement("div", { className: "shelf-a-bookend-text" }, "あたらしいおはなし")
              )
            ),
        React.createElement("div", { className: "shelf-a-floor" })
      )
    )
  );
}

// =====================================================================
// 本棚 案B — 表紙グリッド
// =====================================================================
function ShelfB({ stories, onOpen, onAddStory, night, shelfVariant, setShelfVariant, selectedTags, setSelectedTags }) {
  const tags = useMemo(() => collectTags(stories), [stories]);
  const filtered = filterByTags(stories, selectedTags);

  return React.createElement(
    "div",
    { className: `eh-home shelf-b ${night ? "night" : ""}` },
    React.createElement(
      "div",
      { className: "eh-header" },
      React.createElement(
        "div",
        { className: "eh-logo" },
        React.createElement("div", { className: "eh-logo-mark" }, "本"),
        React.createElement(
          "div",
          null,
          React.createElement("div", { className: "eh-logo-text" }, "えほんやさん"),
          React.createElement("div", { className: "eh-logo-sub" }, "Ehon — おやすみまえの よみきかせに")
        )
      ),
      React.createElement(ShelfSwitcher, { value: shelfVariant, onChange: setShelfVariant, night })
    ),
    React.createElement(
      "div",
      { className: "shelf-b-stage" },
      React.createElement(
        "div",
        { className: "shelf-b-greeting" },
        React.createElement(
          "div",
          null,
          React.createElement("div", { className: "eyebrow" }, "ようこそ"),
          React.createElement(
            "h1",
            null,
            "きょうの ",
            React.createElement("span", null, selectedTags.length > 0 ? selectedTags.join("・") : "おはなし"),
            " を えらぼう"
          )
        ),
        React.createElement(
          "div",
          { className: "shelf-b-result-count" },
          `${filtered.length} さつの えほん`
        )
      ),
      React.createElement(TagFilter, { tags, selected: selectedTags, setSelected: setSelectedTags, variant: "b", night }),
      filtered.length === 0
        ? React.createElement(
            "div",
            { className: "shelf-empty" },
            "🔍 このタグの えほんは まだないよ"
          )
        : React.createElement(
            "div",
            { className: "shelf-b-grid" },
            filtered.map((s) =>
              React.createElement(
                "div",
                { key: s.id, className: "shelf-b-card", onClick: () => onOpen(s.id) },
                React.createElement(
                  "div",
                  {
                    className: "shelf-b-cover",
                    style: { background: `linear-gradient(135deg, ${s.coverColor} 0%, ${s.coverAccent} 100%)` }
                  },
                  React.createElement("div", { className: "shelf-b-cover-art" }, s.placeholderEmoji),
                  React.createElement("div", { className: "shelf-b-cover-tag" }, s.author),
                  React.createElement("div", { className: "shelf-b-cover-title" }, s.title)
                ),
                React.createElement(
                  "div",
                  { className: "shelf-b-card-meta" },
                  React.createElement("div", { className: "shelf-b-card-title" }, s.title),
                  React.createElement("div", { className: "shelf-b-card-author" }, s.description),
                  React.createElement(
                    "div",
                    { className: "shelf-b-card-tags" },
                    (s.tags || []).map((t) =>
                      React.createElement(
                        "span",
                        { key: t, className: "shelf-b-mini-tag" },
                        t
                      )
                    )
                  )
                )
              )
            ),
            React.createElement(
              "div",
              { className: "shelf-b-card add", onClick: onAddStory },
              React.createElement(
                "div",
                { className: "shelf-b-cover" },
                React.createElement("div", { className: "plus" }, "＋"),
                React.createElement("div", { className: "label" }, "あたらしいおはなし")
              ),
              React.createElement(
                "div",
                { className: "shelf-b-card-meta" },
                React.createElement("div", { className: "shelf-b-card-title" }, "じぶんでつくる"),
                React.createElement("div", { className: "shelf-b-card-author" }, "AIが おはなしを つくります")
              )
            )
          )
    )
  );
}

window.ShelfA = ShelfA;
window.ShelfB = ShelfB;
