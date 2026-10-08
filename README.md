# toolsBox

브라우저에서 바로 쓰는 작은 도구 모음입니다. 빌드 과정 없이 HTML/CSS/JS만으로 동작합니다.

## 도구

| 폴더 | 설명 |
| --- | --- |
| [`calendar-wallpaper/`](./calendar-wallpaper/) | 달력 배경화면 생성기. 배경 생성, 달력 배치, 일정 표시를 하고 PNG/SVG로 저장 |

## 달력 배경화면 (`calendar-wallpaper/`)

```
calendar-wallpaper/
├── index.html   마크업
├── style.css    스타일 (:root 색상 토큰)
└── app.js       상태 관리, 캔버스 그리기, 내보내기
```

- `index.html`을 브라우저로 열면 바로 동작합니다. 경로가 모두 상대경로라 GitHub Pages나 다른 사이트의 하위 폴더에 그대로 넣어도 됩니다.
- `app.js`는 즉시 실행 함수로 감싸서 전역 변수를 만들지 않습니다.
- 웹폰트(Google Fonts, Pretendard, G마켓 산스)는 CDN에서 불러옵니다.
- 링크 복사를 누르면 현재 설정이 URL `#` 뒤에 저장됩니다. 업로드한 사진은 링크에 포함되지 않습니다.
