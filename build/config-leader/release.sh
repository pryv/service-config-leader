#!/bin/bash
set -e
source /pd_build/buildconfig

target_dir="/app/bin"
log_dir="/app/log"
conf_dir="/app/conf"
cred_dir="/app/credentials"

header "Install application from release.tar"

run mkdir -p $target_dir
run chown app $target_dir

# This will avoid getting DOSed by unicode.org because of the unicode npm package.
minimal_apt_get_install unicode-data

# Unpack the application and run npm install.
pushd $target_dir
run run tar --owner app -xf /pd_build/release.tar

# TODO: clean this up (for now we npm-install both here and in the release workflow;
#       the build process need refactoring to be aligned with the other projects'
npm install

# Install the config file
run mkdir -p $conf_dir && \
  run cp /pd_build/config/config-leader.json $conf_dir/

# Create the log
run mkdir -p $log_dir && \
  run touch $log_dir/config-leader.log && run chown -R app:app $log_dir

# Create the credentials dir
run mkdir -p $cred_dir && \
  run touch $cred_dir/credentials.txt && run chown -R app:app $cred_dir

# Install the script that runs the api service
run cp -r /pd_build/runit/* /etc/runit/
run mv /etc/runit/runit.sh /etc/init.d/
run mkdir /etc/service/runit
run ln -s /etc/init.d/runit.sh /etc/service/runit/run #make a link to /etc/service (will be run with runit).

# Make /root/.config/ property of "app" user
run mkdir -p /root/.config/
run chmod a+rx /root
run chown -R app:app /root/.config/
