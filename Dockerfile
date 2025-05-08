FROM nginx:alpine

# Nginx 기본 포트를 8080으로 변경 (Cloud Run 요구사항)
RUN sed -i 's/listen\(.*\)80;/listen 8080;/' /etc/nginx/conf.d/default.conf

# 정적 파일을 Nginx의 서비스 디렉토리로 복사
COPY . /usr/share/nginx/html

# 포트 8080 노출
EXPOSE 8080

# Nginx 시작
CMD ["nginx", "-g", "daemon off;"]
