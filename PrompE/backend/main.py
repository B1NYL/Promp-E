from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from pydantic import BaseModel, ConfigDict
import os
import logging
import random
from pathlib import Path
from typing import List, Dict, Optional
from openai import OpenAI
from dotenv import load_dotenv
import json
import httpx
import uuid



# Force reload for new API Key

# --- .env 파일에서 환경 변수 로드 ---
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)
logger = logging.getLogger("uvicorn.error")

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
    model_config = ConfigDict(from_attributes=True)

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

class ChatResponse(BaseModel):
    reply: str

class SuggestionRequest(BaseModel):
    subject: str

class SuggestionResponse(BaseModel):
    adjectives: List[str]; verbs: List[str]; locations: List[str]

class ImageAdjectiveRequest(BaseModel):
    object_name: str
    image_data: str

class ImageAdjectiveResponse(BaseModel):
    adjectives: List[str]

class MoodStyleRequest(BaseModel):
    prompt: str
    image_data: str

class MoodStyleResponse(BaseModel):
    moods: List[str]
    styles: List[str]
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

class ComposePromptResponse(BaseModel):
    dalle_prompt: str
    korean_description: str

class MerchMockupRequest(BaseModel):
    design_url: str
    product: str = "tshirt"

class MerchMockupResponse(BaseModel):
    image_url: str
    prompt_used: str

# --- 3-1. Stage1/Stage2 AI Models ---
class EmojiQuizRequest(BaseModel):
    topic: Optional[str] = None

class EmojiQuizQuestion(BaseModel):
    emojis: str
    options: List[str]
    correctIndex: int
    explanation: str

class EmojiQuizResponse(BaseModel):
    questions: List[EmojiQuizQuestion]

class PromptPuzzleBlock(BaseModel):
    text: str
    type: str

class PromptPuzzleLevel(BaseModel):
    prompt_kr: str
    correctBlocks: List[str]
    slots: List[str]
    availableBlocks: List[PromptPuzzleBlock]

class PromptPuzzleRequest(BaseModel):
    level_count: int = 2

class PromptPuzzleResponse(BaseModel):
    levels: List[PromptPuzzleLevel]

# --- 3-2. Prompt Puzzle Image Models ---
class PromptPuzzleImageRequest(BaseModel):
    prompt_kr: str
    subject: str
    action: str
    location: str

class PromptPuzzleImageResponse(BaseModel):
    image_url: str
    prompt_used: str
    prompt_used_kr: str

# [추가됨] /api/save-image/ 엔드포인트를 위한 Pydantic 모델
class SaveImageRequest(BaseModel):
    temp_url: str

class SaveImageResponse(BaseModel):
    saved_url: str


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

# [추가됨] 404 에러 해결을 위해 누락된 /api/save-image/ 엔드포인트 구현
@app.post("/api/save-image/", response_model=SaveImageResponse)
async def save_image_from_temp_url(request: SaveImageRequest):
    """
    DALL-E 등에서 생성된 임시 URL로부터 이미지를 다운로드하여 서버에 영구 저장하고,
    저장된 파일에 접근할 수 있는 새로운 URL을 반환합니다.
    """
    image_url_to_download = request.temp_url
    try:
        # httpx를 사용하여 비동기적으로 이미지를 다운로드합니다.
        async with httpx.AsyncClient() as client:
            response = await client.get(image_url_to_download)
            response.raise_for_status()  # 2xx 상태 코드가 아니면 에러 발생
            image_data = response.content
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"임시 URL에서 이미지를 다운로드할 수 없습니다: {e}")
    
    # 충돌을 피하기 위해 UUID로 고유한 파일 이름을 생성합니다.
    unique_filename = f"{uuid.uuid4()}.png"
    file_location = f"uploads/{unique_filename}"
    
    # 다운로드한 이미지 데이터를 바이너리 쓰기 모드로 파일에 저장합니다.
    with open(file_location, "wb") as buffer:
        buffer.write(image_data)
        
    # 프론트엔드에서 사용할 수 있는 상대 경로를 생성합니다.
    # 예: /uploads/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.png
    saved_url = f"/{file_location}"
    
    return SaveImageResponse(saved_url=saved_url)


