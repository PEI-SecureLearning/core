# SecureLearning Module JSON Schema & Prompt Guide

This document defines the exact JSON structure for SecureLearning training modules. Use this guide to generate valid, importable modules with an LLM.

## 🏗 High-Level Structure

The root object is a `ModuleFormData`.

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `string` | Human-readable title. Keep it concise. |
| `category` | `string` | One of: `General Awareness`, `Phishing`, `Password Security`, `Data Protection`, `Network Security`, `Physical Security`. |
| `description` | `string` | A multi-line summary of the module's goals. |
| `estimatedTime` | `string` | Estimated duration as a string, e.g., `"15 minutes"`. |
| `difficulty` | `string` | Exactly one of: `Easy`, `Medium`, `Hard`. |
| `sections` | `Array<Section>` | The core content divided into logical chapters. |

---

## 📂 The Section Object

Sections represent pages or chapters in the module.

- `id`: A unique UUID string (e.g., `crypto.randomUUID()`).
- `title`: Title of the section.
- `blocks`: An array of `Block` objects (ordered).
- `requireCorrectAnswers` (boolean, optional): If `true`, the user cannot leave the section until all questions are answered correctly.
- `isOptional` (boolean, optional): If `true`, the section can be skipped in the UI.
- `minTimeSpent` (number, optional): Minimum seconds the user must stay on this section.

---

## 🧩 The Block Types (`kind`)

Every block must have a `kind` field.

### 1. Text Block (`kind: "text"`)
Content is rendered as GitHub Flavored Markdown.
- `id`: Unique UUID.
- `content`: Markdown string. Support for headers (`#`), bold, lists, and code blocks.

### 2. Question Block (`kind: "question"`)
Interactive knowledge checks.
- `id`: Unique UUID.
- `question`:
    - `id`: Unique UUID.
    - `type`: `multiple_choice`, `true_false`, or `short_answer`.
    - `text`: The question prompt.
    - `choices`: (Required for `multiple_choice` and `true_false`)
        - `id`: Unique UUID.
        - `text`: Answer text.
        - `isCorrect`: Boolean. Exactly one should be `true` for standard questions.
    - `answer`: (Required for `short_answer`) The exact expected string or a regex pattern.

### 3. Rich Content Block (`kind: "rich_content"`)
External media from the system library.
- `id`: Unique UUID.
- `mediaType`: `image`, `video`, `audio`, or `file`.
- `contentId`: The `content_piece_id` from the library (ignore/leave empty if generating a template).
- `caption`: Descriptive text for accessibility and UI.

---

## 💡 LLM Generation Rules

1. **UUIDs**: Always generate unique, valid v4 UUIDs for every `id` field.
2. **Markdown**: Use rich formatting in text blocks to make the module engaging.
3. **Escaping**: Ensure all strings are properly JSON-escaped (especially nested quotes in Markdown).
4. **Validation**: Ensure `multiple_choice` questions have at least one `isCorrect: true` choice.

---

## 🚀 Comprehensive Example

```json
{
  "title": "Mastering MFA (Multi-Factor Authentication)",
  "category": "Password Security",
  "description": "Learn why passwords aren't enough and how to use MFA effectively.",
  "estimatedTime": "10 minutes",
  "difficulty": "Medium",
  "sections": [
    {
      "id": "764b85c1-1e23-4e4b-b0f1-e3d8f36c5b91",
      "title": "What is MFA?",
      "blocks": [
        {
          "id": "d93b1d72-8f1a-4c28-9d4e-1a2b3c4d5e6f",
          "kind": "text",
          "content": "# Multi-Factor Authentication\n\nMFA adds a **second layer of security** to your accounts.\n\n### The Three Factors:\n1. **Something you know** (Password)\n2. **Something you have** (Phone app, security key)\n3. **Something you are** (Fingerprint, face scan)"
        },
        {
          "id": "e82c2a83-9a2b-4d3c-9e5f-1a2b3c4d5e6f",
          "kind": "question",
          "question": {
            "id": "f93d3b94-0b3c-4e4d-9f6a-1a2b3c4d5e6f",
            "type": "multiple_choice",
            "text": "Which of these is an example of 'Something you have'?",
            "choices": [
              { "id": "a1b2c3d4", "text": "Your mother's maiden name", "isCorrect": false },
              { "id": "b2c3d4e5", "text": "A hardware security key (YubiKey)", "isCorrect": true },
              { "id": "c3d4e5f6", "text": "Your 8-character password", "isCorrect": false }
            ],
            "answer": ""
          }
        }
      ]
    }
  ]
}
```
