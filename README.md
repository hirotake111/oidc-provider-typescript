# OIDC Provider on Node

Open ID Connect server, a part of my portofolio app.

### Build docker image

```bash
# Image for development
npm run builddev  # multi-archtechture
# or
docker build -t $IMAGE_NAME .

# Image for production (multi platform)
npm run buildprod
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

### Run docker container

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
