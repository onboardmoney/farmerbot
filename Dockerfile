FROM node:14 as development

ENV NODE_ENV=development
WORKDIR /usr/src/app

COPY package.json ./package.json
COPY packages/bot/package.json ./packages/bot/package.json
COPY packages/bot/dist/ ./packages/bot/dist/

RUN yarn install

FROM node:14 as production


ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./package.json
COPY packages/bot/package.json ./packages/bot/package.json

RUN yarn install --only=production
COPY --from=development /usr/src/app/packages/bot/dist ./packages/bot/dist/

CMD ["node", "packages/bot/dist/main"]