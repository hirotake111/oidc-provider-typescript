
if [ ! $IMAGE ]; then
    echo "You need to set IMAGE environment variable before kicking this off"
    exit 0;
fi

# Need to register qemu interpreters with binfmt_misc by hand.
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
docker buildx build --push --platform linux/arm/v7,linux/amd64  -t $IMAGE .