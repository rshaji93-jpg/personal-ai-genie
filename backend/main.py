import os
import requests
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Personal AI Genie API", version="4.8.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Cascade list of free models to try on OpenRouter in order of priority
OPENROUTER_FREE_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "openrouter/free",
]

class ChatMessage(BaseModel):
    role: str
    content: str
    senderName: Optional[str] = None
    senderEmail: Optional[str] = None

class ChatRequest(BaseModel):
    user_email: Optional[str] = None
    prompt: str
    space_mode: Optional[str] = "personal"
    conversation_history: Optional[List[ChatMessage]] = []
    custom_api_key: Optional[str] = None
    language_code: Optional[str] = "en-IN"
    is_team_chat: Optional[bool] = False
    is_observer_active: Optional[bool] = False
    models_cascade: Optional[List[str]] = None

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Personal AI Genie Backend", "version": "4.8.0"}

def request_openrouter_model(model_slug: str, api_key: str, prompt: str, history: List[ChatMessage]) -> Optional[str]:
    """Helper to query a specific model on OpenRouter."""
    messages = [
        {
            "role": "system",
            "content": (
                "You are Personal AI Genie, an intelligent, authentic, and helpful AI collaborator. "
                "Answer questions thoroughly, accurately, and naturally. Respond in the language used by the user."
            ),
        }
    ]
    if history:
        for msg in history[-4:]:
            role = "assistant" if msg.role in ["model", "assistant"] else "user"
            messages.append({"role": role, "content": msg.content})
    messages.append({"role": "user", "content": prompt})

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://personal-ai-genie-ten.vercel.app",
        "X-Title": "Personal AI Genie",
    }

    payload = {
        "model": model_slug,
        "messages": messages,
    }

    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30.0,
        )
        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                content = choices[0].get("message", {}).get("content", "")
                if content and content.strip():
                    return content.strip()
        else:
            print(f"OpenRouter [{model_slug}] status {resp.status_code}: {resp.text[:120]}")
    except Exception as err:
        print(f"OpenRouter [{model_slug}] request error: {err}")

    return None

def request_gemini_direct(model_name: str, api_key: str, prompt: str, history: List[ChatMessage]) -> Optional[str]:
    """Direct Google Gemini REST endpoint."""
    if not api_key:
        return None

    clean_model = model_name.replace("models/", "")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent?key={api_key}"

    contents = []
    if history:
        for msg in history[-4:]:
            role = "user" if msg.role == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.content}]})

    contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [{
                "text": "You are Personal AI Genie, a helpful and authentic AI collaborator. Answer questions directly, thoroughly, and clearly."
            }]
        },
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048},
    }

    try:
        resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=15.0)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts and "text" in parts[0]:
                    return parts[0]["text"].strip()
        else:
            print(f"Gemini {clean_model} returned {resp.status_code}")
    except Exception as e:
        print(f"Direct Gemini failed: {e}")

    return None

@app.post("/api/chat")
@app.post("//api/chat")
async def handle_chat(req: ChatRequest):
    history = req.conversation_history or []
    or_key = os.getenv("OPENROUTER_API_KEY", OPENROUTER_KEY).strip()
    gemini_key = (req.custom_api_key or os.getenv("GEMINI_API_KEY", DEFAULT_GEMINI_KEY)).strip()

    # 1. Primary: Direct Google Gemini (if key provided and valid)
    if gemini_key:
        for model in ["gemini-2.5-flash"]:
            reply = request_gemini_direct(model, gemini_key, req.prompt, history)
            if reply:
                return {"reply": reply, "model_used": model}

    # 2. Resilient OpenRouter: Loops through free routes including Llama 3.3 70B Free
    if or_key:
        for model_slug in OPENROUTER_FREE_MODELS:
            print(f"Attempting OpenRouter free model: {model_slug}...")
            reply = request_openrouter_model(model_slug, or_key, req.prompt, history)
            if reply:
                return {"reply": reply, "model_used": model_slug}

    # 3. Emergency fallback if network/quotas are entirely disconnected
    return {
        "reply": (
            f"Personal AI Genie received: '{req.prompt}'.\n\n"
            "External AI pipelines are temporarily reconnecting. "
            "Please ensure your OPENROUTER_API_KEY is active in Render Environment settings."
        ),
        "model_used": "genie-core-engine",
    }

@app.post("/api/tickets")
async def create_ticket(ticket: Dict[str, Any]):
    return {"status": "received", "ticket_id": f"TKT-{os.urandom(3).hex().upper()}"}

@app.post("/api/room/send-invites")
async def send_invites(payload: Dict[str, Any]):
    return {"status": "dispatched", "room_id": payload.get("room_id")}
    
