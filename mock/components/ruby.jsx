/* global React */
// 共通ユーティリティ：ふりがな（ruby）レンダリング
// 入力: "桃太郎{ももたろう}は ぐんぐん大{おお}きく..." のような文字列
// 出力: <ruby>桃太郎<rt>ももたろう</rt></ruby>... を含む React 要素配列

function renderRuby(rubyText) {
  if (!rubyText) return null;
  const parts = [];
  const re = /([^\{]+?)\{([^\}]+)\}|([^\{]+)/g;
  let m;
  let i = 0;
  while ((m = re.exec(rubyText)) !== null) {
    if (m[3]) {
      parts.push(React.createElement(React.Fragment, { key: i++ }, m[3]));
    } else {
      // m[1] が漢字、m[2] がふりがな
      // m[1] には直前の平仮名も含まれてしまう可能性があるので、漢字部分のみrubyに
      const before = m[1];
      const reading = m[2];
      // 漢字（CJK）部分とそれ以外を分ける
      const km = before.match(/^(.*?)([\u3400-\u9FFF\u4E00-\u9FFF々]+)$/);
      if (km) {
        if (km[1]) parts.push(React.createElement(React.Fragment, { key: i++ }, km[1]));
        parts.push(
          React.createElement(
            "ruby",
            { key: i++ },
            km[2],
            React.createElement("rt", null, reading)
          )
        );
      } else {
        parts.push(
          React.createElement(
            "ruby",
            { key: i++ },
            before,
            React.createElement("rt", null, reading)
          )
        );
      }
    }
  }
  return parts;
}

window.renderRuby = renderRuby;
