# OIDC Provider on Node

### Build docker image

```bash
docker build -t $IMAGENAME .
```

### Run docker container

```bash
# Start container
docker run -d -p 3000:3000 --name $APPNAME $IMAGENAME
# Stop container
docker stop $APPNAME && docker rm $APPNAME
```
