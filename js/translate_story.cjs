// translate_story.cjs
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 환경변수에서 Gemini API 키 로드
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// 대기(sleep) 헬퍼 함수
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 재시도 로직이 포함된 Gemini 호출 함수
async function generateContentWithRetry(model, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      const isRetryable = error.status === 503 || error.status === 429 || error.message?.includes('503');
      
      if (isRetryable && attempt < maxRetries) {
        const waitTime = attempt * 3000;
        console.warn(`[Gemini API] 일시적 오류 발생 (${error.status || '503'}). ${attempt}/${maxRetries} 재시도 중... (${waitTime / 1000}초 후 시도)`);
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }
}

async function translateStory() {
  try {
    // 1. 날짜 처리 (YYYY-MM-DD 또는 YYYYMMDD)
    const targetDateStr = process.argv[2];
    let year, month, day, dateKey;

    if (targetDateStr) {
      const cleanDate = targetDateStr.replace(/-/g, '');
      year = cleanDate.substring(0, 4);
      month = cleanDate.substring(4, 6);
      day = cleanDate.substring(6, 8);
      dateKey = cleanDate;
    } else {
      const targetDate = new Date();
      year = targetDate.getFullYear();
      month = String(targetDate.getMonth() + 1).padStart(2, '0');
      day = String(targetDate.getDate()).padStart(2, '0');
      dateKey = `${year}${month}${day}`;
    }

    // 2. 해당 날짜의 스토리 JSON 읽기
    const storyPath = path.join(__dirname, 'data', `story_${dateKey}.json`);
    if (!fs.existsSync(storyPath)) {
      throw new Error(`스토리 파일이 존재하지 않습니다: ${storyPath}`);
    }
    const storyData = JSON.parse(fs.readFileSync(storyPath, 'utf-8'));

    // 3. Gemini 모델 인스턴스 생성
    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-3.6-flash',
        generationConfig: { responseMimeType: 'application/json' }
      },
      { apiVersion: 'v1beta' }
    );

    // 4. 번역 프롬프트 구성 (한 번에 4개 언어 처리)
    const prompt = `
다음 단편 소설/에세이의 제목(title)과 본문(content)을 자연스럽게 4개 언어(일본어, 영어, 중국어 간체, 중국어 번체)로 번역해 주세요.

[원문]
제목: ${storyData.title}
본문:
${storyData.content}

[작성 지침]
1. 원문의 감성과 문맥, 은유적 표현을 살려서 각 언어별 문맥에 맞게 번역하세요.
2. 반드시 아래 구조의 JSON 형식으로만 응답해 주세요:
{
  "ja": { "title": "일본어 제목", "content": "일본어 본문" },
  "en": { "title": "영어 제목", "content": "영어 본문" },
  "zh_cn": { "title": "중국어 간체 제목", "content": "중국어 간체 본문" },
  "zh_tw": { "title": "중국어 번체 제목", "content": "중국어 번체 본문" }
}
`;

    // 5. 번역 요청
    console.log(`[Translate] Story translation started for ${dateKey}...`);
    const result = await generateContentWithRetry(model, prompt, 3);
    const translations = JSON.parse(result.response.text());

    // 6. 기존 story_YYYYMMDD.json 파일에 translations 필드 병합 및 업데이트
    const updatedStoryData = {
      ...storyData,
      translations: translations
    };

    fs.writeFileSync(storyPath, JSON.stringify(updatedStoryData, null, 2), 'utf-8');
    console.log(`Successfully translated and saved story: ${storyPath}`);
  } catch (error) {
    console.error('Error translating story:', error);
    process.exit(1);
  }
}

translateStory();
