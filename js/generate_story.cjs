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

async function generateStory() {
  try {
    // 1. 날짜 처리 (YYYY-MM-DD 또는 YYYYMMDD 입력 대응)
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

    // 2. 해당 날짜의 퀴즈 JSON 읽기
    const quizPath = path.join(__dirname, 'data', `quiz_${dateKey}.json`);
    if (!fs.existsSync(quizPath)) {
      throw new Error(`퀴즈 파일이 존재하지 않습니다: ${quizPath}`);
    }
    const quizData = JSON.parse(fs.readFileSync(quizPath, 'utf-8'));

    // 3. Gemini 모델 인스턴스 생성 (API 버전을 v1beta로 지정)
    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-3.6-flash',
        generationConfig: { responseMimeType: 'application/json' }
      },
      { apiVersion: 'v1beta' }
    );

    const suitUnit = quizData.suitUnit || '만';
    const suitName = quizData.suitName || '만수패';

    // 4. 프롬프트 구성
    const prompt = `
당신은 마작 패의 형태와 오름패(대기패)의 대기 형태를 바탕으로 창의적이고 잔잔한 단편 소설/에세이를 작성하는 작가입니다.

[퀴즈 정보]
- 수패 종류: ${suitName}
- 손패 숫자 목록: ${quizData.tiles.join(', ')}${suitUnit}
- 대기패 목록: ${quizData.waitArray.join(', ')}${suitUnit}

[작성 지침]
1. 손패의 구성과 대기패의 의미(예: 대기패 숫자, 대기 매수 등)를 은유적으로 녹여낸 감성적인 단편 스토리를 작성하세요.
2. 이야기 소재나 은유 표현 시 '${suitName}(${suitUnit})'의 이미지(예: 동그란 점들의 동요=통수패, 대나무와 바람=삭수패, 묵직한 서사=만수패 등)를 적극 반영해 주세요.
3. 마작 용어를 직접 나열하기보다 흐름과 숫자가 주는 느낌을 풀어 서술하세요.
4. 가능한 비유를 이용해 주세요. 4마리의 용, 2그루의 푸른 나무, 9개의 별처럼 마작패 같은 느낌을 살짝 주면 좋겠습니다.
5. 반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "📖 제목",
  "content": "작품 본문 내용..."
}
`;

    // 5. 스토리 생성 요청
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const storyJson = JSON.parse(responseText);

    // 6. js/data/story_YYYYMMDD.json 에 저장
    const outputPath = path.join(__dirname, 'data', `story_${dateKey}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(storyJson, null, 2), 'utf-8');

    console.log(`Successfully generated story: ${outputPath}`);
    console.log(`Title: ${storyJson.title}`);
  } catch (error) {
    console.error('Error generating story:', error);
    process.exit(1);
  }
}

generateStory();
