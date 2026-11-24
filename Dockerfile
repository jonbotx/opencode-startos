FROM ghcr.io/anomalyco/opencode:2.4.1@sha256:10e340e3e86d7b23e95cd9960f5a934beae8a87593d7398b5629b6112ed1fc63

# OpenCode shells out to git and bash, which the Alpine base omits.
RUN apk add --no-cache git bash openssh-client
