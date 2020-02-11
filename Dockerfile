FROM node:alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
RUN NODE_ENV=production npm ci
EXPOSE 80
CMD ["npm", "start"]