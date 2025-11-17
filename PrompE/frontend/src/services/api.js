// Vite 환경 변수에서 백엔드 API의 전체 URL을 가져옵니다.
// 예: https://promp-e.onrender.com/api
const API_FULL_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// API 경로를 제외한 순수 서버 주소를 추출합니다.
// 예: https://promp-e.onrender.com
const SERVER_URL = API_FULL_URL.replace('/api', '');

// 다른 파일에서 이미지 경로를 만들 때 사용할 수 있도록 서버 주소를 export 합니다.
export const BACKEND_URL = SERVER_URL;

/**
 * 모든 API 요청을 관리하는 객체
 */
export const api = {
  /**
   * ChatGPT와 대화하는 API
   * @param {Array<object>} messages - 전체 대화 기록 배열
   */
  async chatWithAI(messages) {
    try {
      const response = await fetch(`${API_FULL_URL}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.error("API Error (chatWithAI):", error);
      throw error;
    }
  },

  /**
   * 프롬프트와 이미지 URL을 공유(게시)하는 API
   * @param {string} prompt - 사용자가 작성한 프롬프트
   * @param {string} imageUrl - DALL-E가 생성한 이미지의 URL
   */
  async sharePost(prompt, imageUrl) {
    try {
      const response = await fetch(`${API_FULL_URL}/posts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt, image_url: imageUrl }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.error("API Error (sharePost):", error);
      throw error;
    }
  },

  /**
   * 모든 공유된 게시글 목록을 가져오는 API
   */
  async getSharedPosts() {
    try {
      const response = await fetch(`${API_FULL_URL}/posts/`);
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.error("API Error (getSharedPosts):", error);
      throw error;
    }
  },

  /**
   * 주제에 맞는 키워드 추천을 요청하는 API
   * @param {string} subject - 주인공 이름
   */
  async suggestKeywords(subject) {
    try {
      const response = await fetch(`${API_FULL_URL}/suggest-keywords/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.error("API Error (suggestKeywords):", error);
      throw error;
    }
  },
  
  /**
   * 프롬프트와 사용자 그림으로 이미지를 생성하는 API
   * @param {string} prompt - 최종 완성된 프롬프트
   * @param {string | null} userImage - 사용자가 그린 그림의 base64 데이터 또는 null
   */
  async generateImage(prompt, userImage = null) {
    try {
      const payload = {
        prompt: prompt,
        user_image: userImage || "none"
      };
      const response = await fetch(`${API_FULL_URL}/generate-image/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.error("API Error (generateImage):", error);
      throw error;
    }
  },

  /**
   * 프롬프트 기반으로 힌트를 생성하는 API
   */
  async generateHints(prompt) {
    try {
      const response = await fetch(`${API_FULL_URL}/generate-hints/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.error("API Error (generateHints):", error);
      throw error;
    }
  },

  /**
   * 임시 이미지 URL을 우리 서버에 저장하고 영구 URL을 받아오는 API
   * @param {string} tempUrl - DALL-E가 생성한 임시 URL
   */
  async saveImage(tempUrl) {
    try {
      const response = await fetch(`${API_FULL_URL}/save-image/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_url: tempUrl }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.error("API Error (saveImage):", error);
      throw error;
    }
  },

  // [추가됨] 404 에러 해결을 위해 누락된 함수 추가
  /**
   * 여러 레이어(이미지, 텍스트)를 조합하여 프롬프트를 생성하는 API
   * @param {Array<object>} layers - 사용자가 추가한 레이어 데이터 배열
   */
  async composePrompt(layers) {
    try {
      const response = await fetch(`${API_FULL_URL}/compose-prompt/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layers: layers }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error("API Error (composePrompt):", error);
      throw error;
    }
  },
};