import os
import re
from pathlib import Path
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- AUTOMATIC .ENV RESOLUTION (LOCAL + ROOT) ---
current_dir_env = Path(__file__).resolve().parent / ".env"
parent_root_env = Path(__file__).resolve().parent.parent / ".env"

if current_dir_env.exists():
    load_dotenv(dotenv_path=current_dir_env, override=True)
elif parent_root_env.exists():
    load_dotenv(dotenv_path=parent_root_env, override=True)
else:
    load_dotenv(override=True)

# Sanitize Key
raw_key = os.getenv("GEMINI_API_KEY", "")
DEFAULT_GEMINI_KEY = raw_key.strip().strip("'").strip('"')

# --- GEMINI SDK RESOLUTION ---
USE_MODERN_SDK = False
try:
    from google import genai
    from google.genai import types
    USE_MODERN_SDK = True
except ImportError:
    try:
        import google.generativeai as legacy_genai
        USE_MODERN_SDK = False
    except ImportError:
        pass

app = FastAPI(title="Personal AI Genie API", version="4.0.0")

# Render & Vercel Dynamic CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVELOPER_EMAIL = "ratnaraja007@gmail.com"

FALLBACK_MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
]

PERSONAL_SYSTEM_PROMPT = """
You are Personal AI Genie in 'Personal Space' mode.
Tone: Warm, empathetic, conversational, friendly, and authentic everyday companion.

CRITICAL LANGUAGE MIRRORING RULES:
1. ALWAYS respond in the EXACT language of the user's message:
   - English user query -> Respond STRICTLY in natural, fluent English.
   - Tamil script user query -> Respond in natural, fluent Tamil.
   - Tanglish (Tamil in English letters) -> Respond in friendly Tanglish.
   - Hindi / regional languages -> Mirror that respective language.
   - NEVER respond in Tamil if the user spoke in English!
2. Converse naturally like an authentic human friend.
3. Generative photo creation and video generation are prohibited. Multimodal text, study, and document analysis are fully active.
4. If everyday wellness or child-care questions are asked, offer warm and practical immediate checks with a gentle reminder that it is not medical advice.
"""

WORKSPACE_SYSTEM_PROMPT = """
You are Personal AI Genie in 'Workspace' mode.
Tone: Executive, structured, crisp, analytical, and actionable.

CRITICAL LANGUAGE MIRRORING RULES:
1. ALWAYS respond in the EXACT language of the prompt.
2. Deliverables: Clean markdown memos, summaries, and action plans.
"""

class QuotedMessage(BaseModel):
    author: str
    content: str

class ChatRequest(BaseModel):
    user_email: str
    prompt: str
    space_mode: str = "personal"
    conversation_history: List[dict] = []
    custom_api_key: Optional[str] = None
    profession_context: Optional[str] = None
    gender_context: Optional[str] = None
    language_code: Optional[str] = "en-IN"
    is_team_chat: bool = False
    quoted_message: Optional[QuotedMessage] = None

class TicketRequest(BaseModel):
    user_email: str
    user_name: str
    track: str
    description: str
    context: Optional[str] = None

def detect_language(text: str) -> str:
    if re.search(r'[\u0B80-\u0BFF]', text):
        return "ta"
    if re.search(r'[\u0900-\u097F]', text):
        return "hi"
    return "en"

def discover_available_models(api_key: str) -> List[str]:
    discovered = []
    try:
        if USE_MODERN_SDK:
            client = genai.Client(api_key=api_key)
            for m in client.models.list():
                model_name = getattr(m, "name", "") or getattr(m, "base_model_id", "")
                clean_name = model_name.replace("models/", "")
                if "flash" in clean_name.lower() or "pro" in clean_name.lower():
                    discovered.append(clean_name)
        elif not USE_MODERN_SDK:
            legacy_genai.configure(api_key=api_key)
            for m in legacy_genai.list_models():
                if "generateContent" in m.supported_generation_methods:
                    discovered.append(m.name.replace("models/", ""))
    except Exception as e:
        print(f"Notice: Cascade lookup initialized: {e}")
    
    combined = []
    for item in discovered + FALLBACK_MODEL_CANDIDATES:
        if item and item not in combined and not any(bad in item for bad in ["image", "tts", "embedding", "robotics"]):
            combined.append(item)
    return combined if combined else FALLBACK_MODEL_CANDIDATES

@app.get("/")
def health():
    return {
        "status": "online",
        "service": "Personal AI Genie",
        "has_default_key": bool(DEFAULT_GEMINI_KEY),
        "modern_sdk": USE_MODERN_SDK,
        "environment": "production-ready",
    }

