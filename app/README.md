# over-view prototype

정적 서버에서 `app/index.html`을 열어 MVP UI를 확인할 수 있습니다.

## Local preview

브라우저 보안 정책 때문에 JSON fetch가 차단될 수 있으므로 간단한 정적 서버를 권장합니다.

```bash
python -m http.server 8000
```

프로젝트 루트에서 실행한 뒤 `http://localhost:8000/app/`으로 접속합니다.

> 현재 데이터는 실제 지도/교통 API가 아니라 MVP 검증용 샘플 View Point입니다.
