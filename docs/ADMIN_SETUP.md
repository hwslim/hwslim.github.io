# ERILab 관리자 로그인 연결

공개 홈페이지는 기존 GitHub Pages와 `erilab.xyz`에서 운영합니다. 관리자 화면은 Decap CMS이며, GitHub 로그인 인증만 Cloudflare Workers에서 처리합니다. Python 서버나 데이터베이스는 필요하지 않습니다.

현재 `public/admin/config.json`의 `backend.base_url`은 비어 있습니다. 아래 설정을 완료하기 전에는 `/admin/`에 최초 설정 안내가 표시됩니다. 실제 GitHub 로그인·저장·운영 배포 검증은 설정 이후에 진행해야 합니다.

## 1. Cloudflare Worker 생성

1. [Cloudflare](https://dash.cloudflare.com/sign-up)에 가입합니다. 도메인의 DNS를 Cloudflare로 옮길 필요는 없습니다.
2. 대시보드의 **Workers & Pages → Create application**에서 Worker를 만들고 이름을 `erilab-auth`로 정합니다.
3. 코드 편집 화면에서 저장소의 [worker.mjs](../auth-worker/worker.mjs) 전체를 넣어 배포합니다. 코드에 비밀 값을 직접 넣지 않습니다.
4. 배포된 `https://erilab-auth.<계정>.workers.dev` 주소를 기록합니다. 이 주소의 `/health`는 인증 서버가 실행 중인지 확인하는 경로입니다.

Cloudflare 메뉴 이름은 변경될 수 있습니다. [공식 대시보드 배포 안내](https://developers.cloudflare.com/workers/get-started/dashboard/)를 참고하세요. Worker의 무료 요금제에는 요청 한도가 있으므로 [현재 요금과 한도](https://developers.cloudflare.com/workers/platform/pricing/)를 확인할 수 있습니다.

## 2. GitHub OAuth 앱 등록

[GitHub OAuth 앱 등록](https://github.com/settings/applications/new)에서 다음을 입력합니다. 앱 소유자는 관리자 운영을 맡을 GitHub 계정으로 정합니다.

| 항목 | 값 |
| --- | --- |
| Application name | ERILab CMS |
| Homepage URL | `https://erilab.xyz` |
| Authorization callback URL | `https://erilab-auth.<계정>.workers.dev/callback` |

앱 생성 후 Client ID를 확인하고 Client secret을 생성합니다. **Client secret은 채팅이나 공개 저장소에 올리지 않고 Cloudflare의 Secret에 직접 입력합니다.** 자세한 내용은 [GitHub OAuth 앱 생성 안내](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)를 참고하세요.

## 3. Worker 변수와 Secret 설정

Worker의 **Settings → Variables and Secrets**에서 아래 값을 설정한 다음 배포합니다.

| 이름 | 종류 | 값 |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | Variable | GitHub OAuth 앱의 Client ID |
| `GITHUB_CLIENT_SECRET` | Secret | 생성한 Client secret |
| `SITE_ORIGIN` | Variable | `https://erilab.xyz` |
| `REPO` | Variable | `hwslim/hwslim.github.io` |

대시보드에 **Preview URLs** 설정이 있다면 운영 Worker URL을 사용하세요. GitHub 앱의 Callback URL도 같은 운영 주소여야 합니다. 변수/Secret 설정은 [Cloudflare 공식 안내](https://developers.cloudflare.com/workers/configuration/secrets/)를 참고하세요.

CLI를 사용하는 경우 Node.js 22 환경에서 `auth-worker` 폴더로 이동해 `npx wrangler@4 login`, `npx wrangler@4 secret put GITHUB_CLIENT_SECRET`, `npx wrangler@4 deploy --var GITHUB_CLIENT_ID:<Client-ID>` 순서로 진행할 수도 있습니다. `wrangler.toml`에는 비밀 값을 기록하지 않습니다.

## 4. CMS에 인증 서버 주소 등록

저장소의 `public/admin/config.json`에서 `backend.base_url`만 실제 Worker 주소로 바꿉니다. 주소 끝에 `/`를 붙이지 않습니다.

```json
"backend": {
  "name": "github",
  "repo": "hwslim/hwslim.github.io",
  "branch": "main",
  "base_url": "https://erilab-auth.<계정>.workers.dev",
  "auth_endpoint": "auth"
}
```

`main`에 저장하면 기존 GitHub Actions가 사이트를 자동 배포합니다. 배포 완료 후 `https://erilab.xyz/admin/`에서 GitHub 로그인을 합니다. 저장소에 **Write 이상** 권한이 있는 계정만 사용할 수 있으며, 현재 편집 초대를 수락한 GitHub 계정이 해당됩니다. 운영 계정에 이 저장소 접근 권한이 있는지는 [Collaborators 설정](https://github.com/hwslim/hwslim.github.io/settings/access)에서 확인합니다.

인증 과정에서 요청하는 `public_repo`는 GitHub의 공개 저장소 쓰기 권한 범위입니다. Worker는 그 계정에 ERILab 저장소 쓰기 권한이 있는지도 확인합니다. [GitHub OAuth 권한 범위](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)와 [Decap GitHub backend](https://decapcms.org/docs/github-backend/)의 동작을 사용합니다.

## 최초 실제 동작 확인

1. `/admin/`의 GitHub 로그인에서 쓰기 권한이 있는 계정으로 로그인합니다.
2. 첫 페이지의 문구 하나를 수정해 저장합니다. GitHub에 커밋이 생기고 Actions가 성공한 뒤 공개 페이지에 바뀐 문구가 보이는지 확인합니다.
3. 소식이나 테스트 구성원 항목을 추가하고 사진을 업로드합니다. 공개 화면에 표시되는 것을 확인한 뒤 테스트 항목을 삭제합니다.
4. 테스트 구성원을 Alumni로 변경하고 이동한 기관을 입력해 저장합니다. 사진·이메일·CV·학위가 제거되고 이름·기관만 표시되는지 확인합니다.
5. 쓰기 권한이 없는 계정의 로그인은 거부되는지 확인합니다.

## 일상적인 업데이트

- **홈페이지 설정**: 연구실 이름, 메뉴 이름, 로고, 첫 페이지 문구·이미지, 페이지 제목·소개, 연락처·모집 문구를 수정합니다.
- **구성원**: 항목을 추가하고 구분·학위·직함을 선택 버튼으로 지정합니다. 학생은 Ph.D./M.S./Undergraduate 과정과 학교 이름을 입력합니다. 학생 카드에는 이름 아래 회색 글씨로 학교를 표시하며, 과정은 그룹 제목에만 표시합니다. 전문연구요원은 별도 스위치입니다. Researchers는 직급순으로 자동 정렬하고 같은 직급 안에서는 표시 순서 숫자를 사용합니다.
- **Alumni 이동**: 기존 구성원을 열고 구분에서 **Alumni로 이동**을 선택합니다. 이동한 기관·진로를 입력한 다음 저장합니다. 사진·이메일·CV·학위 등 현 구성원 정보가 제거됩니다. Alumni는 이름과 이동한 기관만 표시합니다.
- **CV**: 웹 링크 또는 PDF 파일을 선택 사항으로 등록합니다. 업로드는 파일당 10 MB 이하, 이미지는 PNG/JPEG/WebP, CV 파일은 PDF를 사용합니다.
- **논문**: 제목·저자·학회 또는 arXiv·연도·링크를 입력합니다. 강조는 공식 자료로 확인된 Oral/Spotlight만 선택합니다. Accepted 등 다른 배지는 없습니다.
- **소식**: 날짜·제목·본문·사진을 입력합니다. 최신 소식이 첫 페이지에 자동 표시됩니다.
- **갤러리**: 새 항목에서 제목·촬영일·사진을 입력하고 필요하면 설명을 적습니다. 사진은 한 장씩 등록하며 추가·수정·삭제할 수 있습니다. 최신 날짜부터 Gallery에 표시되고 사진을 누르면 원본이 새 탭에서 열립니다. 메뉴 이름과 페이지 제목·소개·빈 목록 문구는 **홈페이지 설정**에서 수정합니다.

저장하면 GitHub 커밋과 자동 빌드를 거쳐 공개 페이지에 반영됩니다. 즉시 반영되는 서버 방식과 달리 배포 완료까지 기다려야 합니다. 진행 상태와 실패 이유는 [Actions](https://github.com/hwslim/hwslim.github.io/actions)에서 볼 수 있습니다. 잘못 입력한 내용은 관리자에서 다시 수정하거나 GitHub 커밋을 되돌릴 수 있습니다.

별도 회원가입이나 `admin/admin` 계정은 사용하지 않습니다. 관리자 비밀번호는 GitHub의 **Settings → Password and authentication**에서 변경합니다. 관리자를 추가하거나 제외할 때는 저장소의 Collaborators 권한을 변경합니다.

Alumni 이동 후 사용하지 않는 프로필 사진과 업로드 파일은 새 공개 빌드에서 제외합니다. **공개 GitHub 저장소의 이전 커밋에는 과거에 공개했던 파일이 남을 수 있습니다.** 원본 파일을 저장소에서도 제거하려면 CMS 미디어 목록에서 삭제하고, 과거 기록까지 삭제할 필요가 있다면 별도의 기록 정리가 필요합니다. 이 사이트에는 공개할 자료만 업로드합니다.

새 페이지 종류·기능·레이아웃 변경은 코드 수정이 필요합니다. 관리자에서 편집할 수 있는 범위는 준비된 페이지의 문구·이미지·항목입니다.
