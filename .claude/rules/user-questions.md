# User Questions

When there are unclear points, **stop work and ask**. Prioritize confirmation over guessing.

## AskUserQuestion Tool (Recommended)

For questions where choices can be presented, always use the `AskUserQuestion` tool.
Users can select options with arrow keys, making it more efficient than text input.

```json
{
  "questions": [{
    "question": "{具体的な質問文}？",
    "header": "{短いラベル}",
    "options": [
      {"label": "{選択肢1}", "description": "{補足説明}"},
      {"label": "{選択肢2}", "description": "{補足説明}"}
    ],
    "multiSelect": false
  }]
}
```

**Usage Guidelines:**

| Situation | Tool to Use |
|-----------|------------|
| Questions with 2-4 choices | `AskUserQuestion` |
| Multiple independent questions bundled together (max 4) | `AskUserQuestion` (multiple questions) |
| Questions requiring multiple selections | `AskUserQuestion` (`multiSelect: true`) |
| Code/mockup comparisons needed | `AskUserQuestion` (`preview` field) |
| Free-text only questions with no presentable choices | Text output |

**Notes:**
- Each question should have 2-4 options (users can always use "Other" for free-text input)
- Place recommended options first with `(推奨)` suffix
- Up to 4 questions per call. Bundle related questions together

## Text Output Fallback

Use text output only for free-text questions where choices cannot be presented:
```
⏸ 確認事項があります

{質問内容を箇条書きで記載}

回答をいただいてから作業を再開します。
```