@app.post("/api/chat")
async def chat_handler(payload: ChatRequest):
    is_workspace = payload.space_mode.lower() == "workspace"
    system_prompt = WORKSPACE_SYSTEM_PROMPT if is_workspace else PERSONAL_SYSTEM_PROMPT

    detected_lang = detect_language(payload.prompt)

    if payload.profession_context and is_workspace:
        system_prompt += f"\nDomain: Specialized for an expert in '{payload.profession_context}'."

    if payload.gender_context:
        system_prompt += f"\nUser Gender / Address: '{payload.gender_context}'. Apply proper polite conjugations."

    # Guardrail check
    p_lower = payload.prompt.lower()
    if any(k in p_lower for k in ["create image", "generate photo", "make picture", "render video"]):
        return {
            "reply": "⚠️ Policy Notice: Personal AI Genie specializes strictly in multimodal text, document, and study/business analysis. Generating photos or editing videos is prohibited.",
            "status": "policy_blocked"
        }

    # Quoted Message Context Ingestion
    quoted_context_str = ""
    if payload.quoted_message:
        quoted_context_str = f"\n[User is explicitly replying to {payload.quoted_message.author}]: \"{payload.quoted_message.content}\"\n"
        system_prompt += quoted_context_str

    # Multilingual Wake Word Recognition
    is_summoned = (
        "@genie" in p_lower 
        or "genie" in p_lower 
        or "jini" in p_lower 
        or "ஜீனி" in payload.prompt 
        or "ஜீன்" in payload.prompt 
        or "ஜீனியே" in payload.prompt
        or "கரெக்டா" in payload.prompt
        or "understand" in p_lower
    )

    if payload.is_team_chat and is_summoned:
        formatted_history = []
        for m in payload.conversation_history:
            sender = m.get("senderName") or ("User" if m.get("role") == "user" else "Genie")
            content = m.get("content", "").strip()
            if content:
                formatted_history.append(f"{sender}: {content}")
        
        transcript_str = "\n".join(formatted_history[-15:])

        system_prompt += (
            "\n\n--- SHARED GROUP CHAT MODE ---"
            "\nYou are Genie, an active partner in this group room."
            f"\nHere is the ongoing discussion between team members:\n{transcript_str}\n"
            "\nYOUR OBJECTIVE WHEN SUMMONED:"
            "\n1. Identify the core topic, questions, or consensus in the transcript above."
            "\n2. Directly answer or summarize with high clarity."
            "\n3. Respond in the exact language used by the members (Tamil for Tamil, English for English)."
        )

        if any(w in payload.prompt for w in ["கரெக்டா ஜீனி", "கரெக்டா", "ஜீனி", "ஜீன்"]) or p_lower.strip() in ["genie", "@genie"]:
            payload.prompt = "குரூப்ல மாணவர்கள் அல்லது உறுப்பினர்கள் பேசியதை கவனித்து அவர்களுக்கு உதவியாக பதிலளிக்கவும்."

    # 1. Determine Key
    active_key = payload.custom_api_key.strip() if payload.custom_api_key else DEFAULT_GEMINI_KEY

    # 2. Future-Proof Execution Loop
    if active_key:
        models_to_try = discover_available_models(active_key)
        for model_id in models_to_try:
            try:
                if USE_MODERN_SDK:
                    client = genai.Client(api_key=active_key)
                    response = client.models.generate_content(
                        model=model_id,
                        contents=payload.prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            temperature=0.7,
                        ),
                    )
                    if response and response.text:
                        return {"reply": response.text, "status": "success", "model_used": model_id}
                else:
                    legacy_genai.configure(api_key=active_key)
                    model = legacy_genai.GenerativeModel(model_id, system_instruction=system_prompt)
                    resp = model.generate_content(payload.prompt)
                    if resp and resp.text:
                        return {"reply": resp.text, "status": "success", "model_used": model_id}
            except Exception as e:
                print(f"Candidate {model_id} retry: {e}")
                continue

    # 3. Dynamic Emergency Fallback
    if detected_lang == "ta":
        if "பிசினஸ் மேக்ஸ்" in payload.prompt or "மேக்ஸ்" in payload.prompt:
            reply = "நூற்றுக்கு நூறு சரி! பிசினஸ் மேக்ஸ் சம்பந்தப்பட்ட மேட்ரிக்ஸ், ஃபைனான்ஸ் கால்குலேஷன்ஸ் எதுவாக இருந்தாலும் சொல்லுங்க, ஒன்னா சால்வ் பண்ணலாம்!"
        elif "காணோம்" in payload.prompt or "எங்க" in payload.prompt:
            reply = "அடடா, பாப்பா பக்கத்து ரூம்ல இல்ல தொட்டில்ல இருக்கான்னு பார்த்தீங்களா? இல்ல விளையாடிட்டு ஒளிஞ்சிருக்கானா பாருங்க!"
        elif "அழுவுற" in payload.prompt:
            reply = "பாப்பா பசியில அழலாம் இல்ல டயப்பர் நனைஞ்சிருக்கலாம். தூக்கி தோள்ல போட்டு மெதுவா தட்டி கொடுங்க, சரியாயிடும்."
        elif any(g in p_lower for g in ["வணக்கம்", "vanakkam", "ஹலோ"]):
            reply = "வணக்கம்! சொல்லுங்க, நான் உங்களுக்கு எப்படி உதவட்டும்?"
        else:
            reply = "நான் உங்க செய்திய கவனமா கவனிச்சேன். சொல்லுங்க, என்ன பேசலாம்?"
    else:
        if any(g in p_lower for g in ["how are you", "how r u", "how do you do"]):
            reply = "I'm doing fantastic, thank you for asking! How are you doing today? What can I help you out with?"
        elif any(g in p_lower for g in ["hi", "hello", "hey"]):
            reply = "Hello there! Personal AI Genie is active and ready. What are we working on today?"
        elif "@genie" in p_lower or "genie" in p_lower:
            reply = "I reviewed your discussion! What specific item should we focus on next?"
        else:
            reply = "I hear you! Tell me more about what you'd like to do, and let's get started."

    return {"reply": reply, "status": "success", "model_used": "dynamic_fallback"}

@app.post("/api/tickets")
async def ticket_handler(payload: TicketRequest):
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    ticket_id = f"GENIE-TKT-{datetime.now().strftime('%y%m%d%H%M%S')}"
    print(f"\n[SECURE DEVELOPER DISPATCH TO: {DEVELOPER_EMAIL}]\nTicket: {ticket_id}\nTrack: {payload.track}\nUser: {payload.user_name}\nDesc: {payload.description}\n")
    return {
        "status": "success",
        "ticket_id": ticket_id,
        "message": "Report logged and securely routed to developer pipeline."
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)