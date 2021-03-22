# OIDC Provider on Node

### Build docker image

```bash
# Image for development
docker build -t nodeapp-dev -f Dockerfile-dev .

# Image for production (multi platform)
# Need to register qemu interpreters with binfmt_misc by hand.
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
docker buildx build --push --platform linux/arm/v7,linux/amd64  -t $IMAGE .
```

### Run docker container

```bash
# Start container
docker-compose up -d
# Stop container
docker-compose down
```

### Run Testing client

```bash
cd client && npm start
```
