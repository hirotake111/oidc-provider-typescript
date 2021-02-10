# OIDC Provider on Node

### Build docker image

```bash
# Image for development
docker build -t $IMAGE -f Dockerfile-dev .
# Image for production
docker build -t $IMAGE .
```

### Run docker container

```bash
# Start container
docker run -d -p 3000:3000 --name $APPNAME $IMAGE
# Stop container
docker stop $APPNAME && docker rm $APPNAME
```
