# OIDC Provider on Node

### Build docker image

```bash
# Image for production
docker build -t $IMAGE .
# Image for development
docker build -t nodeapp-dev -f Dockerfile-dev .
```

### Run docker container

```bash
# Start container
docker run -d -p 3000:3000 --name $APPNAME $IMAGE
# Stop container
docker stop $APPNAME && docker rm $APPNAME
```

### Run Testing client

```bash
cd client && npm start
```
