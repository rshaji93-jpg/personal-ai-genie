import os
import json
import logging
import asyncio
import base64
import urllib.request
import urllib.parse
from typing import Optional, List, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Personal AI Canvas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://personal-ai-canvas.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
UNIVERSAL_PASSCODE = os.getenv("CANVAS_PASSCODE", "shaji family").strip().lower()
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

# Explicit individual email allowlist & domain-wide Workspace allowlist
ALLOWED_EMAILS = [e.strip().lower() for e in os.getenv("ALLOWED_EMAILS", "").split(",") if e.strip()]
ALLOWED_WORKSPACE_DOMAINS = [d.strip().lower() for d in os.getenv("ALLOWED_WORKSPACE_DOMAINS", "").split(",") if d.strip()]

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Preserved stable model fallback chain
STABLE_MODELS = [
    "models/gemini-3.8-flash",
    "models/gemini-3.7-flash",
    "models/gemini-3.6-flash",
]


class TokenVerifyRequest(BaseModel):
    token: Optional[str] = None
    passcode: Optional[str] = None
    invite_token: Optional[str] = None
    device_id: Optional[str] = None
    google_email: Optional[str] = None


class AudioTranslateRequest(BaseModel):
    audio_base64: str
    mime_type: Optional[str] = "audio/webm"


class ReportIssueRequest(BaseModel):
    user_name: Optional[str] = "Anonymous"
    device_id: Optional[str] = "Unknown"
    role_mode: Optional[str] = "professional"
    category: Optional[str] = "General"
    description: str


class JobScanRequest(BaseModel):
    query: str
    location: Optional[str] = "Chennai"


class ChatRequest(BaseModel):
    profile: Optional[dict] = None
    role_mode: Optional[str] = "professional"
    conversational_style: Optional[str] = "chat"
    message: str
    history: Optional[List[dict]] = None
    image_base64: Optional[str] = None
    image_mime_type: Optional[str] = "image/jpeg"
    invite_token: Optional[str] = None
    google_email: Optional[str] = None
    device_id: Optional[str] = None


@app.get("/")
@app.get("/health")
async def health():
    return {
        "status": "online",
        "service": "Personal AI Canvas Backend",
        "version": "6-phase-multilingual",
    }


@app.post("/api/verify-token")
@app.post("/verify-token")
async def verify_token(payload: TokenVerifyRequest):
    # 1. Google Account / Google Workspace Validation
    if payload.google_email:
        clean_email = payload.google_email.strip().lower()
        domain = clean_email.split("@")[-1] if "@" in clean_email else ""

        is_allowed_email = not ALLOWED_EMAILS or clean_email in ALLOWED_EMAILS
        is_allowed_workspace = domain in ALLOWED_WORKSPACE_DOMAINS

        if is_allowed_email or is_allowed_workspace:
            account_type = "workspace" if domain not in ["gmail.com", "googlemail.com"] else "personal"
            return {
                "valid": True,
                "auth_type": "google",
                "account_type": account_type,
                "email": clean_email,
            }

        raise HTTPException(
            status_code=403,
            detail=f"Account '{clean_email}' is not authorized. Contact your workspace admin.",
        )

    # 2. Universal Passcode Validation (Zero leak)
    provided = payload.passcode or payload.invite_token or payload.token
    if provided and provided.strip().lower() == UNIVERSAL_PASSCODE:
        return {"valid": True, "auth_type": "passcode"}

    raise HTTPException(status_code=401, detail="Invalid passcode.")


@app.post("/api/translate-speech")
async def translate_speech(payload: AudioTranslateRequest):
    """
    Multilingual speech translator: accepts spoken audio in ANY language
    (Tamil, Telugu, Malayalam, Hindi, English, etc.) from ANY speaker in the room
    and translates it directly into clear English text.
    """
    if not client:
        raise HTTPException(status_code=500, detail="Gemini client not initialized")

    try:
        audio_bytes = base64.b64decode(payload.audio_base64)
        prompt = (
            "Listen carefully to this audio. The speaker can be anyone speaking in their native language—"
            "such as Tamil, Telugu, Malayalam, Hindi, or English. "
            "Translate their exact meaning directly into natural, clear English text. "
            "Return ONLY the English translation without preamble, conversational remarks, or quotation marks."
        )

        for model_name in STABLE_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        prompt,
                        types.Part.from_bytes(
                            data=audio_bytes,
                            mime_type=payload.mime_type or "audio/webm",
                        ),
                    ],
                )
                translated_text = response.text.strip() if response.text else ""
                return {"text": translated_text}
            except Exception as e:
                logger.warning(f"Translation attempt on {model_name} failed: {e}")
                continue

        raise HTTPException(status_code=500, detail="Audio translation models currently unavailable")
    except Exception as e:
        logger.error(f"Audio translation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scan-jobs")
