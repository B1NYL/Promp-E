const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  async chatWithAI(messages) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/`, {
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

  async sharePost(prompt, imageUrl) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/`, {
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

  async getSharedPosts() {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/`);
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.error("API Error (getSharedPosts):", error);
      throw error;
    }
  },

  async suggestKeywords(subject) {
    try {
      const response = await fetch(`${API_BASE_URL}/suggest-keywords/`, {
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
  
  async generateImage(prompt, userImage = null) {
    try {
      const payload = {
        prompt: prompt,
        user_image: userImage || "none"
      };
      const response = await fetch(`${API_BASE_URL}/generate-image/`, {
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

  async generateHints(prompt) {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-hints/`, {
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
   * ★★★ 여러 레이어의 그림/텍스트를 조합하여 하나의 프롬프트를 생성하는 API ★★★
   * @param {Array<object>} layers - 각 레이어의 정보(name, type, data)를 담은 배열
   * @returns {Promise<object>} 조합된 프롬프트를 포함하는 Promise
   */
  async composePrompt(layers) {
    try {
      const response = await fetch(`${API_BASE_URL}/compose-prompt/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layers: layers }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      return response.json();
    } catch (error) {
      console.error("API Error (composePrompt):", error);
      throw error;
    }
  },
};