@app.post("/api/chat/", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    if not OPENAI_API_KEY: raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        messages_to_send = [{"role": "system", "content": "너는 AI와 프롬프트에 대해 아이들에게 가르쳐주는 친절하고 상냥한 AI 조수야. 아이들이 이해하기 쉽도록 항상 짧고 재미있게 대답해줘."}, *request.messages]
        completion = client.chat.completions.create(model="gpt-4o", messages=messages_to_send)
        return ChatResponse(reply=completion.choices[0].message.content)
    except Exception as e:
        logger.exception("Chat API failed")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/suggest-keywords/", response_model=SuggestionResponse)
async def suggest_keywords_for_subject(request: SuggestionRequest):
    if not OPENAI_API_KEY: raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        system_prompt = f"""당신은 어린이 그림 그리기 게임을 돕는 창의적인 AI 어시스턴트입니다. 사용자가 그리고 싶은 주인공으로 '{request.subject}'를(을) 선택했습니다. 당신의 임무는 주인공 '{request.subject}'와(과) 잘 어울리는 이야기를 만들 수 있는 연관 키워드를 추천하는 것입니다. '꾸며주는 말(형용사)' 8개, '하는 일(동사)' 8개, '장소' 8개를 각각 추천해주세요. 당신의 답변은 반드시 "adjectives", "verbs", "locations" 라는 세 개의 키를 가진 유효한 JSON 객체 형식이어야 합니다. 각 키의 값은 8개의 한국어 문자열을 담은 리스트(배열)여야 합니다."""
        completion = client.chat.completions.create(
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

@app.post("/api/suggest-adjectives/", response_model=ImageAdjectiveResponse)
async def suggest_adjectives_from_image(request: ImageAdjectiveRequest):
    if not OPENAI_API_KEY: raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        system_prompt = """
        You suggest adjectives for a child's drawing.
        Return ONLY a JSON object: { "adjectives": ["...", "..."] }
        Rules:
        - Exactly 8 Korean adjectives.
        - Must describe the object in the image.
        - Easy words for kids.
        - No emojis.
        """
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": f'Object name: "{request.object_name}"'},
                    {"type": "image_url", "image_url": {"url": request.image_data}}
                ]}
            ],
            response_format={"type": "json_object"}
        )
        content = completion.choices[0].message.content
        if not content:
            raise ValueError("Empty response content.")
        data = json.loads(content)
        return ImageAdjectiveResponse(adjectives=data.get("adjectives", []))
    except Exception as e:
        logger.exception("Suggest adjectives failed")
        raise HTTPException(status_code=500, detail=f"형용사 추천 오류: {e}")

@app.post("/api/suggest-mood-style/", response_model=MoodStyleResponse)
async def suggest_mood_style_from_image(request: MoodStyleRequest):
    if not OPENAI_API_KEY: raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        system_prompt = """
        You suggest mood and style words for a child's drawing.
        Return ONLY a JSON object: { "moods": ["..."], "styles": ["..."] }
        Rules:
        - Exactly 6 Korean moods and 6 Korean styles.
        - Must match the drawing and the prompt.
        - Easy words for kids.
        - No emojis.
        """
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": f'Prompt: "{request.prompt}"'},
                    {"type": "image_url", "image_url": {"url": request.image_data}}
                ]}
            ],
            response_format={"type": "json_object"}
        )
        content = completion.choices[0].message.content
        if not content:
            raise ValueError("Empty response content.")
        data = json.loads(content)
        return MoodStyleResponse(
            moods=data.get("moods", []),
            styles=data.get("styles", [])
        )
    except Exception as e:
        logger.exception("Suggest mood/style failed")
        raise HTTPException(status_code=500, detail=f"무드/스타일 추천 오류: {e}")

@app.post("/api/generate-image/", response_model=ImageGenerationResponse)
async def generate_image_from_prompt(request: ImageGenerationRequest):
    if not OPENAI_API_KEY: raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        if request.user_image != "none":
            try:
                image_response = client.images.generate(
                    model="gpt-image-1",
                    prompt=request.prompt,
                    image=request.user_image,
                    size="1024x1024",
                    quality="standard",
                    n=1
                )
                return ImageGenerationResponse(image_url=image_response.data[0].url)
            except Exception:
                pass
        prompt_for_dalle = f"A simple, clean, cute children's book illustration style of: {request.prompt}"
        image_response = client.images.generate(model="dall-e-3", prompt=prompt_for_dalle, size="1024x1024", quality="standard", n=1)
        return ImageGenerationResponse(image_url=image_response.data[0].url)
    except Exception as e: raise HTTPException(status_code=500, detail=f"이미지 생성 중 오류가 발생했습니다: {e}")

