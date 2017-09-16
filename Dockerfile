FROM node:8.2.1

# Create application directory
RUN mkdir -p /opt/app
WORKDIR /opt/app

# Install dependencies
COPY package.json .
COPY semantic.json .
COPY semantic/ .

RUN npm install

EXPOSE 9000
EXPOSE 8080

CMD [ "npm", "start" ]
