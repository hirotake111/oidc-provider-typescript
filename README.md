# OIDC Provider on Node

### Build docker image

```bash
# Image for development
npm run builddev

# Image for production (multi platform)
npm run buildprod
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
