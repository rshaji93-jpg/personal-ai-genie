import os
import base64
import httpx
from typing import Optional, Set
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from pydantic import BaseModel

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not set in .env")

client = genai.Client(api_key=api_key)

CANDIDATE_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash-lite",
    "gemini-flash-latest"
]

# --- WhatsApp Circle Security Configuration ---
VALID_INVITE_TOKEN = os.getenv("WHATSAPP_INVITE_TOKEN", "FAMILY_CIRCLE_2026")
MAX_ALLOWED_DEVICES = 20
registered_devices: Set[str] = set()

app = FastAPI(title="Personal AI Canvas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserProfile(BaseModel):
    name: str = "User"
    age: int = 20
    is_student: bool = False
    profession: Optional[str] = "Software Developer"
    grade_class: Optional[str] = "Undergraduate"
    interests: Optional[str] = "AI & Technology"


class ChatRequest(BaseModel):
    profile: Optional[UserProfile] = None
    role_mode: str = "professional"
    message: str
    image_base64: Optional[str] = None
    image_mime_type: Optional[str] = "image/jpeg"
    invite_token: Optional[str] = None
    device_id: Optional[str] = None


async def fetch_live_job_openings() -> str:
    try:
        async with httpx.AsyncClient(timeout=8.0) as http_client:
            res = await http_client.get(
                "https://hn.algolia.com/api/v1/search_by_date?tags=job&hitsPerPage=6"
            )
            if res.status_code == 200:
                data = res.json()
                hits = data.get("hits", [])
                openings = []
                for h in hits:
                    title = h.get("title") or "Open Role"
                    story_text = h.get("story_text") or h.get("url") or ""
                    clean_desc = story_text[:250].replace("\n", " ")
                    openings.append(f"- **{title}**: {clean_desc}")
                return "\n".join(openings) if openings else "No current openings found."
    except Exception as e:
        return f"Fetch fallback notice: {str(e)}"
    return "Recent openings unavailable."


@app.get("/")
def health_check():
    return {"status": "online", "active_devices": len(registered_devices)}


@app.post("/api/verify-token")
def verify_token(payload: dict):
    token = payload.get("invite_token")
    device_id = payload.get("device_id")

    if token != VALID_INVITE_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid WhatsApp invite link.")

    if device_id not in registered_devices:
        if len(registered_devices) >= MAX_ALLOWED_DEVICES:
            raise HTTPException(
                status_code=403, 
                detail="Invite capacity reached. This private link has exceeded maximum shares."
            )
        if device_id:
            registered_devices.add(device_id)

    return {"status": "authorized", "token": token}


@app.post("/api/chat")
async def handle_chat_stream(req: ChatRequest):
    # Verify invite gate
    if req.invite_token != VALID_INVITE_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized: Valid WhatsApp invite required.")

    user_msg = req.message
    profile = req.profile or UserProfile()

    if "scan target job openings" in user_msg.lower():
        live_data = await fetch_live_job_openings()
        user_msg = (
            f"The user clicked 'Scan target job openings'. Here is the live data feed:\n\n"
            f"{live_data}\n\n"
            f"Analyze these openings specifically for {profile.name}, who specializes in '{profile.profession or profile.interests}'. "
            "List matching roles, core tech requirements, and personalized application pitches."
        )

    if req.role_mode == "student" or profile.is_student:
        system_instruction = (
            f"You are a personalized interactive tutor and study architect for {profile.name}. "
            f"They are currently studying at the level/class of '{profile.grade_class}' with primary interests in '{profile.interests}'. "
            "Calibrate all explanations, quizzes, and OCR extractions precisely to their level."
        )
    else:
        system_instruction = (
            f"You are a personalized developer copilot and career mentor for {profile.name}. "
            f"Their professional domain is '{profile.profession}', with interests in '{profile.interests}'. "
            "Provide concise, high-grade technical feedback and workflow automation guidance."
        )

    contents_payload = []
    if req.image_base64:
        try:
            raw_bytes = base64.b64decode(req.image_base64)
            contents_payload.append(
                types.Part.from_bytes(
                    data=raw_bytes,
                    mime_type=req.image_mime_type or "image/jpeg"
                )
            )
        except Exception as err:
            print(f"Image decode error: {err}")

    prompt_text = user_msg if user_msg.strip() else "Extract and format this document clearly."
    contents_payload.append(prompt_text)

    def stream_generator():
        stream_started = False
        for model_name in CANDIDATE_MODELS:
            try:
                for chunk in client.models.generate_content_stream(
                    model=model_name,
                    contents=contents_payload,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.4,
                    ),
                ):
                    if chunk.text:
                        stream_started = True
                        yield chunk.text
                if stream_started:
                    return
            except Exception as e:
                print(f"Model {model_name} busy: {e}. Trying fallback...")
                if stream_started:
                    yield f"\n[Stream interrupted: {e}]"
                    return
                continue

        if not stream_started:
            yield "All models are currently experiencing high demand. Please try again shortly."

    return StreamingResponse(stream_generator(), media_type="text/plain")