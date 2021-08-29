# OIDC Provider on Node

### Build docker image

```bash
# Image for development
npm run builddev

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
# Start container
docker-compose up -d
# Stop container
docker-compose down
```

### How to run test client?

To do that you can open anothe terminal and run the following command:

```bash
cd client && npm start
```
