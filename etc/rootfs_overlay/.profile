#!/bin/ash

_init_crontab() {
    sudo mkdir -p /var/spool/cron/crontabs
    sudo touch /var/spool/cron/crontabs/root
    sudo chown root:crontab /var/spool/cron/crontabs/root

    # add a cron job to run cat /proc/meminfo every 1s and output to hvc1
    echo "* * * * * while true; do cat /proc/meminfo > /dev/hvc1; sleep 1; done" | sudo tee -a /var/spool/cron/crontabs/root

    # start cron daemon
    sudo crond
}

_config_stats_output() {
    # send raw input to hvc1 for stats output
    exec sudo -s "stty raw < /dev/hvc1"
}

_config_bundled_scrips() {
    sudo chown -R daiplg /home/daiplg
    sudo chmod +x /home/daiplg/selfctl
    sudo mv /home/daiplg/selfctl /usr/bin/selfctl
}

_init_crontab
_config_stats_output
_config_bundled_scrips

# tell user to run the selfctl command to know more about the system
echo "
This is a minimal system for running the V86 emulator.
You can run the command \`selfctl\` to know more about the system.
It will show you the available commands and their usage.

Check the README.md file in the /home/daiplg directory for more information.

The repository for this system is available at:
https://github.com/daipham3213/bitbox.git
"