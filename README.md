# OIDC Provider on Node

Open ID Connect server, a part of my portofolio app.

## TODO:

- update getConfig() to return default value

### Build docker image

```bash
# Image for development
npm run builddev  # multi-archtechture
# or
docker build -t $IMAGE_NAME .

# Image for production (multi platform)
npm run buildprod

# build docker image for a sample client
cd client
docker build -t auth_sample_client .
```

### Required environment variables

- SECRETKEY - secret key for app
- OIDCCONFIGURATION - OIDC server configuration
- JWKS - JSON Web key Set
- DATABASE_URI - URI for Database
- NODE_ENV - for production environment, set "production"
- ISSUER - URL for OIDC server itself
- REDIS_URL - URL for redis server
- USER_CREATION_ALLOWED - set any value if you want to allow user to create an account
- REDIS_CONNECTION_TLS - set any value if you want to connect to Redis server over TLS

### Run docker containers

```bash
# Start containers
docker-compose up -d
# Stop and delete containers
docker-compose down
```

### How to run test client?

To do that you can open another terminal and run the following command:

```bash
cd client
npm start
# then open http://localhost:3001
```
