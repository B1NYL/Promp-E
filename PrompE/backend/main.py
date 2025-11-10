from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from pydantic import BaseModel
import shutil
import os
from typing import List, Dict
import openai
from dotenv import load_dotenv

# --- .env 파일에서 환경 변수 로드 ---
load_dotenv()

# --- OpenAI API 키 설정 ---
openai.api_key = os.getenv("OPENAI_API_KEY")

# --- 1. 데이터베이스 설정 ---
DATABASE_URL = "sqlite:///./prompe.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. SQLAlchemy 모델 (데이터베이스 테이블 설계) ---
class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(String, index=True)
    image_url = Column(String)

# --- 3. Pydantic 모델 (API 데이터 형식 검증) ---
class PostCreate(BaseModel):
    prompt: str

class PostRead(BaseModel):
    id: int
    prompt: str
    image_url: str

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

class ChatResponse(BaseModel):
    reply: str

# --- 4. FastAPI 앱 생성 및 설정 ---
app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

Base.metadata.create_all(bind=engine)

# --- 5. 데이터베이스 의존성 ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 6. API 엔드포인트 구현 ---

@app.get("/")
def read_root():
    return {"message": "PrompE Backend is running!"}

@app.post("/api/posts/", response_model=PostRead)
async def create_post(
    prompt: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_location = f"uploads/{image.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    image_url = f"/{file_location}"
    db_post = Post(prompt=prompt, image_url=image_url)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.get("/api/posts/", response_model=List[PostRead])
async def read_posts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    posts = db.query(Post).offset(skip).limit(limit).all()
    return posts

@app.post("/api/chat/", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
        
    try:
        messages_to_send = [
            {"role": "system", "content": "You are a helpful and friendly assistant for teaching kids about AI and prompts in Korean."},
            *request.messages
        ]
        
        completion = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages_to_send
        )
        reply = completion.choices[0].message.content
        return ChatResponse(reply=reply)
    except openai.APIConnectionError as e:
        print(f"OpenAI API 연결 오류: {e.__cause__}")
        raise HTTPException(status_code=503, detail="OpenAI 서버에 연결할 수 없습니다.")
    except openai.RateLimitError as e:
        print(f"OpenAI API 사용량 제한 오류: {e}")
        raise HTTPException(status_code=429, detail="API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.")
    except openai.APIStatusError as e:
        print(f"OpenAI API 상태 오류: {e.status_code}, {e.response}")
        raise HTTPException(status_code=e.status_code, detail="OpenAI API에서 오류가 발생했습니다.")
    except Exception as e:
        print(f"알 수 없는 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))