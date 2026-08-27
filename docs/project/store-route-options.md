# 등급 증빙 스토어 경로 비교

updated: 2026-08-28 / status: Microsoft Store PWA 최종 선택

## 결론

가장 빠르고 현실적인 경로는 `심봤다`의 동일 게임 버전을 Microsoft Store에 PWA 게임으로 공개하고, 그 공개 URL과 IARC 자체등급분류 정보를 Apps in Toss에 제출하는 것이다.

## 비교

| 경로 | 최소 대기·심사 | 추가 개발 | 판단 |
|---|---|---|---|
| 현재 Google Play 개인 계정 | 12명 14일 연속 비공개 테스트 후 프로덕션 액세스 심사 일반 7일 이내 | Android 패키징 필요 | 일정상 후순위. 테스트 외주도 14일을 줄이지 못함 |
| Google 조직 계정 전환 | 사업자 등록 외 D-U-N-S와 계정 검증 필요. D-U-N-S 신규 발급은 최대 30일 | Android 패키징 필요 | 긴급 우회로로 부적합 |
| 게임물관리위원회 직접 심의 | Apps in Toss 공식 안내상 보통 10~15일 | 설명서·실행물·영상·수수료 준비 | 확실하지만 Microsoft Store보다 느릴 가능성이 큼 |
| ONEstore | 개인·무료, 자체등급분류 가능 | Android APK/AAB 포장과 모바일 검증 필요 | 후보이나 현재 웹 코드 기준 개발·심사 예측성이 낮음 |
| Microsoft Store PWA | 개인 계정 무료, 제출 인증 최대 3영업일 | 웹 배포 대상 분리, PWA manifest·service worker·HTTPS 호스팅 | **추천** |
| Apple App Store | 연 99달러와 Apple 개발 환경·심사 필요 | iOS 포장과 검증 필요 | 현재 장비·일정에 부적합 |

## Microsoft Store 경로가 맞는 이유

- Apps in Toss는 Microsoft Store에 실제 출시된 동일 게임 URL을 등급 증빙 경로로 인정한다.
- Microsoft는 웹 기술 앱에 PWA를 가장 빠른 Store 경로로 안내하며, PWA 게임 등록과 IARC 연령 등급 설문을 지원한다.
- 개인 개발자 신규 가입은 무료이며 정부 발급 신분증·셀피 인증을 사용한다.
- 제출 후 인증은 최대 3영업일로 안내되며, 통과 후 평균 약 15분 내 스토어에 표시된다.
- 현재 앱의 핵심 게임·UI는 그대로 재사용할 수 있다. Toss 전용 저장·파일·공유 호출만 플랫폼 어댑터로 분리하고 웹 대체 기능을 연결하면 된다.

## 필요한 작업

### 준비 상태

1. 전용 개발자 계정으로 Partner Center 개인 개발자 등록과 검증을 완료했다.
2. `Apps & Games → 새 제품 → MSIX 또는 PWA 게임`에서 `심봤다` 제품을 생성했다.
3. 제품 식별자는 Git 제외 로컬 파일에 보관하고 공개 저장소에는 원문을 남기지 않는다.

### Microsoft 예약 이름과 식별자 구분

- 예약 이름: Microsoft Store 목록에서 고객에게 보이는 제품명이다. 이 프로젝트의 입력값은 `심봤다`다.
- `sim-bwatta`: Apps in Toss의 변경 불가 appName이며 Microsoft 예약 이름이 아니다.
- `com.double_b.sim_bwatta`: Google Play의 Android 패키지 이름이며 Microsoft 예약 이름이 아니다.
- Microsoft 패키지 ID·Publisher ID·Store ID: 제품명 예약 뒤 Partner Center의 `Product identity`에서 자동 생성·확인한다. PWABuilder 포장 단계에는 이 값을 사용한다.

### 계정 보안 원칙

