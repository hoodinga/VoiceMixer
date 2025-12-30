# 🎵 PITCH MIXER

**AI Voice Melody Mixer** - 당신의 목소리를 좋아하는 음악의 멜로디에 맞춰 변환해주는 웹 애플리케이션입니다.

![Pitch Mixer Preview](https://img.shields.io/badge/Status-Beta-purple)
![License-MIT](https://img.shields.io/badge/License-MIT-blue)

## 🚀 프로젝트 개요

**Pitch Mixer**는 사용자가 업로드한 목소리 샘플을 분석하여, 선택한 배경음악의 멜로디에 맞게 실시간으로 음높이(Pitch)를 조정하고 합성해주는 도구입니다. 복잡한 오디오 편집 지식 없이도 누구나 손쉽게 "AI 커버"와 같은 결과물을 만들어낼 수 있습니다.

## ✨ 주요 기능

- 🎼 **자동 멜로디 추출**: 배경음악에서 주가 되는 멜로디 라인을 인공지능 알고리즘으로 분석합니다.
- 🎤 **피치 매칭 시스템**: 업로드된 음성 샘플의 음높이를 추출된 멜로디에 맞춰 세밀하게 변환합니다.
- 🔁 **스마트 루핑**: 음성 샘플이 음악보다 짧을 경우, 자연스럽게 반복(Loop)하여 전체 구간을 채웁니다.
- 🎚️ **정밀 믹싱 컨트롤**: 원본 배경음악과 변환된 목소리의 볼륨을 개별적으로 조절하여 완벽한 밸런스를 찾을 수 있습니다.
- 💾 **웹 기반 처리**: 별도의 서버 업로드 없이 브라우저 내에서 직접 오디오를 처리하여 빠르고 안전합니다.

## 🛠 기술 스택

- **Core**: React 19, Vite
- **Audio Processing**: 
  - [Tone.js](https://tonejs.github.io/): 고성능 웹 오디오 분석 및 합성
  - [Soundtouch.js](https://github.com/jakubfiala/soundtouchjs): 시간 연신(Time Stretching) 및 피치 시프팅
  - Custom PSOLA (Pitch Synchronous Overlap and Add) 알고리즘
- **AI Integration**: [Hugging Face Spaces](https://huggingface.co/spaces) & RVC (Retrieval-based Voice Conversion) 연동 지원
- **Styling**: Vanilla CSS (Modern Holographic & Cyberpunk Design)

## 📖 사용 방법

1. **음악 파일 업로드**: 멜로디의 기반이 될 배경음악(MP3, WAV 등)을 선택합니다.
2. **보이스 샘플 업로드**: 변환하고자 하는 본인 또는 타인의 목소리 샘플을 업로드합니다. (2~10초 권장)
3. **볼륨 조절**: 배경음악과 목소리의 비율을 슬라이더로 조정합니다.
4. **PITCH MIX 시작**: 버튼을 누르면 브라우저가 오디오 분석 및 변환을 시작합니다.
5. **결과 확인 및 저장**: 완료된 오디오를 재생해보고 마음에 들면 다운로드합니다.

## � 실행 방법 (How to Run)

프로젝트를 로컬에서 실행하고 테스트하는 방법입니다.

### 1. 개발 서버 실행
```bash
# 프로젝트 폴더로 이동
cd pitchmixer-app

# 필요한 패키지 설치 (최초 1회)
npm install

# 로컬 개발 서버 시작
npm run dev
```

### 2. 브라우저 접속
터미널에 표시된 Local 주소(기본적으로 `http://localhost:5173`)를 클릭하여 애플리케이션을 엽니다.

### 3. 프로덕션 빌드 (선택 사항)
실제 배포용 파일을 생성하려면 다음 명령어를 사용하세요.
```bash
npm run build
```


## 📄 라이선스

이 프로젝트는 MIT 라이선스에 따라 라이선스가 부여됩니다.

---
Created with ❤️ by **Antigravity AI**