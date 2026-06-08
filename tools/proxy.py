import os
import json
import time
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx
import uvicorn

app = FastAPI()

# 🎡 【多平台金鑰池 / Multi-Platform Key Pool】
# 格式 / Format: ("平台標籤 / Provider", "模型名稱 / Model", "API_KEY", "API端點網址 / Endpoint")
# 💡 安全排版提示：每一行結尾都必須有逗號（,），徹底防止 'tuple' object is not callable 錯誤！
KEY_POOL = [
    # ---- 1. Google Gemini Keys (6-Key Cluster running gemini-3-flash-preview) ----
    ("gemini", "gemini-3-flash-preview", "AIzaSyBzjJFhpJyt_DNBqMIBt4y5-o-UPjR4PaM", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"),
    ("gemini", "gemini-3-flash-preview", "AIzaSyD812jgiizcdNzaRHkHgoT7uOh__rQl-WQ", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"),
    ("gemini", "gemini-3-flash-preview", "AIzaSyCZsBOB8mAtu7NLV1i6vZylt-krs8MvpC4", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"),
    ("gemini", "gemini-3-flash-preview", "AIzaSyAzje4VbIzQIahJ_BpxtWbJUUHWLKzXDYo", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"),
    ("gemini", "gemini-3-flash-preview", "AIzaSyAS5KerXPjTlmk6Rcsf5IDy68np00-NipQ", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"),
    ("gemini", "gemini-3-flash-preview", "AIzaSyDWzSsnVe2e_EY3tG_W6lYK4iIR3lks8ac", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"),
    
    # ---- 2. OpenRouter Platform ----
    ("openrouter", "google/gemini-2.5-flash", "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", "https://openrouter.ai/api/v1/chat/completions"),
    ("openrouter", "google/gemini-2.5-flash", "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", "https://openrouter.ai/api/v1/chat/completions"),
    ("openrouter", "google/gemini-2.5-flash", "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", "https://openrouter.ai/api/v1/chat/completions"),
    
    # ---- 3. GitHub Models Platform ----
    ("github", "gpt-4o-mini", "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", "https://models.inference.ai.azure.com/chat/completions"),
    ("github", "gpt-4o-mini", "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", "https://models.inference.ai.azure.com/chat/completions"),
    
    # ---- 4. Groq Platform ----
    ("groq", "llama-3.3-70b-versatile", "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", "https://api.groq.com/openai/v1/chat/completions"),
    ("groq", "llama-3.3-70b-versatile", "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", "https://api.groq.com/openai/v1/chat/completions")
]

# 🔄 Global index for Round-Robin key rotation
pool_index = 0
KEY_LAST_USED_TIME = {}

async def fetch_from_provider(provider, model_name, api_key, endpoint, messages_history, client_tools, current_idx):
    global KEY_LAST_USED_TIME
    MIN_INTERVAL = 4.5
    now = time.time()
    if api_key in KEY_LAST_USED_TIME:
        elapsed = now - KEY_LAST_USED_TIME[api_key]
        if elapsed < MIN_INTERVAL:
            await asyncio.sleep(MIN_INTERVAL - elapsed)
    KEY_LAST_USED_TIME[api_key] = time.time()

    async with httpx.AsyncClient() as client:
        try:
            if provider == "gemini":
                gemini_messages = []
                for m in messages_history:
                    role = "model" if m["role"] == "assistant" else "user"
                    parts = []
                    for block in m["content"]:
                        if block["type"] == "text":
                            parts.append({"text": block["text"]})
                        elif block["type"] == "tool_use":
                            parts.append({"functionCall": {"name": block["name"], "args": block["input"]}})
                        elif block["type"] == "tool_result":
                            parts.append({"functionResponse": {"name": block["name"], "response": {"result": block["content"]}}})
                    gemini_messages.append({"role": role, "parts": parts})

                payload = {"contents": gemini_messages, "generationConfig": {"temperature": 0.3, "maxOutputTokens": 4096}}
                if client_tools:
                    payload["tools"] = [{"function_declarations": [{"name": t["name"], "description": t["description"], "parameters": t["input_schema"]} for t in client_tools]}]

                res = await client.post(f"{endpoint}?key={api_key}", json=payload, headers={"Content-Type": "application/json"}, timeout=60.0)
                res_data = res.json()

                if "candidates" in res_data and res_data["candidates"]:
                    anthropic_content_blocks = []
                    for part in res_data["candidates"][0]["content"]["parts"]:
                        if "text" in part:
                            anthropic_content_blocks.append({"type": "text", "text": part["text"]})
                        if "functionCall" in part:
                            anthropic_content_blocks.append({"type": "tool_use", "id": f"tool_{int(time.time())}", "name": part["functionCall"]["name"], "input": part["functionCall"]["args"]})
                    return anthropic_content_blocks
                return None

            elif provider in ["openrouter", "github", "groq"]:
                openai_messages = []
                for m in messages_history:
                    if m["role"] == "user":
                        content = []
                        for b in m["content"]:
                            if b["type"] == "text": content.append({"type": "text", "text": b["text"]})
                            elif b["type"] == "tool_result":
                                openai_messages.append({"role": "tool", "tool_call_id": b["id"], "content": json.dumps(b["content"])})
                        if content: openai_messages.append({"role": "user", "content": content})
                    elif m["role"] == "assistant":
                        content = "".join([b["text"] for b in m["content"] if b["type"] == "text"])
                        tool_calls = [{"id": b["id"], "type": "function", "function": {"name": b["name"], "arguments": json.dumps(b["input"])}} for b in m["content"] if b["type"] == "tool_use"]
                        openai_messages.append({"role": "assistant", "content": content or None, "tool_calls": tool_calls or None})

                payload = {"model": model_name, "messages": openai_messages, "temperature": 0.2, "max_tokens": 4096, "tools": client_tools if client_tools else None}
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                res = await client.post(endpoint, json=payload, headers=headers, timeout=60.0)
                res_data = res.json()

                if "choices" in res_data:
                    msg = res_data["choices"][0]["message"]
                    blocks = []
                    if msg.get("tool_calls"):
                        for t in msg["tool_calls"]:
                            blocks.append({"type": "tool_use", "id": t["id"], "name": t["function"]["name"], "input": json.loads(t["function"]["arguments"])})
                    if msg.get("content"):
                        blocks.append({"type": "text", "text": msg["content"]})
                    return blocks or [{"type": "text", "text": ""}]
                return None
        except Exception as e:
            print(f"Error: {e}")
            return None

@app.post("/v1/messages")
@app.post("/messages")
async def anthropic_proxy(request: Request):
    global pool_index
    body = await request.json()
    client_tools = body.get("tools")
    messages_history = []
    for msg in body.get("messages", []):
        content = msg["content"]
        if isinstance(content, str): content = [{"type": "text", "text": content}]
        messages_history.append({"role": msg["role"], "content": content})

    final_blocks = None
    for _ in range(5):
        provider, model, key, url = KEY_POOL[pool_index % len(KEY_POOL)]
        pool_index += 1
        final_blocks = await fetch_from_provider(provider, model, key, url, messages_history, client_tools, pool_index)
        if final_blocks is not None: break

    if final_blocks is None:
        final_blocks = [{"type": "text", "text": "Service temporarily unavailable."}]

    is_tool = any(b["type"] == "tool_use" for b in final_blocks)
    return JSONResponse(content={
        "id": "msg_hybrid_pool", "type": "message", "role": "assistant", "content": final_blocks,
        "model": "claude-3-5-sonnet-20241022", "stop_reason": "tool_use" if is_tool else "end_turn",
        "usage": {"input_tokens": 1000, "output_tokens": 500}
    })

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=4000)