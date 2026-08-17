FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server ./server
COPY public ./public
COPY tasks ./tasks
COPY scripts ./scripts
# Soal grinding mode di-generate pas build image: kunci jawaban dihitung dari
# reference solution dan divalidasi di sini, jadi soal yang salah bikin build
# gagal — bukan ketahuan pas user ngerjain.
RUN node scripts/build-tasks.mjs
EXPOSE 80
ENV PORT=80
CMD ["node", "server/index.js"]
