import os
import json
import logging
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
WHATSAPP_INVITE_TOKEN = os.getenv("WHATSAPP_INVITE_TOKEN", "FAMILY_CIRCLE_2026")

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


class TokenVerifyRequest(BaseModel):
    token: Optional[str] = None
    passcode: Optional[str] = None
    invite_token: Optional[str] = None
    device_id: Optional[str] = None


class ReportIssueRequest(BaseModel):
    user_name: Optional[str] = "Anonymous"
    device_id: Optional[str] = "Unknown"
    role_mode: Optional[str] = "professional"
    category: Optional[str] = "General"
    description: str


class ChatRequest(BaseModel):
    profile: Optional[dict] = None
    role_mode: Optional[str] = "professional"
    message: str
    image_base64: Optional[str] = None
    image_mime_type: Optional[str] = "image/jpeg"
    invite_token: Optional[str] = None
    device_id: Optional[str] = None


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Personal AI Canvas Backend",
        "mode": "hybrid-desktop-mobile",
    }


@app.post("/api/verify-token")
@app.post("/verify-token")
async def verify_token(payload: TokenVerifyRequest):
    provided = payload.invite_token or payload.token or payload.passcode
    if not provided:
        raise HTTPException(status_code=400, detail="Token or passcode is required")

    if provided.strip() == WHATSAPP_INVITE_TOKEN.strip():
        return {"valid": True, "message": "Access granted"}

    raise HTTPException(status_code=401, detail="Invalid passcode or limit reached")


@app.post("/api/report-issue")
@app.post("/report-issue")
async def report_issue(payload: ReportIssueRequest):
    if not payload.description.strip():
        raise HTTPException(status_code=400, detail="Description is required")

    logger.info(
        f"[IN-APP ISSUE REPORT] User: {payload.user_name} | Mode: {payload.role_mode} | "
        f"Category: {payload.category} | Device: {payload.device_id} | Details: {payload.description}"
    )

    phone = os.getenv("ADMIN_PHONE")
    apikey = os.getenv("CALLMEBOT_API_KEY")
    if phone and apikey:
        try:
            import urllib.parse
            import urllib.request

            msg = (
                f"*AI Canvas Feedback*\n"
                f"From: {payload.user_name} ({payload.category})\n"
                f"Issue: {payload.description}\n"
                f"Device: {payload.device_id}"
            )
            encoded = urllib.parse.quote_plus(msg)
            url = f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={encoded}&apikey={apikey}"
            req = urllib.request.Request(url, headers={"User-Agent": "FastAPI"})
            urllib.request.urlopen(req, timeout=5)
        except Exception as e:
            logger.warning(f"Could not forward alert to WhatsApp bot: {e}")

    return {"status": "success", "message": "Feedback received by admin"}


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

        if request.role_mode == "professional":
            sys_prompt = (
                f"You are an expert executive AI assistant and copilot for {user_name}, "
                f"who works as a {profession}. Their primary interests include {interests}. "
                "Provide thorough, high-precision technical answers, code solutions, workflow analysis, "
                "and executive-level written communications."
            )
        else:
            sys_prompt = (
                f"You are an academic coach and study architect for {user_name}, "
                f"currently studying {grade_class}. Their primary interests include {interests}. "
                "Break down complex academic concepts step-by-step, generate quizzes, explain principles "
                "simply, and prepare printable structured summaries."
            )

        contents: List[Any] = [sys_prompt]

        if request.image_base64:
            import base64

            image_bytes = base64.b64decode(request.image_base64)
            contents.append(
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=request.image_mime_type or "image/jpeg",
                )
            )

        contents.append(request.message)

        # Explicitly configure generation to eliminate the AFC notice
        gen_config = types.GenerateContentConfig(
            temperature=0.7,
        )

        models_to_try = [
            "gemini-3.8-flash",
            "gemini-3.5-flash",
            "gemini-3.1-pro-preview",
        ]

        for model_name in models_to_try:
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
                if any(code in err_text for code in ["503", "UNAVAILABLE", "404", "NOT_FOUND"]):
                    continue
                else:
                    yield f"\n[AI Error: {err_text}]"
                    return

        yield "\n[AI Error: High demand across all endpoints. Please retry shortly.]"

    return StreamingResponse(generate_stream(), media_type="text/plain")