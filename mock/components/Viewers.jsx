/* global React, renderRuby */

const { useState, useEffect, useRef, useCallback } = React;

// =====================================================================
// ビュアー共通フック：キーボードナビ・状態
// =====================================================================
function useViewerNav(totalPages, onClose) {
  // pageIndex: 0=表紙、1..N=本文、N+1=おしまい（ここでは表紙＋本文ページ）
  const [pageIndex, setPageIndex] = useState(0);
  const [flipDir, setFlipDir] = useState(null); // 'next' | 'prev' | null
  const flippingRef = useRef(false);

  const total = totalPages + 1; // 表紙 + 本文

  const go = useCallback(
    (delta) => {
      if (flippingRef.current) return;
      const next = pageIndex + delta;
      if (next < 0 || next >= total) return;
      flippingRef.current = true;
      setFlipDir(delta > 0 ? "next" : "prev");
      setTimeout(() => {
        setPageIndex(next);
      }, 0);
      setTimeout(() => {
        setFlipDir(null);
        flippingRef.current = false;
      }, 500);
    },
    [pageIndex, total]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return { pageIndex, total, flipDir, go };
}

// =====================================================================
// ビュアーツールバー（共通）
// =====================================================================
function ViewerBar({ story, onClose, settings, setSetting, variant, setVariant }) {
  return React.createElement(
    "div",
    { className: "eh-viewer-bar" },
    React.createElement(
      "div",
      { style: { display: "flex", gap: 12, alignItems: "center" } },
      React.createElement(
        "button",
        { className: "eh-viewer-tool", onClick: onClose },
        "← ほんだなへ"
      ),
      React.createElement(
        "div",
        { className: "eh-viewer-title" },
        story.title,
        React.createElement("span", { className: "badge" }, story.author)
      )
    ),
    React.createElement(
      "div",
      { className: "eh-viewer-tools" },
      // ふりがな切替
      React.createElement(
        "button",
        {
          className: "eh-viewer-tool" + (settings.ruby ? " active" : ""),
          onClick: () => setSetting("ruby", !settings.ruby),
          title: "ふりがな"
        },
        "ふりがな ",
        settings.ruby ? "あり" : "なし"
      ),
      // 文字サイズ
      React.createElement(
        "div",
        {
          className: "eh-viewer-tool",
          style: { padding: "4px 6px", gap: 4 }
        },
        React.createElement("span", { style: { padding: "0 6px" } }, "文字"),
        React.createElement(
          "button",
          {
            onClick: () => setSetting("fontSize", Math.max(16, settings.fontSize - 2)),
            style: { border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14, padding: "0 6px" }
          },
          "小"
        ),
        React.createElement(
          "span",
          { style: { fontSize: 12, opacity: 0.7, minWidth: 24, textAlign: "center" } },
          settings.fontSize
        ),
        React.createElement(
          "button",
          {
            onClick: () => setSetting("fontSize", Math.min(40, settings.fontSize + 2)),
            style: { border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 18, padding: "0 6px" }
          },
          "大"
        )
      ),
      // 夜モード
      React.createElement(
        "button",
        {
          className: "eh-viewer-tool" + (settings.night ? " active" : ""),
          onClick: () => setSetting("night", !settings.night),
          title: "明るさ"
        },
        settings.night ? "🌙 よる" : "☀ ひる"
      ),
      // ビュアーレイアウト切替
      setVariant && React.createElement(
        "div",
        { className: "eh-viewer-tool", style: { padding: 2, gap: 0 } },
        ["A", "B"].map((v) =>
          React.createElement(
            "button",
            {
              key: v,
              onClick: () => setVariant(v),
              style: {
                border: "none",
                background: variant === v ? "var(--ink)" : "transparent",
                color: variant === v ? "var(--paper)" : "inherit",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 999
              }
            },
            "見開き " + v
          )
        )
      )
    )
  );
}

// =====================================================================
// ビュアー 案A — 見開き（左ページ絵・右ページ文）
// =====================================================================
function ViewerA({ story, onClose, settings, setSetting, variant, setVariant }) {
  const { pageIndex, total, flipDir, go } = useViewerNav(story.pages.length, onClose);
  const isCover = pageIndex === 0;
  const page = isCover ? null : story.pages[pageIndex - 1];

  return React.createElement(
    "div",
    { className: `eh-viewer ${settings.night ? "night" : ""} ${settings.ruby ? "" : "no-ruby"}` },
    React.createElement(ViewerBar, { story, onClose, settings, setSetting, variant, setVariant }),
    React.createElement(
      "div",
      { className: "eh-progress" },
      React.createElement("div", {
        className: "eh-progress-fill",
        style: { width: `${((pageIndex + 1) / total) * 100}%` }
      })
    ),
    React.createElement(
      "div",
      { className: "eh-viewer-stage" },
      React.createElement(
        "button",
        {
          className: "eh-viewer-nav prev",
          disabled: pageIndex === 0,
          onClick: () => go(-1),
          "aria-label": "まえへ"
        },
        "◀"
      ),
      React.createElement(
        "div",
        { className: `book-a ${flipDir ? "flipping-" + flipDir : ""}` },
        // 左ページ：イラスト
        React.createElement(
          "div",
          { className: "book-a-page left" },
          isCover
            ? React.createElement(
                "div",
                {
                  className: "book-a-illust",
                  style: {
                    background: `linear-gradient(135deg, ${story.coverColor}, ${story.coverAccent})`
                  }
                },
                React.createElement("div", null, story.placeholderEmoji),
                React.createElement("div", { className: "placeholder-tag" }, "表紙イラスト（差し替え予定）")
              )
            : React.createElement(
                "div",
                {
                  className: "book-a-illust",
                  style: { background: page.bg }
                },
                React.createElement("div", null, story.placeholderEmoji),
                React.createElement("div", { className: "placeholder-tag" }, `挿絵：${page.scene}`)
              )
        ),
        // 右ページ：文
        React.createElement(
          "div",
          { className: "book-a-page right" },
          isCover
            ? React.createElement(
                "div",
                { style: { textAlign: "center", margin: "auto" } },
                React.createElement(
                  "div",
                  {
                    style: {
                      fontFamily: "'Hachi Maru Pop', sans-serif",
                      fontSize: 56,
                      lineHeight: 1.2,
                      color: "var(--ink)",
                      marginBottom: 16
                    }
                  },
                  settings.ruby ? renderRuby(story.titleRuby) : story.title
                ),
                React.createElement(
                  "div",
                  { style: { fontSize: 14, color: "var(--ink-soft)", letterSpacing: "0.2em", marginBottom: 32 } },
                  story.author
                ),
                React.createElement(
                  "div",
                  { style: { fontSize: 16, color: "var(--ink-soft)", lineHeight: 1.8, marginBottom: 24 } },
                  story.description
                ),
                React.createElement(
                  "button",
                  {
                    onClick: () => go(1),
                    className: "eh-btn"
                  },
                  "よみはじめる ▶"
                )
              )
            : [
                React.createElement(
                  "div",
                  {
                    key: "t",
                    className: "book-a-text",
                    style: { fontSize: settings.fontSize }
                  },
                  settings.ruby ? renderRuby(page.ruby) : page.text
                ),
                React.createElement(
                  "div",
                  { key: "p", className: "book-a-pageno" },
                  `${pageIndex} / ${story.pages.length}`
                )
              ]
        )
      ),
      React.createElement(
        "button",
        {
          className: "eh-viewer-nav next",
          disabled: pageIndex >= total - 1,
          onClick: () => go(1),
          "aria-label": "つぎへ"
        },
        "▶"
      )
    )
  );
}

// =====================================================================
// ビュアー 案B — 背景全画面・文字オーバーレイ
// =====================================================================
function ViewerB({ story, onClose, settings, setSetting, variant, setVariant }) {
  const { pageIndex, total, flipDir, go } = useViewerNav(story.pages.length, onClose);
  const isCover = pageIndex === 0;
  const page = isCover ? null : story.pages[pageIndex - 1];

  const bg = isCover
    ? `linear-gradient(135deg, ${story.coverColor}, ${story.coverAccent})`
    : page.bg;

  return React.createElement(
    "div",
    { className: `eh-viewer ${settings.night ? "night" : ""} ${settings.ruby ? "" : "no-ruby"}` },
    React.createElement(ViewerBar, { story, onClose, settings, setSetting, variant, setVariant }),
    React.createElement(
      "div",
      { className: "eh-progress" },
      React.createElement("div", {
        className: "eh-progress-fill",
        style: { width: `${((pageIndex + 1) / total) * 100}%` }
      })
    ),
    React.createElement(
      "div",
      { className: "eh-viewer-stage", style: { padding: 0 } },
      React.createElement(
        "button",
        {
          className: "eh-viewer-nav prev",
          disabled: pageIndex === 0,
          onClick: () => go(-1)
        },
        "◀"
      ),
      React.createElement(
        "div",
        { className: `book-b ${flipDir ? "flipping-" + flipDir : ""}` },
        React.createElement(
          "div",
          { className: "book-b-bg", style: { background: bg } },
          React.createElement("div", { className: "book-b-bg-emoji" }, story.placeholderEmoji),
          React.createElement(
            "div",
            { className: "placeholder-tag" },
            isCover ? "表紙イラスト（差し替え予定）" : `挿絵：${page.scene}`
          )
        ),
        isCover
          ? React.createElement(
              "div",
              { className: "book-cover-overlay" },
              React.createElement(
                "div",
                { className: "book-cover-title" },
                settings.ruby ? renderRuby(story.titleRuby) : story.title
              ),
              React.createElement("div", { className: "book-cover-author" }, story.author),
              React.createElement(
                "button",
                { className: "book-cover-cta", onClick: () => go(1) },
                "▶ よみはじめる"
              )
            )
          : React.createElement(
              "div",
              {
                className: "book-b-text-card",
                style: { fontSize: settings.fontSize }
              },
              settings.ruby ? renderRuby(page.ruby) : page.text
            )
      ),
      React.createElement(
        "button",
        {
          className: "eh-viewer-nav next",
          disabled: pageIndex >= total - 1,
          onClick: () => go(1)
        },
        "▶"
      ),
      !isCover &&
        React.createElement(
          "div",
          { className: "eh-pageno" },
          `${pageIndex} / ${story.pages.length}`
        )
    )
  );
}

window.ViewerA = ViewerA;
window.ViewerB = ViewerB;
