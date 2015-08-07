#! /bin/sh
echo 1 > /sys/class/gpio/Watchdog\ Disable/value
mount -o rw,remount /
/jci/scripts/set_lvds_speed_restriction_config.sh enable
/jci/scripts/set_speed_restriction_config.sh enable
yes | cp -rf /jci/gui/apps/emnavi /jci/gui/apps/emnavi.bak
/bin/cp -rf /mnt/sd?1/install/jci/controls/Compass/* /jci/gui/apps/emnavi/controls/Compass
/bin/cp -rf /mnt/sd?1/install/jci/templates/Compass/* /jci/gui/apps/emnavi/templates/Compass
yes | cp /mnt/sd?1/install/jcipatch/emnaviApp.js /jci/gui/apps/emnavi/js/
ln -s /tmp/mnt/sd_nav /jci/gui/apps/emnavi/controls/Compass/resources
/jci/tools/jci-dialog --title="Enhanced Compass Applied" --text="Compass Replacement have finished running" --ok-label='OK' --no-cancel &

sleep 10

killall jci-dialog