- 개발자 소유 계정과 공개 고객문의 연락처의 역할을 분리한다.
- 소유 계정에는 2단계 인증과 복구 수단을 설정한다.
- 로그인 주소, 복구 정보, 신원 인증 자료와 계정 생성 장애 기록은 공개 저장소에 남기지 않는다.
- `Publisher display name`과 국가/지역은 장기 사용 값을 선택하고 앱 이름과 퍼블리셔명을 구분한다.

### Microsoft 계정·Partner Center 진행 상태

- 전용 개발자 계정으로 개인 Windows Store 개발자 등록과 검증을 완료했다.
- Publisher display name은 `double-B Std.`로 유지한다. Apps in Toss 콘솔도 소문자 표기이며, Microsoft에서 `Double-B Std.`를 사용할 수 없어 Google Play의 `Double-B Std.` 정정은 출시 후로 보류했다.
- 두 스토어의 Publisher display name 대소문자 일치는 브랜드 일관성 문제이며 Microsoft Store 등급 증빙의 필수 조건은 아니다. 현재 등급 증빙에는 Microsoft Store의 실제 표기 `double-B Std.`를 그대로 사용한다.
- Partner Center `Apps & Games`에서 `New product → MSIX or PWA game`으로 `심봤다`를 예약했고, 제품 개요의 `게임 / 초안` 상태와 `제품 ID 보기` 메뉴를 확인했다.
- `제품 ID 보기`의 패키지·Publisher·Store 식별자를 확보해 Git 제외 로컬 파일에 기록했다. 원문은 공개 문서에 기록하지 않는다.
- 동일 게임 `web-pwa` 구현과 로컬 검증을 완료했다. 다음 체크포인트는 GitHub Pages HTTPS URL 확보와 해당 URL을 사용한 PWABuilder Store 패키지 생성이다.

### 계정 진입 확인 후 개발 작업

1. [완료] 빌드 대상을 `toss`와 `web-pwa`로 분리한다.
2. [완료] Storage는 웹에서 `localStorage`, 이미지 저장은 브라우저 다운로드, 공유는 Web Share 또는 클립보드로 대체한다.
3. [완료] Toss Analytics·익명 사용자 키는 Microsoft판에서 no-op으로 처리한다.
4. [진행] PWA manifest, service worker, Store용 아이콘과 GitHub Pages workflow를 추가했다. workflow 실행 후 HTTPS 공개 URL을 확인한다.
5. 동일 핵심 플레이·명칭·콘텐츠·화면을 유지해 PWABuilder로 Store 패키지를 만든다.
6. Partner Center에서 IARC 설문·스토어 정보·패키지를 제출한다.
7. 공개 URL과 IARC/게임물관리위원회 조회값을 Apps in Toss 콘솔에 입력한다.

## 남은 불확실성

- Microsoft 개인 계정 신원 인증이 자동 완료되지 않을 경우 시간이 늘어날 수 있다.
- Microsoft Store 공개 후 자체등급분류 정보가 게임물관리위원회 조회에 반영되는 시간은 공식 예상치가 없다.
- Apps in Toss에는 Microsoft Store URL이 공식 지원되지만, 조회 반영 전 입력 처리 방식은 채널톡으로 확인한다.

## 공식 근거

- Apps in Toss 게임 등급분류: https://toss.im/apps-in-toss/blog/game_rating_classification
- Apps in Toss 콘솔 등록: https://developers-apps-in-toss.toss.im/prepare/console-workspace.html
- Microsoft 개인 개발자 계정: https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account?tabs=individual
- Microsoft PWA 배포 경로: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/choose-distribution-path
- Microsoft Store 제출·인증: https://learn.microsoft.com/en-us/windows/apps/publish/get-started
- Google Play 신규 개인 계정 테스트: https://support.google.com/googleplay/android-developer/answer/14151465
- Google Play 조직 계정 D-U-N-S: https://support.google.com/googleplay/android-developer/answer/13628312
