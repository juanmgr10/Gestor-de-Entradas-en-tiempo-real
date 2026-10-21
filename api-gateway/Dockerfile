FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Cachea dependencias antes de copiar el código
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
USER node
EXPOSE 4000
CMD ["node", "src/server.js"]
