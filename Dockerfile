FROM node:24-alpine

RUN apk add --no-cache ffmpeg python3

WORKDIR /app

COPY ["package.json",  "package-lock.json", "./"]

RUN npm install

COPY [".", "."]

RUN chown -R node:node /app

USER node

RUN npm run migrate

CMD ["npm", "run", "dev"]
