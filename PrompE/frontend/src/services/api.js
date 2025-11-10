// 백엔드 서버의 기본 주소
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * 모든 API 요청을 관리하는 객체
 */
export const api = {
  /**
   * ChatGPT와 대화하는 API
   * @param {Array<object>} messages - 전체 대화 기록 배열
   * @returns {Promise<object>} AI의 응답을 포함하는 Promise 객체
   */
  async chatWithAI(messages) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messages }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("API Error (chatWithAI):", error);
      throw error;
    }
  },

  /**
   * 프롬프트와 이미지를 공유(게시)하는 API
   * @param {string} prompt - 사용자가 작성한 프롬프트
   * @param {File} imageFile - AI가 생성한 이미지 파일
   * @returns {Promise<object>} 생성된 게시글 정보를 포함하는 Promise 객체
   */
  async sharePost(prompt, imageFile) {
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('image', imageFile);

      const response = await fetch(`${API_BASE_URL}/posts/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("API Error (sharePost):", error);
      throw error;
    }
  },

  /**
   * 모든 공유된 게시글 목록을 가져오는 API
   * @returns {Promise<Array<object>>} 게시글 목록 배열을 포함하는 Promise 객체
   */
  async getSharedPosts() {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/`);

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("API Error (getSharedPosts):", error);
      throw error;
    }
  },
};