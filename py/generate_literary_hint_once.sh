# 1. API Key 환경변수 세팅
export GEMINI_API_KEY="AIzaSyAo2XJhMUU0yIa5ZdcOdVAZgNN8YbGxf0M"

# 2. JSON 데이터 추출
TILES=$(node -e "const q=require('./js/data/quiz_20260910.json'); console.log(q.waitText);")
EXP=$(node -e "const q=require('./js/data/quiz_20260910.json'); console.log(q.explanation);")

# 3. 제미나이 소설 생성 스크립트 실행
python3 py/generate_literary_hint.py \
  --tiles "$TILES" \
  --explanation "$EXP" \
  --output "js/data/story_20260910.json"

