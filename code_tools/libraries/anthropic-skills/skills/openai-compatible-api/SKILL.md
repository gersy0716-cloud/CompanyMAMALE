---
name: openai-compatible-api
description: Use when configuring or troubleshooting LLM generation using the dalu.chatgptten.com third-party OpenAI-compatible API. This skill provides the necessary API base URL and model identifiers.
---

# OpenAI-Compatible API Configuration (Dalu)

This skill documents the configuration for the third-party OpenAI-compatible API provided by `dalu.chatgptten.com`.

## API Details

- **API Base URL**: `https://dalu.chatgptten.com/v1`
- **Model Name**: `gemini-3-pro-preview`
- **API Key**: `sk-bfsoBhqtsjZ1x5sqbKrA4mFg0DH7aUQMlToVykNJ5IGnww7r`

## Environment Setup

Add the following to your `.env.local`:

```env
LLM_ENGINE="OPENAI"
LLM_OPENAI_API_BASE_URL="https://dalu.chatgptten.com/v1"
LLM_OPENAI_API_MODEL="gemini-3-pro-preview"
AUTH_OPENAI_API_KEY="sk-bfsoBhqtsjZ1x5sqbKrA4mFg0DH7aUQMlToVykNJ5IGnww7r"
```

## Troubleshooting

- **401 Unauthorized**: Check if the API key is valid and has not expired.
- **404 Not Found**: Verify the model name (`gemini-3-pro-preview`) is correct.
- **Connection Errors**: Ensure the base URL includes `/v1`.
