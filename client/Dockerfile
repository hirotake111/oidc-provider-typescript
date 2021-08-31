FROM node:14.12.0

#
# Build stage
#
WORKDIR /app
COPY *.json ./
# Install dev modules
# RUN npm install --also=dev
RUN npm install --no-optional
# Copy and compile files
COPY src ./src

USER user
EXPOSE 3000
CMD [ "node", "src/index.js" ]