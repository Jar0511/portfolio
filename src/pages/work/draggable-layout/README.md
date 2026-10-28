# Draggable layout

`page.tsx`는 `TitledSection`과 최상위 `Workspace`만 조합한다. 페이지 전용 모듈은 모두 이 디렉터리에 둔다.

| 영역                                       | 책임                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `workspace/index.tsx`                      | 공유 상태 소유, 기능 조합, 편집·녹화 상호 배제, RGL 연결 및 편집 단축키                      |
| `workspace/layout-state.ts`                | 기본 배치, 표시 위젯, 카메라 개수, 최대 30단계 Undo/Redo와 저장·취소를 처리하는 순수 reducer |
| `workspace/editor-toolbar.tsx`             | 편집 명령과 삭제된 위젯 복원 UI                                                              |
| `workspace/ui.tsx`                         | 페이지 내부에서 사용하는 Button과 RGL 호환 WidgetFrame                                       |
| `camera/index.tsx`, `wall.tsx`             | 카메라 개수 선택, 영상 선택, 실제 컨테이너 측정과 16:9 타일 표시                             |
| `camera/layout.ts`                         | 측정 크기에 맞는 카메라 행·열 및 타일 너비 계산                                              |
| `camera/controller.tsx`, `controls.ts`     | 프리셋 UI와 명령 처리, PTZ 시작·종료 및 키보드·포인터·포커스 생명주기                        |
| `camera/type.ts`                           | 카메라 프리셋 데이터 계약                                                                    |
| `recording/use-recording.ts`               | Workspace에서 실행하는 녹화 상태 전이와 타이머                                               |
| `recording/index.tsx`, `input-widgets.tsx` | 녹화 표시, 메모·북마크 입력 UI                                                               |
| `recording/title-dialog.tsx`, `format.ts`  | 종료 제목 다이얼로그의 DOM·포커스 처리와 시간 표시 함수                                      |
| `event-log/index.tsx`, `type.ts`           | 로그 표시·필터 UI 및 모든 기능이 공유하는 이벤트 계약                                        |
| `styles.css`                               | 페이지 색상 토큰, Container Queries, 녹화 애니메이션, RGL 오버라이드                         |

## 상태 유지 계약

- Workspace가 편집 상태, 선택 카메라, 피드백, 프리셋, 메모 초안, 이벤트 로그와 필터를 소유한다. 녹화 훅 역시 Workspace에서 실행하므로 위젯의 표시 여부와 수명이 독립적이다.
- CameraWall의 측정 크기와 컨트롤러의 진행 명령·마지막 명령·누름 표시·선택 슬롯은 하위 로컬 상태다. 위젯 삭제 또는 breakpoint 전환으로 언마운트되면 초기화된다. 진행 명령은 정리 함수에서 종료한다.
- 녹화 제목 다이얼로그는 그리드 밖에서 유지한다. 제목 전체 선택, Escape 시 기본 제목 처리, 종료 후 포커스 복원을 보존한다.
- 편집 취소는 배치·표시 위젯·카메라 개수를 복원한다. 로그·메모·프리셋까지 되돌리지 않는다. 새로고침 시 초기화되는 세션 저장 방식도 그대로다.

## RGL 생명주기 검토 및 별도 개선안 — 미적용

설치된 RGL 2.3.0은 내부에 레이아웃·드래그·리사이즈 상태를 보관한다. layout prop 변경은 effect에서 동기화하므로 일반적인 배치 전환에 React key가 반드시 필요한 것은 아니다. 다만 해당 effect는 드래그 중 동기화를 건너뛰며, 동기화 조건은 layout·자식·compactor 변경을 중심으로 판단한다.

현재 `key={cols}`는 8/6/4열 전환 때 내부 상태를 새 배치로 초기화하고 하위 PTZ의 종료 및 로컬 상태 초기화를 유도한다. 구조 리팩터링에서는 이 동작을 유지했다. 열 수 변경은 편집 액션을 dispatch하지 않으므로 Undo 이력에도 추가하지 않는다.

동일 인스턴스를 유지하면 카메라 재측정과 불필요한 하위 마운트를 줄일 수 있다. 별도 작업에서는 다음 조건을 만족한 뒤 key 제거를 검토할 수 있다.

1. 각 열 수의 `Workspace.layouts`를 기준으로 layout·cols 전환을 동기화한다. RGL의 `onLayoutChange`를 그대로 Undo 액션으로 연결하지 않는다.
2. 드래그·리사이즈 시작 시 열 수를 기록하고, 중간에 breakpoint가 바뀌면 작업을 종료하거나 이전 작업의 완료 콜백을 무시한다. 다른 열 수의 배치에 완료 결과가 기록되지 않아야 한다.
3. breakpoint 변경 시 PTZ 종료와 기존 로컬 상태 초기화를 명시적으로 수행한다. 이 동작을 바꾸고 싶다면 별도의 동작 변경으로 다룬다.
4. 8→6→4→8 전환, 전환 중 조작 종료, breakpoint별 Undo/Redo·저장·취소 회귀 테스트를 통과시킨다.

## 스타일

일반 UI는 Tailwind 유틸리티로 구현한다. 기존 전역 디자인 토큰과 페이지 토큰의 색상이 서로 달라 강제로 통합하지 않았다. 예를 들어 페이지 surface `#fafbf9`는 앱 background `#efefef`와 다르고, 페이지 line `#d6dcd6`도 form line `#012c23`과 다르다. 기존 테마별 색상을 유지하며 중복된 컴포넌트 CSS는 제거했다.

## 검증

저장소 루트에서 실행한다. 기존 reducer 테스트 5개를 이동하여 유지하고 breakpoint 이력과 카메라 배치 계산 테스트를 추가했다.

```sh
node node_modules/typescript/bin/tsc -b
node --test src/pages/work/draggable-layout/workspace/layout-state.test.mjs src/pages/work/draggable-layout/camera/layout.test.mjs
node node_modules/vite/bin/vite.js build
```

브라우저 회귀 테스트는 실행 중인 Vite 서버와 Playwright 설치가 필요하다. `PLAYWRIGHT_MODULE_PATH`로 기존 Playwright 모듈 위치를 지정할 수 있으며, `LAYOUT_TEST_URL`로 개발 서버 주소를 바꿀 수 있다. Playwright가 없으면 브라우저 테스트는 건너뛴다. 앱 의존성은 추가하지 않았다.

```sh
node --test src/pages/work/draggable-layout/workspace/workspace.browser.test.mjs
```

브라우저 테스트는 위젯 복원 후 공유 상태 유지, breakpoint 전환 시 PTZ 종료 및 로컬 슬롯 초기화, breakpoint별 배치·Undo/Redo·취소를 검증한다.