@app.post("/api/generate-hints/", response_model=HintResponse)
async def generate_hints_from_prompt(request: HintRequest):
    if not OPENAI_API_KEY: raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
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
        completion = client.chat.completions.create(model="gpt-4o", messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": request.prompt}], response_format={"type": "json_object"})
        hint_data = json.loads(completion.choices[0].message.content)
        return HintResponse(adjectives=hint_data.get("adjectives", []), verbs=hint_data.get("verbs", []), styles=hint_data.get("styles", []))
    except Exception as e: raise HTTPException(status_code=500, detail=f"힌트 생성 중 오류가 발생했습니다: {e}")

@app.post("/api/compose-prompt/", response_model=ComposePromptResponse)
async def compose_prompt_from_layers(request: ComposePromptRequest):
    if not OPENAI_API_KEY:
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
        gpt_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_content}],
            response_format={"type": "json_object"},
            max_tokens=400
        )
        response_data = json.loads(gpt_response.choices[0].message.content)
        
        return ComposePromptResponse(
            dalle_prompt=response_data.get("dalle_prompt", "Error: Failed to generate DALL-E prompt."),
            korean_description=response_data.get("korean_description", "오류: 한글 설명을 생성하지 못했습니다.")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프롬프트 조합 오류: {e}")

@app.post("/api/generate-merch-mockup/", response_model=MerchMockupResponse)
async def generate_merch_mockup(request: MerchMockupRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        system_prompt = """
        You create a realistic product mockup prompt for DALL-E 3.
        Return ONLY a JSON object: { "prompt": "..." }
        Rules:
        - English only.
        - Describe a clean studio product photo.
        - The design must appear printed on the product.
        - Preserve the design exactly as provided (no changes, no additions).
        - Keep the original product composition and angle as in standard catalog mockups.
        - Print the design flat, centered, and undistorted.
        - Avoid extra props or background elements.
        """
        product = request.product.lower()
        product_desc = "a white t-shirt" if product == "tshirt" else "a plain white mug"
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": f"Product: {product_desc}"},
                    {"type": "image_url", "image_url": {"url": request.design_url}},
                    {"type": "text", "text": "Use the design as the print artwork. Centered on the front."}
                ]}
            ],
            response_format={"type": "json_object"},
            max_tokens=200
        )
        content = completion.choices[0].message.content
        if not content:
            raise ValueError("Empty response content.")
        data = json.loads(content)
        prompt_used = data.get("prompt")
        if not prompt_used:
            raise ValueError("Prompt generation failed.")
        image_response = client.images.generate(
            model="dall-e-3",
            prompt=prompt_used,
            size="1024x1024",
            quality="standard",
            n=1
        )
        return MerchMockupResponse(image_url=image_response.data[0].url, prompt_used=prompt_used)
    except Exception as e:
        logger.exception("Merch mockup failed")
        raise HTTPException(status_code=500, detail=f"굿즈 목업 생성 오류: {e}")

