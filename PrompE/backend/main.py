from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from pydantic import BaseModel
import os
from typing import List, Dict
import openai
from dotenv import load_dotenv
import json
import httpx
import uuid

# --- .env 파일에서 환경 변수 로드 ---
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# --- 1. 데이터베이스 설정 ---
DATABASE_URL = "sqlite:///./prompe.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. SQLAlchemy 모델 ---
class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(String, index=True)
    image_url = Column(String)

# --- 3. Pydantic 모델 ---
class PostRead(BaseModel):
    id: int; prompt: str; image_url: str
    class Config: from_attributes = True

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

class ChatResponse(BaseModel):
    reply: str

class SuggestionRequest(BaseModel):
    subject: str

class SuggestionResponse(BaseModel):
    adjectives: List[str]; verbs: List[str]; locations: List[str]

class ImageGenerationRequest(BaseModel):
    prompt: str
    user_image: str

class ImageGenerationResponse(BaseModel):
    image_url: str

class HintRequest(BaseModel):
    prompt: str

class HintResponse(BaseModel):
    adjectives: List[str]; verbs: List[str]; styles: List[str]

class ShareRequest(BaseModel):
    prompt: str
    image_url: str

class LayerData(BaseModel):
    name: str
    type: str
    data: str

class ComposePromptRequest(BaseModel):
    layers: List[LayerData]

# [수정됨] Pydantic 모델의 필드명을 OpenAI가 생성하는 JSON 키와 일치시킴
class ComposePromptResponse(BaseModel):
    dalle_prompt: str
    korean_description: str

# --- 4. FastAPI 앱 및 미들웨어 설정 ---
app = FastAPI()
origins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://promp-e.vercel.app"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
Base.metadata.create_all(bind=engine)

# --- 5. 데이터베이스 의존성 ---
def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- 6. API 엔드포인트 구현 ---
@app.get("/")
def read_root():
    return {"message": "PrompE Backend is running!"}

@app.post("/api/posts/", response_model=PostRead)
async def create_post(request: ShareRequest, db: Session = Depends(get_db)):
    image_url_to_download = request.image_url
    prompt = request.prompt
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(image_url_to_download)
            response.raise_for_status()
            image_data = response.content
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"이미지를 다운로드할 수 없습니다: {e}")
    unique_filename = f"{uuid.uuid4()}.png"
    file_location = f"uploads/{unique_filename}"
    with open(file_location, "wb") as buffer:
        buffer.write(image_data)
    db_image_url = f"/{file_location}"
    db_post = Post(prompt=prompt, image_url=db_image_url)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.get("/api/posts/", response_model=List[PostRead])
async def read_posts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Post).offset(skip).limit(limit).all()

@app.post("/api/chat/", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    if not openai.api_key: raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        messages_to_send = [{"role": "system", "content": "너는 AI와 프롬프트에 대해 아이들에게 가르쳐주는 친절하고 상냥한 AI 조수야. 아이들이 이해하기 쉽도록 항상 짧고 재미있게 대답해줘."}, *request.messages]
        completion = openai.chat.completions.create(model="gpt-4o", messages=messages_to_send)
        return ChatResponse(reply=completion.choices[0].message.content)
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/suggest-keywords/", response_model=SuggestionResponse)
async def suggest_keywords_for_subject(request: SuggestionRequest):
    if not openai.api_key: raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        system_prompt = f"""당신은 어린이 그림 그리기 게임을 돕는 창의적인 AI 어시스턴트입니다. 사용자가 그리고 싶은 주인공으로 '{request.subject}'를(을) 선택했습니다. 당신의 임무는 주인공 '{request.subject}'와(과) 잘 어울리는 이야기를 만들 수 있는 연관 키워드를 추천하는 것입니다. '꾸며주는 말(형용사)' 8개, '하는 일(동사)' 8개, '장소' 8개를 각각 추천해주세요. 당신의 답변은 반드시 "adjectives", "verbs", "locations" 라는 세 개의 키를 가진 유효한 JSON 객체 형식이어야 합니다. 각 키의 값은 8개의 한국어 문자열을 담은 리스트(배열)여야 합니다."""
        completion = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Please generate keywords for the subject: '{request.subject}'"}
            ],
            response_format={"type": "json_object"}
        )
        keyword_data = json.loads(completion.choices[0].message.content)
        return SuggestionResponse(adjectives=keyword_data.get("adjectives", []), verbs=keyword_data.get("verbs", []), locations=keyword_data.get("locations", []))
    except Exception as e: raise HTTPException(status_code=500, detail=f"키워드 추천 중 오류가 발생했습니다: {e}")

