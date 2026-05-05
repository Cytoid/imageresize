FROM oven/bun:alpine
WORKDIR /usr/src/app

COPY . .

RUN bun install \
  --production \
  --frozen-lockfile

EXPOSE 8040

CMD [ "bun", "server.js" ]
