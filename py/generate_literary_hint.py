import os
import json
import argparse
from google import genai
from google.genai import types

import warnings
warnings.filterwarnings("ignore", category=UserWarning)

def generate_hint_story(waiting_tiles_info: str, explanation: str) -> dict:
    # 1. API 키 검증
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.")

    client = genai.Client(api_key=api_key)

    # 2. 메타 프롬프트 구성
    system_instruction = """
너는 마작 퀴즈 해설을 바탕으로 은유적인 문학 작품(소설, 수필, 시 중 택 1)을 창작하는 문학 작가이다.
너의 임무는 입력으로 주어진 '대기패 정보'와 '해설'의 핵심 논리를 은밀하고 아름다운 문학적 복선으로 녹여내는 것이다.

[작성 지침]
1. 장르 선택: 소설, 수필, 시 중 하나를 랜덤하게 선택하여 작성하라.
2. 정답 직접 언급 금지: 특정 수패의 숫자(예: 3, 6, 9)나 '만수', '통수', '삭수' 등 마작 용어를 직접 언급하는 것을 엄격히 금지한다.
3. 은유적 힌트 포함: 
   - 대기 면수(예: 3면대기 -> 세 갈래 길, 세 자매, 세 계절 등)
   - 형태적 특징(예: 양면대기 -> 두 문이 열린 방, 머리가 필요한 형태 -> 짝을 기다리는 마음 등)
   - 해설의 핵심 논리를 사건, 풍경, 감정 상태 등으로 자연스럽게 치환하라.
4. 분량: 한 페이지 분량 (시의 경우 4~5연, 소설/수필의 경우 500~800자 내외).
5. 결과 형태: 반드시 JSON 형식으로 반환할 것.
"""

    prompt = f"""
다음 퀴즈 정보를 바탕으로 은유적 문학 작품을 생성해 주세요.

[입력 정보]
- 대기패 정보: {waiting_tiles_info}
- 해설: {explanation}

[출력 요구사항]
- genre: 선택한 장르 (소설 / 수필 / 시 중 하나)
- title: 작품 제목
- content: 문학 작품 본문
"""

    # 3. Gemini API 호출 (Structured Output 설정)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.8,
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "genre": {"type": "STRING", "description": "소설, 수필, 시 중 선택된 장르"},
                    "title": {"type": "STRING", "description": "작품 제목"},
                    "content": {"type": "STRING", "description": "문학 작품 본문"}
                },
                "required": ["genre", "title", "content"]
            }
        )
    )

    return json.loads(response.text)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gemini API를 이용한 퀴즈 연계 문학 작품 생성")
    parser.add_argument("--tiles", required=True, help="대기패 정보 (예: '3, 6, 9만 3면대기')")
    parser.add_argument("--explanation", required=True, help="퀴즈 해설 내용")
    parser.add_argument("--output", default="literary_hint.json", help="출력 JSON 파일 경로")
    
    args = parser.parse_args()

    result = generate_hint_story(args.tiles, args.explanation)
    
    # 결과를 파일로 저장
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"문학 작품 생성 완료: {result['genre']} - '{result['title']}'")

