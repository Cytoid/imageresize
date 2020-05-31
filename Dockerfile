FROM node:14-alpine
WORKDIR /usr/src/app

COPY . .

RUN yarn install \
  --production \
  --non-interactive \
  --frozen-lockfile

EXPOSE 8040

CMD [ "node", "server.js" ]
