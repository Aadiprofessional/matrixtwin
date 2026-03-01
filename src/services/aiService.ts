// AI Service for handling external AI API calls

const DASHSCOPE_API_KEY = process.env.REACT_APP_DASHSCOPE_API_KEY || 'sk-9f7b91a0bb81406b9da7ff884ddd2592';
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export const aiService = {
  generateFormContent: async (messages: any[], model: string = "qwen-vl-plus"): Promise<string> => {
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: false,
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`AI Service Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
};
