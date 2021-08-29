FROM node:14.12.0 AS builder

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
RUN npm run build

FROM node:14.12.0
WORKDIR /app
# Add user
RUN groupadd -r user && useradd --no-log-init -r -g user user
# Copy files
COPY package*.json ./
COPY --from=builder /app/dist /app/dist
COPY /src/views /app/dist/views
COPY /src/public /app/dist/public

# Install modules
RUN npm install --only=prod --no-optional

USER user
EXPOSE 3000
CMD [ "node", "dist/index.js" ]