@app.post("/api/emoji-quiz/", response_model=EmojiQuizResponse)
async def generate_emoji_quiz(request: EmojiQuizRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        topics = ["Fantasy", "Space", "Ocean", "Jungle", "City", "School", "Food"]
        topic = request.topic.strip() if request.topic else random.choice(topics)
        system_prompt = """
        You create emoji translation quizzes for young kids.
        Make them clear and unambiguous, using only the necessary emojis.
        Return ONLY a valid JSON object with this shape:
        {
          "questions": [
            {
              "emojis": "🦁 👑 🌅",
              "options": ["...", "...", "...", "..."],
              "correctIndex": 1,
              "explanation": "Korean explanation"
            }
          ]
        }
        Rules:
        - Exactly 3 questions.
        - options must be 4 Korean strings.
        - correctIndex is 0-3.
        - explanation in Korean, 2-3 sentences, friendly and detailed (middle school level).
        - Do NOT include any emojis in options or explanations.
        - Use everyday, kid-friendly words (초등학생 수준).
        - Use only the minimum emojis needed for a clear, specific scene (no filler emojis).
        - Each option should be short (10-20 characters) and clearly distinct.
        - Avoid riddles, puns, or cultural references.
        - The correct option must be fully inferable from the emojis alone.
        - Do NOT add extra hints, names, or context outside the emojis.
        - Do NOT use the Lion King example.
        """
        user_prompt = f'Create 3 fun emoji translation quizzes about "{topic}".'
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        response_data = json.loads(completion.choices[0].message.content)
        questions = response_data.get("questions", [])
        if not questions:
            raise ValueError("Empty emoji quiz response.")
        return EmojiQuizResponse(questions=questions)
    except Exception as e:
        logger.exception("Emoji quiz failed")
        raise HTTPException(status_code=500, detail=f"이모지 퀴즈 생성 오류: {e}")

@app.post("/api/prompt-puzzle/", response_model=PromptPuzzleResponse)
async def generate_prompt_puzzle(request: PromptPuzzleRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        level_count = max(2, min(request.level_count or 2, 5))
        system_prompt = """
        You design prompt puzzle levels for kids.
        Return ONLY a valid JSON object with this shape but don't use this:
        {
          "levels": [
            {
              "theme": "동물",
              "prompt_kr": "숲속에서 작은 토끼가 뛰고 있는 장면",
              "correctBlocks": ["subject", "action", "location"],
              "slots": ["주어 (Subject)", "행동 (Action)", "장소 (Location)"],
              "availableBlocks": [
                {"text": "...", "type": "subject"},
                {"text": "...", "type": "subject"},
                {"text": "...", "type": "action"},
                {"text": "...", "type": "action"},
                {"text": "...", "type": "location"},
                {"text": "...", "type": "location"}
              ]
            }
          ]
        }
        Rules:
        - Exactly {{level_count}} levels.
        - All text in Korean.
        - Each level must have a different theme from this list: 동물, 우주, 도시, 바다, 학교, 숲, 음식.
        - Include a "theme" field per level.
        - Include a "prompt_kr" full sentence per level.
        - availableBlocks must contain exactly 2 per type.
        - correctBlocks must be the exact text strings from availableBlocks (not labels like "subject").
        - correctBlocks must match one block from each type and must be extracted from prompt_kr.
        - availableBlocks must include the correct blocks plus one distractor per type.
        - Do not reuse the same block text across levels.
        """
        user_prompt = f"Create {level_count} levels with different themes and unique blocks."
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt.replace("{{level_count}}", str(level_count))},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        response_data = json.loads(completion.choices[0].message.content)
        levels = response_data.get("levels", [])
        if not levels:
            raise ValueError("Empty prompt puzzle response.")
        for level in levels:
            prompt_kr = level.get("prompt_kr", "")
            available = level.get("availableBlocks", [])
            def pick_block(block_type: str) -> str:
                for block in available:
                    if block.get("type") == block_type and block.get("text") and block["text"] in prompt_kr:
                        return block["text"]
                for block in available:
                    if block.get("type") == block_type and block.get("text"):
                        return block["text"]
                return ""
            subject = pick_block("subject")
            action = pick_block("action")
            location = pick_block("location")
            if subject and action and location:
                level["correctBlocks"] = [subject, action, location]
        return PromptPuzzleResponse(levels=levels)
    except Exception as e:
        logger.exception("Prompt puzzle failed")
        raise HTTPException(status_code=500, detail=f"프롬프트 탐정 생성 오류: {e}")

@app.post("/api/prompt-puzzle-image/", response_model=PromptPuzzleImageResponse)
async def generate_prompt_puzzle_image(request: PromptPuzzleImageRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
    try:
        system_prompt = """
        You create a strict DALL-E 3 prompt for a kids' illustration.
        Only include the given subject, action, and location. Do NOT add extra objects or context.
        Return ONLY a JSON object: { "prompt": "..." }
        Rules:
        - Must be English.
        - Start with: "A simple, clean, cute children's book illustration of..."
        - Include subject, action, and location explicitly.
        - Plain white background unless location implies a simple setting.
        - No extra characters, props, or scenery.
        """
        user_prompt = f'Korean prompt: "{request.prompt_kr}" | Subject: "{request.subject}" | Action: "{request.action}" | Location: "{request.location}"'
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
            response_format={"type": "json_object"},
            max_tokens=120
        )
        response_data = json.loads(completion.choices[0].message.content)
        prompt_used = response_data.get("prompt")
        if not prompt_used:
            raise ValueError("Prompt refine failed.")
        image_response = client.images.generate(
            model="dall-e-3",
            prompt=prompt_used,
            size="1024x1024",
            quality="standard",
            n=1
        )
        return PromptPuzzleImageResponse(
            image_url=image_response.data[0].url,
            prompt_used=prompt_used,
            prompt_used_kr=request.prompt_kr
        )
    except Exception as e:
        logger.exception("Prompt puzzle image failed")
        raise HTTPException(status_code=500, detail=f"프롬프트 탐정 이미지 오류: {e}")
