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
docker-compose up -d
# Stop container
docker-compose down
```

### Run Testing client

```bash
cd client && npm start
```
