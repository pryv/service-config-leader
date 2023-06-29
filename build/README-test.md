# Build and test Local Docker containers

Tools to test Docker image builds.

Requires an AMD64 machine with Docker accessible at user level.

1. Build images from the [release-packaging project](https://github.com/pryv/dev-release-packaging) on the local machine
2. `./build/build test` to build test Docker images
3. get the configuration files you need from https://api.pryv.com/config-template-pryv.io/
4. from the configuration dir run `./init-leader`
5. edit `config-leader/config-leader.yml` and change the image to `localhost/pryvio/config-leader:test`
6. replace `/var/pryv` by your own path 
7. launch `./run-config-leader`


# License

[UNLICENSED](LICENSE)
