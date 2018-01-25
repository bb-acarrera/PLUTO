# Plugins Overview

## Setting up a test environment

It's recommended to develop new plugins outside of the source folders to prevent conflicts when updating the base code from GitHub. To set up your environment:

 * pull PLUTO from github 
 * build PLUTO via `npm run build`
 * tag the build via `npm run tag_images`
 * copy {PLTUO}/Release/deploy to another location outside of PLUTO
 * If needed, update the provided Dockerfile and add any dependecies your plugins will need
   * build your custom container via `docker build -t pluto:my_custom_container .`
   * update the `initPluto.sh` to start your custom pluto container
 * put your custom plugins in the sample_config/customRules folder (don't forget to update the sample_config/customRules/manifest.json)
 * start PLUTO via `initPluto.sh`

If manual testing is need, the PLUTO container can be started in a bash shell via:
```bash
# docker run -v $PWD/sample_config:/opt/PLUTO/config --net=plutonet -ti pluto:{your_tag} /bin/sh
```