/* global React, ReactDOM, STORIES, ShelfA, ShelfB, ViewerA, ViewerB, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSlider, TweakColor, TweakSelect */

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "shelfVariant": "A",
  "viewerVariant": "A",
  "fontSize": 22,
  "ruby": true,
  "night": false,
  "accent": "#E07856",
  "font": "rounded"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [openId, setOpenId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  // セッティング（フォント・夜モード等）
  const settings = {
    ruby: tweaks.ruby,
    fontSize: tweaks.fontSize,
    night: tweaks.night,
  };
  const setSetting = (k, v) => setTweak(k, v);

  // アクセント色を CSS 変数に
  useEffect(() => {
    document.documentElement.style.setProperty("--terracotta", tweaks.accent);
  }, [tweaks.accent]);

  // フォント設定を CSS 変数に
  const FONT_PRESETS = {
    rounded: {
      body: "'M PLUS Rounded 1c', 'BIZ UDPGothic', system-ui, sans-serif",
      display: "'Klee One', 'M PLUS Rounded 1c', sans-serif",
    },
    udp: {
      body: "'BIZ UDPGothic', system-ui, sans-serif",
      display: "'BIZ UDPGothic', sans-serif",
    },
    klee: {
      body: "'Klee One', 'M PLUS Rounded 1c', sans-serif",
      display: "'Klee One', sans-serif",
    },
    pop: {
      body: "'Kosugi Maru', 'M PLUS Rounded 1c', sans-serif",
      display: "'Hachi Maru Pop', sans-serif",
    },
    maru: {
      body: "'Zen Maru Gothic', sans-serif",
      display: "'Zen Maru Gothic', sans-serif",
    },
    mincho: {
      body: "'Shippori Mincho', serif",
      display: "'Shippori Mincho', serif",
    },
  };
  useEffect(() => {
    const f = FONT_PRESETS[tweaks.font] || FONT_PRESETS.rounded;
    document.documentElement.style.setProperty("--font-body", f.body);
    document.documentElement.style.setProperty("--font-display", f.display);
  }, [tweaks.font]);

  const story = STORIES.find((s) => s.id === openId);

  const Shelf = tweaks.shelfVariant === "A" ? ShelfA : ShelfB;
  const Viewer = tweaks.viewerVariant === "A" ? ViewerA : ViewerB;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Shelf, {
      stories: STORIES,
      onOpen: (id) => setOpenId(id),
      onAddStory: () => setShowAdd(true),
      night: tweaks.night,
      shelfVariant: tweaks.shelfVariant,
      setShelfVariant: (v) => setTweak("shelfVariant", v),
      selectedTags,
      setSelectedTags,
    }),
    story &&
      React.createElement(Viewer, {
        story,
        onClose: () => setOpenId(null),
        settings,
        setSetting,
        variant: tweaks.viewerVariant,
        setVariant: (v) => setTweak("viewerVariant", v),
      }),

    // 「あたらしいおはなし」ダイアログ（モック）
    showAdd &&
      React.createElement(
        "div",
        {
          style: {
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.5)",
            display: "grid", placeItems: "center"
          },
          onClick: () => setShowAdd(false)
        },
        React.createElement(
          "div",
          {
            onClick: (e) => e.stopPropagation(),
            style: {
              background: "var(--paper)", padding: 40, borderRadius: 18,
              maxWidth: 460, textAlign: "center",
              fontFamily: "'Zen Maru Gothic', sans-serif",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
            }
          },
          React.createElement("div", { style: { fontSize: 56, marginBottom: 8 } }, "✨"),
          React.createElement(
            "h2",
            { style: { fontFamily: "'Hachi Maru Pop', sans-serif", fontSize: 28, marginBottom: 12, color: "var(--ink)" } },
            "あたらしいおはなし"
          ),
          React.createElement(
            "p",
            { style: { color: "var(--ink-soft)", lineHeight: 1.7, marginBottom: 24, fontSize: 15 } },
            "AIがオリジナルのおはなしをつくります。",
            React.createElement("br", null),
            "（このきのうは じゅんびちゅうです）"
          ),
          React.createElement(
            "div",
            { style: { display: "flex", gap: 12, justifyContent: "center" } },
            React.createElement(
              "button",
              { className: "eh-btn ghost", onClick: () => setShowAdd(false) },
              "とじる"
            ),
            React.createElement(
              "button",
              {
                className: "eh-btn",
                onClick: () => {
                  setShowAdd(false);
                  alert("（モック）AIがおはなしをつくっています…");
                }
              },
              "つくってもらう"
            )
          )
        )
      ),

    // Tweaksパネル
    React.createElement(
      TweaksPanel,
      { title: "Tweaks" },
      React.createElement(
        TweakSection,
        { title: "レイアウト" },
        React.createElement(TweakRadio, {
          label: "本棚",
          value: tweaks.shelfVariant,
          options: [
            { value: "A", label: "立てかけ" },
            { value: "B", label: "表紙グリッド" },
          ],
          onChange: (v) => setTweak("shelfVariant", v),
        }),
        React.createElement(TweakRadio, {
          label: "ビュアー",
          value: tweaks.viewerVariant,
          options: [
            { value: "A", label: "見開き" },
            { value: "B", label: "全画面" },
          ],
          onChange: (v) => setTweak("viewerVariant", v),
        })
      ),
      React.createElement(
        TweakSection,
        { title: "よみやすさ" },
        React.createElement(TweakToggle, {
          label: "ふりがな（ルビ）",
          value: tweaks.ruby,
          onChange: (v) => setTweak("ruby", v),
        }),
        React.createElement(TweakSlider, {
          label: "もじサイズ",
          value: tweaks.fontSize,
          min: 16,
          max: 36,
          step: 2,
          onChange: (v) => setTweak("fontSize", v),
        }),
        React.createElement(TweakToggle, {
          label: "夜モード",
          value: tweaks.night,
          onChange: (v) => setTweak("night", v),
        })
      ),
      React.createElement(
        TweakSection,
        { title: "色" },
        React.createElement(TweakColor, {
          label: "アクセントカラー",
          value: tweaks.accent,
          onChange: (v) => setTweak("accent", v),
        })
      ),
      React.createElement(
        TweakSection,
        { title: "フォント" },
        React.createElement(TweakSelect, {
          label: "書体",
          value: tweaks.font,
          options: [
            { value: "rounded", label: "やわらか丸ゴシック (M PLUS Rounded)" },
            { value: "udp",     label: "UD教科書体 (BIZ UDPGothic)" },
            { value: "klee",    label: "クレヨン手書き (Klee One)" },
            { value: "pop",     label: "ポップ手描き (Hachi Maru Pop)" },
            { value: "maru",    label: "やさしい丸ゴシ (Zen Maru)" },
            { value: "mincho",  label: "古風な明朝 (Shippori Mincho)" },
          ],
          onChange: (v) => setTweak("font", v),
        })
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(React.createElement(App));