@app.post("/api/generate-image/", response_model=ImageGenerationResponse)
async def generate_image_from_prompt(request: ImageGenerationRequest):
    if not openai.api_key: raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        prompt_for_dalle = ""
        if request.user_image == "none":
            prompt_for_dalle = f"A simple, clean, cute children's book illustration style of: {request.prompt}"
        else:
            system_prompt = """You are an expert prompt engineer for a children's educational drawing AI. Your task is to create a final English prompt for DALL-E 3 by combining a user's (1) simple drawing and (2) text description. **CRITICAL RULES:** 1. **Strictly Adhere to the Drawing**: Respect the user's original drawing. Maintain the composition, pose, and basic shapes. 2. **Explicit Text Only**: Only add or modify elements explicitly mentioned in the text. 3. **No Assumptions**: DO NOT add faces, eyes, or limbs unless drawn or described. Do not guess mood. 4. **White Background is Default**: If no background is specified, use "isolated on a plain white background". 5. **Consistent Style**: Always start with "A simple, clean, cute children's book illustration of...". 6. **Output Format**: Respond ONLY with the final English prompt."""
            gpt_response = openai.chat.completions.create(model="gpt-4o", messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": [{"type": "text", "text": f"User's Text Prompt: '{request.prompt}'"}, {"type": "image_url", "image_url": {"url": request.user_image}}]}], max_tokens=150)
            prompt_for_dalle = gpt_response.choices[0].message.content
        image_response = openai.images.generate(model="dall-e-3", prompt=prompt_for_dalle, size="1024x1024", quality="standard", n=1)
        return ImageGenerationResponse(image_url=image_response.data[0].url)
    except Exception as e: raise HTTPException(status_code=500, detail=f"이미지 생성 중 오류가 발생했습니다: {e}")

@app.post("/api/generate-hints/", response_model=HintResponse)
async def generate_hints_from_prompt(request: HintRequest):
    if not openai.api_key: raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        system_prompt = f"""
        You are an AI assistant that helps a child learn prompt engineering. The user will provide a sentence they have created: "{request.prompt}". Your task is to analyze this sentence and suggest alternative or additional keywords to inspire creativity.
        **CRITICAL INSTRUCTIONS:**
        1.  You **MUST** generate **exactly 5 keywords** for each category: "adjectives", "verbs" (actions), and "styles" or "moods".
        2.  The keywords must be in Korean.
        3.  The keywords should be creative and related to the user's prompt, but do not need to be strictly derived from it. Expand on the theme.
        4.  Your response format **MUST** be a valid JSON object with three keys: "adjectives", "verbs", "styles". Each key's value must be a list containing exactly 5 strings.
        Example User Prompt: "숲속에서 잠자는 커다란 빨간 용"
        Your JSON Response (MUST contain 5 items per list): {{ "adjectives": ["신비로운", "고대의", "반짝이는", "거대한", "평화로운"], "verbs": ["꿈을 꾸는", "숨 쉬는", "둥지를 튼", "조용히 기다리는", "빛을 내는"], "styles": ["수채화 스타일", "애니메이션 느낌", "밤 배경", "아침 햇살 아래", "판타지 아트"] }}
        """
        completion = openai.chat.completions.create(model="gpt-4o", messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": request.prompt}], response_format={"type": "json_object"})
        hint_data = json.loads(completion.choices[0].message.content)
        return HintResponse(adjectives=hint_data.get("adjectives", []), verbs=hint_data.get("verbs", []), styles=hint_data.get("styles", []))
    except Exception as e: raise HTTPException(status_code=500, detail=f"힌트 생성 중 오류가 발생했습니다: {e}")

@app.post("/api/compose-prompt/", response_model=ComposePromptResponse)
async def compose_prompt_from_layers(request: ComposePromptRequest):
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        system_prompt = """
        You are a master prompt crafter for DALL-E 3. Your task is to analyze multiple layers of user input (images and text) and generate two versions of a final prompt:
        1. A detailed English prompt for DALL-E 3.
        2. A natural Korean sentence describing the final image for the user.
        Your response MUST be a valid JSON object with two keys: "dalle_prompt" (string) and "korean_description" (string).
        """
        user_content = []
        for layer in request.layers:
            if layer.type == 'text' and layer.data:
                user_content.append({"type": "text", "text": f"Layer '{layer.name}': {layer.data}"})
            elif layer.type == 'image' and layer.data:
                user_content.append({"type": "text", "text": f"Layer '{layer.name}' (analyze image):"})
                user_content.append({"type": "image_url", "image_url": {"url": layer.data}})
        if not user_content:
            raise HTTPException(status_code=400, detail="No content provided.")
        gpt_response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_content}],
            response_format={"type": "json_object"},
            max_tokens=400
        )
        response_data = json.loads(gpt_response.choices[0].message.content)
        
        # [수정됨] return 시 Pydantic 모델의 수정된 필드명과 일치하는 키를 사용
        return ComposePromptResponse(
            dalle_prompt=response_data.get("dalle_prompt", "Error: Failed to generate DALL-E prompt."),
            korean_description=response_data.get("korean_description", "오류: 한글 설명을 생성하지 못했습니다.")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프롬프트 조합 오류: {e}")