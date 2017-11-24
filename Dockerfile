# FROM risingstack/alpine:3.3-v8.5.0-1.1.3
# FROM risingstack/alpine-node-ci
FROM node:slim
# FROM node:alpine
# FROM node:8.5.0
# FROM keymetrics/pm2-docker-alpine:latest
# FROM keymetrics/pm2:latest

# FROM mhart/alpine-node

# FROM alpine:edge
# Update
# RUN apk add --update nodejs=8.5.0 nodejs-npm

# USER root

RUN npm install yarn -g
RUN npm install pm2 -g 

ENV appdir ./rest-server

# ENV appdir appx
# RUN mkdir ${appdir}

# Install app dependencies
COPY package.json ${appdir}/package.json

# Bundle APP files
COPY . ${appdir}/

# Install app dependencies
# ENV NPM_CONFIG_LOGLEVEL warn

WORKDIR ${appdir}

RUN yarn install

EXPOSE 8080

# USER node

CMD ["pm2-docker", "start", "--raw", "dev2.yml", "--env", "no-epg"]

# ENV NODE_ENV no-epg
# CMD ["node", "-r", "babel-register", "-r", "babel-polyfill", "app.js"]
