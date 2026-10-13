# 이전 및 배포 인계

현재 작업 폴더는 `/home/sohee/workspace/labpage/github-pages`이고, 원본 저장소 `hwslim/hwslim.github.io`를 복제한 뒤 `migrate-erilab-cms` 브랜치에서 작업했습니다. 원본 Flask 프로젝트는 상위 폴더에 그대로 있습니다.

## 반영한 내용

- 기존 공개 페이지 구성과 CSS, 휴머노이드 로고, 프로필 사진, 구성원/Alumni, 연구 주제, 논문을 Next.js 정적 페이지로 이전했습니다.
- DB에서 공개 필드만 `content/**/*.json`으로 내보냈습니다. 초기 이전 수량은 현 구성원 4명 + Alumni 5명, 연구 주제 2개, 논문 41편, 소식 0개입니다.
- 첫 페이지 사람 소개 제외, Latest News, 논문 연도순 목록, Researchers 직급순 정렬, 학생 과정별 그룹을 유지했습니다.
- Decap CMS 편집 스키마, 선택 버튼, CV 파일/링크, 사진 업로드, Alumni 이동 시 프로필 제거를 추가했습니다.
- 로그인용 Cloudflare Worker와 실제 운영 설정 안내를 추가했습니다. OAuth 앱 Secret은 저장소에 없습니다.
- GitHub Actions가 PR에서는 검증/빌드만 수행하고 `main`에서는 기존 Pages 배포를 수행하도록 구성했습니다.
- 도메인 `erilab.xyz`와 CNAME을 유지했습니다. 사용하지 않는 프로필 사진·업로드 파일은 새 공개 빌드에서 제외합니다.

## 완료한 로컬 검증

- 콘텐츠 및 관리자 스키마: JSON 56개(설정 4개 + 콘텐츠 52개) 검증.
- 기능 테스트: 내용/정렬/Alumni/CV/발표 강조 7개, OAuth 4개, 관리자 초기화/저장 2개, 미사용 미디어 제외 1개 통과.
- TypeScript 검사 및 Next.js 정적 빌드 통과.
- 로컬 HTTP에서 Home/Research/People/Publications/News/Contact의 제목과 기사 내용을 기존 Flask 사이트와 비교해 일치 확인.
- 공개 CSS는 기존 CSS와 동일합니다. viewport 및 760/440px 모바일 규칙을 유지했습니다.
- 내부 링크와 이미지 파일, 기존 주소 3개, 관리자 정적 파일, CNAME, DB/로그인 서명 키 미포함 확인.
- 임시 소식·석사 학생·포닥·전문연구요원·CV PDF·사진·Spotlight 논문을 넣은 빌드에서도 표시와 정렬, 미사용 파일 제외를 확인한 뒤 테스트 자료를 제거했습니다.

브라우저 조작 환경이 없어 화면 렌더링·휴대폰 실제 화면은 별도로 확인해야 합니다. Worker 테스트에서는 GitHub 응답을 모의 처리했습니다. 실제 GitHub 로그인, CMS 저장 커밋, 사진 업로드, 원격 Actions와 운영 도메인 변경은 외부 계정 연결 후 확인해야 합니다.

## 저장소에 반영

이 환경에는 원격 GitHub 쓰기 인증이 연결되어 있지 않습니다. GitHub 연결을 설치·인증하면 이 브랜치를 원격에 올려 반영할 수 있습니다. 또는 GitHub에 로그인할 수 있는 로컬 환경에서 다음을 실행합니다.

```bash
cd /home/sohee/workspace/labpage/github-pages
git push origin migrate-erilab-cms
```

GitHub에서 `migrate-erilab-cms` → `main` Pull Request를 열어 확인하고 병합하면 기존 Actions가 자동 배포합니다. [PR 작성 화면](https://github.com/hwslim/hwslim.github.io/compare/main...migrate-erilab-cms)과 [Actions](https://github.com/hwslim/hwslim.github.io/actions)에서 확인할 수 있습니다. 브랜치가 업로드되기 전에는 비교 화면이 나타나지 않습니다.

다른 컴퓨터로 옮길 때는 별도로 제공하는 Git bundle을 기존 저장소에서 가져올 수 있습니다.

```bash
git fetch /path/to/erilab-pages-migration.bundle migrate-erilab-cms:migrate-erilab-cms
git switch migrate-erilab-cms
git push origin migrate-erilab-cms
```

`main` 병합 후 공개 사이트는 바로 배포할 수 있지만, 관리자 로그인은 [ADMIN_SETUP.md](ADMIN_SETUP.md)의 Cloudflare/GitHub OAuth 설정까지 완료해야 합니다. 설정 전 `/admin/`은 최초 설정 안내를 표시합니다.

## 로컬 미리보기

정적 결과물은 `out/`이며 작업 당시 `http://127.0.0.1:8001`에서 실행했습니다. 기존 Flask 확인판은 `http://127.0.0.1:8000`입니다. 프로세스가 종료되었다면 이전판을 다음과 같이 다시 열 수 있습니다.

```bash
cd /home/sohee/workspace/labpage/github-pages
npm run build
python3 -m http.server 8001 --bind 127.0.0.1 --directory out
```
