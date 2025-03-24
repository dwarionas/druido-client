FROM node:20

WORKDIR /app

COPY package*.json ./

RUN yarn

COPY . .

RUN yarn build

EXPOSE 8000

CMD ["yarn", "dev"]
