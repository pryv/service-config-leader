SCRIPT_FOLDER=$(cd $(dirname "$0"); pwd)

export PRYV_CONF_ROOT=$SCRIPT_FOLDER

# Create default directories
mkdir -p ${PRYV_CONF_ROOT}/files/conf
mkdir -p ${PRYV_CONF_ROOT}/files/log
mkdir -p ${PRYV_CONF_ROOT}/files/data
mkdir -p ${PRYV_CONF_ROOT}/files/database

HOSTNAME=l.rec.la docker-compose -f ${PRYV_CONF_ROOT}/config-leader.yml up
