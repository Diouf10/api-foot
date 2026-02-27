FROM node:20-alpine

WORKDIR /app

COPY package.json ./
# (Optionnel) package-lock si tu veux des installs reproductibles
COPY package-lock.json ./

RUN npm install --omit=dev

COPY server.js ./
COPY openapi.json ./

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
