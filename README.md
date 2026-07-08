# 두근두근 뽑기

다트, 룰렛 등 다양한 방식으로 당첨자를 뽑는 재미있는 웹사이트. Next.js(App Router) + TypeScript + Tailwind CSS.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속.

## 배포 (Vercel)

이 코드는 Vercel 배포 기준으로 만들어졌지만, GitHub/Vercel 계정 연동은 사용자 본인 계정으로 직접 진행해야 하는 단계입니다.

1. GitHub에 새 레포지토리를 만들고 이 폴더를 push
   ```bash
   git init
   git add .
   git commit -m "init: 두근두근 뽑기 MVP"
   git branch -M main
   git remote add origin <레포 URL>
   git push -u origin main
   ```
2. https://vercel.com 접속 → GitHub 계정 연동 → 방금 만든 레포 Import
3. Framework Preset은 Next.js가 자동 감지되므로 별도 설정 없이 Deploy
4. 배포 완료 후 발급되는 `*.vercel.app` URL로 바로 확인 가능. 커스텀 도메인은 프로젝트 Settings → Domains에서 연결

## 폴더 구조

```
app/
  page.tsx              → 게임 선택 랜딩 페이지
  games/dart/page.tsx   → 다트 뽑기 게임
components/
  ParticipantInput.tsx  → 참가자 이름 입력 (공용)
  WinnerModal.tsx        → 당첨자 발표 모달 + 컨페티 (공용)
lib/
  drawEngine.ts          → 당첨자 결정 로직 (공용, 연출과 분리)
```

## 구현 현황

- [x] Phase 0: 프로젝트 셋업
- [x] Phase 1: 공용 인프라 (참가자 입력 / 랜덤 엔진 / 당첨 모달)
- [x] Phase 2: 다트 뽑기 — "먼 과녁판" 컨셉, 명중 후 줌인 리빌
- [ ] Phase 3: 룰렛 뽑기
- [ ] Phase 4: 폴리싱 (사운드 이펙트, 결과 공유/캡처, 뽑기 히스토리)
- [ ] Phase 5: QA & 프로덕션 배포

## 다트 게임 현재 구현 수준 / 다음 다듬을 부분

- 지금은 "다트 던지기" 버튼 클릭으로 즉시 발사되는 방식. 계획서에 있던 "드래그로 조준 → 당기기 → 발사" 인터랙션은 아직 없음 (연출 몰입도를 위해 다음 단계에서 추가 권장)
- 이름은 항상 사이드 명단에 노출, 과녁판에는 번호만 흐리게 표시 → 명중 시 해당 번호만 선명해지고 줌인됨
- 인원수가 많아질 때(예: 30명 이상) 라벨 겹침 여부는 아직 테스트 안 됨 — 실사용 전 확인 필요
- 효과음, 결과 공유 이미지 저장 기능 미구현 (Phase 4)
