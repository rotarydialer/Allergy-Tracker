FROM node:8.2.1

# Create application directory
RUN mkdir -p /opt/app
WORKDIR /opt/app

# Install dependencies
COPY package.json .
COPY index.js .
COPY semantic.json .
COPY assets assets/
COPY config config/
COPY templates templates/

RUN npm install

EXPOSE 9000
EXPOSE 8080

CMD [ "npm", "start" ]

# NOTE: I moved the Docker directory to a drive with more space via the following steps:

# 1) Set the -g option on DOCKER_OPTS
vim /etc/default/docker # DOCKER_OPTS="-dns 8.8.8.8 -dns 8.8.4.4 -g /mnt/whatever-drive/pr    og/docker"

# 2) Stop Docker
sudo service docker stop

# 3) Move the docker folder
mv /var/lib/docker /mnt/whatever-drive/prog/docker

# 4) Create a symlink
ln -s /mnt/whatever-drive/prog/docker /var/lib/docker

# 5) Start Docker back up
service docker start
