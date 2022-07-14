FROM node:latest

WORKDIR /src/app

COPY package*.json ./

COPY tsconfig.json ./

RUN npm install

COPY ./ ./

EXPOSE 80

CMD ["npm","run","dev"]

