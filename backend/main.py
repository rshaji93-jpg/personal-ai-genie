import os
import json
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = FastAPI(title="Personal AI Canvas API")

# Allow requests from your Vercel frontend, local development, and preview deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://personal-ai-canvas.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
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


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    prompt: str
    history: Optional[List[ChatMessage]] = []


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Personal AI Canvas Backend",
        "version": "1.0.0",
    }


# Dual route support fixes the 404 error regardless of frontend pathing
@app.post("/api/verify-token")
@app.post("/verify-token")
async def verify_token(payload: TokenVerifyRequest):
    provided = payload.token or payload.passcode
    if not provided:
        raise HTTPException(status_code=400, detail="Token or passcode is required")

    if provided.strip() == WHATSAPP_INVITE_TOKEN.strip():
        return {"valid": True, "message": "Access granted"}

    raise HTTPException(status_code=401, detail="Invalid passcode or limit reached")


@app.post("/api/chat")
@app.post("/chat")
async def chat(request: ChatRequest, x_invite_token: Optional[str] = Header(None)):
    # Validate authorization header if passed
    if x_invite_token and x_invite_token.strip() != WHATSAPP_INVITE_TOKEN.strip():
        raise HTTPException(status_code=403, detail="Unauthorized session token")

    if not client:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured on server")

    async def generate_stream():
        try:
            # Build conversation history
            contents = []
            for msg in request.history:
                role = "user" if msg.role == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.content)]))
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=request.prompt)]))

            response = client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=contents,
            )

            for chunk in response:
                if chunk.text:
                    yield f"data: {json.dumps({'text': chunk.text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate_stream(), media_type="text/event-stream")