async def scan_jobs(payload: JobScanRequest):
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            search_term = urllib.parse.quote(f"{payload.query} {payload.location}")
            await page.goto(f"https://html.duckduckgo.com/html/?q={search_term}+careers+jobs", timeout=12000)

            results = []
            links = await page.locator(".result__title .result__url").all_text_contents()
            snippets = await page.locator(".result__snippet").all_text_contents()
            await browser.close()

            for i in range(min(5, len(links))):
                results.append({
                    "title": f"Target Position: {payload.query}",
                    "portal": links[i].strip() if i < len(links) else "Career Portal",
                    "snippet": snippets[i].strip() if i < len(snippets) else "Live opportunity",
                })

            return {"status": "success", "jobs": results}
    except Exception as e:
        logger.warning(f"Playwright scan fallback triggered: {e}")
        return {
            "status": "fallback",
            "jobs": [
                {"title": f"{payload.query} - Healthcare Operations", "portal": "Direct Healthcare Portal", "snippet": "Immediate openings for revenue cycle specialists."},
                {"title": f"{payload.query} - Senior Process Executive", "portal": "IT Solutions Careers", "snippet": "Accounts receivable workflow and claims audit operations."}
            ]
        }


@app.post("/api/report-issue")
@app.post("/report-issue")
async def report_issue(payload: ReportIssueRequest):
    if not payload.description.strip():
        raise HTTPException(status_code=400, detail="Description is required")

    log_msg = f"[IN-APP REPORT] User: {payload.user_name} | Mode: {payload.role_mode} | Details: {payload.description}"
    logger.info(log_msg)

    webhook_url = DISCORD_WEBHOOK_URL or os.getenv("WEBHOOK_URL")
    if webhook_url:
        try:
            req_data = json.dumps({
                "content": f"🚨 **Report from {payload.user_name}**: {payload.description}"
            }).encode("utf-8")
            req = urllib.request.Request(
                webhook_url,
                data=req_data,
                headers={"Content-Type": "application/json", "User-Agent": "FastAPI"},
            )
            urllib.request.urlopen(req, timeout=4)
        except Exception as e:
            logger.warning(f"Webhook forward failed: {e}")

    return {"status": "success", "message": "Feedback received"}


@app.post("/api/chat")
@app.post("/chat")
async def chat(request: ChatRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured on server")

    async def generate_stream():
        user_profile = request.profile or {}
        user_name = user_profile.get("name", "User")
        profession = user_profile.get("profession", "Specialist")
        grade_class = user_profile.get("grade_class", "Student")
        interests = user_profile.get("interests", "General Topics")

        style_instruction = (
            "Keep your response concise, punchy, and conversational (under 3 sentences) unless asked to elaborate. "
            "If the user's intent is ambiguous or missing key details, ask a single direct clarifying question before continuing."
            if request.conversational_style == "chat"
            else "Provide an in-depth, structured document response with clear headings, bullet points, and actionable breakdowns."
        )

        if request.role_mode == "professional":
            sys_prompt = (
                f"You are an executive copilot for {user_name}, working in {profession}. "
                f"Core focus: {interests}. {style_instruction}"
            )
        else:
            sys_prompt = (
                f"You are an academic coach and study architect for {user_name}, studying {grade_class}. "
                f"Core focus: {interests}. {style_instruction}"
            )

        contents: List[Any] = [sys_prompt]

        if request.history:
            recent_turns = request.history[-6:]
            for turn in recent_turns:
                sender_label = "User" if turn.get("sender") == "user" else "Assistant"
                turn_text = turn.get("text", "")
                if turn_text:
                    contents.append(f"{sender_label}: {turn_text}")

        if request.image_base64:
            doc_bytes = base64.b64decode(request.image_base64)
            mime = request.image_mime_type or "image/jpeg"
            contents.append(
                types.Part.from_bytes(
                    data=doc_bytes,
                    mime_type=mime,
                )
            )

        contents.append(f"User: {request.message}")
        gen_config = types.GenerateContentConfig(temperature=0.7)

        for model_name in STABLE_MODELS:
            try:
                response = client.models.generate_content_stream(
                    model=model_name,
                    contents=contents,
                    config=gen_config,
                )
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as model_err:
                err_text = str(model_err)
                if any(code in err_text for code in ["429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE"]):
                    continue
                else:
                    yield f"\n[AI Error: {err_text}]"
                    return

        yield "\n[RATE_LIMIT_COOLDOWN: Engine busy. Cooling down for a few seconds before auto-retrying...]"

    return StreamingResponse(generate_stream(), media_type="text/plain")