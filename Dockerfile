# 빌드 스테이지: 코드 난독화 및 최소화
FROM node:alpine AS build

# 작업 디렉토리 설정
WORKDIR /app

# 소스 코드 복사
COPY . .

# 필요한 도구 설치
RUN npm install -g html-minifier-terser terser uglify-js

# HTML 파일 최소화
RUN find . -name "*.html" -exec html-minifier-terser \
    --collapse-whitespace \
    --remove-comments \
    --remove-optional-tags \
    --remove-redundant-attributes \
    --remove-script-type-attributes \
    --minify-css true \
    --minify-js true \
    {} -o {} \;

# JavaScript 파일 난독화 및 최소화
RUN find . -name "*.js" -exec terser {} \
    --compress \
    --mangle \
    --toplevel \
    -o {} \;

# CSS 파일 최소화
RUN find . -name "*.css" -exec sh -c 'cat {} | npx clean-css-cli -o {}' \;

# 최종 이미지: 최소화된 코드만 포함
FROM nginx:alpine

# Nginx 설정: 8080 포트 사용 (Cloud Run 요구사항)
RUN sed -i 's/listen\(.*\)80;/listen 8080;/' /etc/nginx/conf.d/default.conf

# Nginx의 기본 인덱스 페이지 제거
RUN rm -rf /usr/share/nginx/html/*

# 최소화/난독화된 코드만 복사
COPY --from=build /app /usr/share/nginx/html

# 직접 접근 방지를 위한 Nginx 설정 추가
RUN echo 'server_tokens off;' >> /etc/nginx/conf.d/default.conf

# 추가 보안 헤더 설정
RUN echo 'add_header X-Frame-Options "SAMEORIGIN";' >> /etc/nginx/conf.d/default.conf
RUN echo 'add_header X-Content-Type-Options "nosniff";' >> /etc/nginx/conf.d/default.conf
RUN echo 'add_header X-XSS-Protection "1; mode=block";' >> /etc/nginx/conf.d/default.conf

# 소스 맵 파일 제거 (디버깅에 사용될 수 있음)
RUN find /usr/share/nginx/html -name "*.map" -delete

# 8080 포트 노출 (Cloud Run 요구사항)
EXPOSE 8080

# Nginx 시작
CMD ["nginx", "-g", "daemon off;"]
