FROM node:20-alpine

WORKDIR /app

# 依存関係を先にインストールしてキャッシュ効率を高める
COPY package.json package-lock.json ./
RUN npm ci

# ソースをコピー (compose では bind mount で上書きする想定)
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
